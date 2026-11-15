import { decryptLovePayload, encryptLovePayload } from '../lib/love-crypto.mjs';
import { validateLoveRecord, shanghaiToday } from '../lib/love-records.mjs';
import { formatLoveDate } from '../lib/love-dates.mjs';
import '../styles/love-editor.css';

export interface PhotoValue { title:string; caption:string; date?:string; category:'couple'|'travel'|'daily'; mime:'image/webp'; data:string; width:number; height:number; }
export interface DiaryValue { title:string; date:string; body:string; author:string; }
export interface AnniversaryValue { title:string; date:string; repeat:'once'|'yearly'; note:string; }
type EntryType = 'photo' | 'diary' | 'anniversary';
type Metadata = {id:string;type:EntryType;etag:string;createdAt:string};
export type LoveEntry = Metadata & ({type:'photo';value:PhotoValue} | {type:'diary';value:DiaryValue} | {type:'anniversary';value:AnniversaryValue});
export interface LoveEditorOptions { config:{apiUrl:string;token:string}; password:string; signal:AbortSignal; onChange:(entries:LoveEntry[])=>void; }
let nextField = 0;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function element<K extends keyof HTMLElementTagNameMap>(tag:K, className = '', text = ''):HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
}
function action(text:string, callback:()=>void, className = 'love-button') {
  const node=element('button',className,text);node.type='button';node.addEventListener('click',callback);return node;
}
function field(label:string, input:HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement) {
  const wrapper=element('label','editor-field'); input.id=`love-edit-${++nextField}`;wrapper.htmlFor=input.id;wrapper.append(element('span','',label),input);return wrapper;
}
function input(type:string,maxLength?:number) { const node=element('input');node.type=type;if(maxLength)node.maxLength=maxLength;return node; }
function textArea(maxLength:number,rows=4) { const node=element('textarea');node.maxLength=maxLength;node.rows=rows;return node; }
function select(values:[string,string][]) { const node=element('select');values.forEach(([value,label])=>{const item=element('option','',label);item.value=value;node.append(item);});return node; }
function formStatus() { const node=element('p','editor-message');node.setAttribute('role','status');node.setAttribute('aria-live','polite');return node; }
function details(title:string,copy:string) { const node=element('details','editor-details');node.append(element('summary','',title),element('p','editor-intro',copy));return node; }
function busy(form:HTMLFormElement,value:boolean) { form.setAttribute('aria-busy',String(value));form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|HTMLButtonElement>('input,textarea,select,button').forEach(node=>node.disabled=value); }
function metadata(value:unknown):Metadata {
  const item=value as Partial<Metadata>;
  if (!item || !uuidPattern.test(item.id??'') || !['photo','diary','anniversary'].includes(item.type??'') || typeof item.etag!=='string' || !item.etag || item.etag.length>200 || typeof item.createdAt!=='string' || !Number.isFinite(new Date(item.createdAt).getTime())) throw new Error('记录索引暂时无法读取。');
  return item as Metadata;
}
/** Keep the stored version independent of CDN representation transformations. */
export function readEntryMetadata(response:Pick<Response,'headers'>, fallback:Metadata):Metadata {
  const version=(value:string|null)=>{
    if(!value)return null;
    // Older deployments exposed only ETag. Cloudflare can prefix the unchanged
    // R2 version with W/ when compressing the response; writes need the raw tag.
    const candidate=value.trim().replace(/^W\//,'');
    const match=/^(?:"([A-Za-z0-9._:-]{1,128})"|([A-Za-z0-9._:-]{1,128}))$/.exec(candidate);
    return match?`"${match[1]??match[2]}"`:null;
  };
  const etag=[response.headers.get('X-Entry-ETag'),response.headers.get('ETag'),fallback.etag].map(version).find(Boolean);
  const timestamp=response.headers.get('X-Entry-Created-At');
  const createdAt=timestamp&&Number.isFinite(new Date(timestamp).getTime())?timestamp:fallback.createdAt;
  return metadata({...fallback,etag,createdAt});
}
class SaveError extends Error { constructor(message:string,readonly status=0) {super(message);} }

/** All form contents and decrypted records stay in memory; storage receives envelopes only. */
export function createLoveEditor(options:LoveEditorOptions) {
  options={...options,config:{...options.config}};
  let secret=options.password, token=options.config.token;
  const apiUrl=new URL(options.config.apiUrl).origin;
  const controller=new AbortController();
  let stopped=false, syncing=false, syncComplete=false, syncHadFailure=false;
  const records=new Map<string,LoveEntry>(), mutations=new Map<string,number>();
  const previewUrls=new Set<string>();
  const photoEditor=details('上传照片','把新的合照、旅行和日常收进来。保存后，你们在其他设备上也能看到。');
  const anniversaryEditor=details('添加纪念日','记下一次约会、一个特别的日子，或每年都想一起庆祝的时刻。');
  const diaryPanel=element('section');
  const diaryHeading=element('header','panel-heading');diaryHeading.append(element('h2','','把今天写给以后'),element('p','','留下当天的心情、想记住的小事，和想说给彼此听的话。'));diaryPanel.append(diaryHeading);
  const statusElement=element('div','editor-sync'), syncText=element('p','','正在连接我们的纪念册…');syncText.setAttribute('role','status');
  const refresh=action('刷新共同记录',()=>{void start();},'text-button');statusElement.append(syncText,refresh);
  const active=()=>!stopped&&!controller.signal.aborted;
  const assertActive=()=>{if(!active())throw new DOMException('已锁定。','AbortError');};
  const snapshot=()=>[...records.values()].map(item=>({...item,value:{...item.value}})) as LoveEntry[];
  function notify() { if(!active())return;renderDiaries();options.onChange(snapshot()); }
  function setMessage(node:HTMLElement,text:string,error=false) {if(!active())return;node.textContent=text;node.classList.toggle('is-error',error);}
  async function api(path:string,init:RequestInit={}) {
    assertActive();const headers=new Headers(init.headers);headers.set('Authorization',`Bearer ${token}`);
    let response:Response;
    try {response=await fetch(`${apiUrl}${path}`,{...init,headers,cache:'no-store',signal:controller.signal});}
    catch {assertActive();throw new SaveError('连接暂时中断，内容仍在这里。请稍后重试。');}
    assertActive();
    if(!response.ok) {
      const messages:Record<number,string>={401:'连接授权已失效，请锁定后重新打开纪念册。',403:'当前地址暂时不能连接共同记录。',409:'这条记录已在另一台设备更新。你的文字仍保留在表单里，请先刷新并查看最新版本。',413:'照片处理后仍然过大，请换一张或减小尺寸后重试。',428:'保存版本已过期，请刷新共同记录后再试。',503:'共同记录暂时无法连接，请稍后重试。'};
      throw new SaveError(messages[response.status]??'这次没有保存成功，内容仍在表单里。请重试。',response.status);
    }
    return response;
  }
  async function read(meta:Metadata):Promise<LoveEntry> {
    const response=await api(`/api/entries/${meta.id}`);
    const envelope=await response.json();assertActive();
    const decoded=await decryptLovePayload(envelope,secret);assertActive();
    const value=validateLoveRecord(meta.type,decoded);
    return {...readEntryMetadata(response,meta),value} as LoveEntry;
  }
  async function save(type:EntryType,id:string,value:PhotoValue|DiaryValue|AnniversaryValue,previous?:LoveEntry) {
    assertActive();const normalized=validateLoveRecord(type,value);
    mutations.set(id,(mutations.get(id)??0)+1);
    const encrypted=await encryptLovePayload(normalized,secret);assertActive();
    const body=JSON.stringify(encrypted);
    if(body.length>6*1024*1024)throw new SaveError('照片处理后仍然过大，请换一张或减小尺寸后重试。');
    let item:LoveEntry;
    try {
      const response=await api(`/api/entries/${id}?type=${type}`,{method:'PUT',headers:{'Content-Type':'application/json',...(previous?{'If-Match':previous.etag}:{'If-None-Match':'*'})},body});
      const meta=metadata(await response.json());assertActive();
      if(meta.id!==id||meta.type!==type)throw new SaveError('保存结果暂时无法确认，请重试。');
      item={...meta,value:normalized} as LoveEntry;
    } catch(error) {
      // A connection can drop after a successful write. Reuse the UUID and verify
      // the already stored value instead of creating a second record on retry.
      if(!(error instanceof SaveError)||error.status!==409)throw error;
      const existing=await read({id,type,etag:previous?.etag??'pending',createdAt:previous?.createdAt??new Date().toISOString()});
      if(JSON.stringify(existing.value)!==JSON.stringify(normalized))throw error;
      item=existing;
    }
    assertActive();records.set(id,item);mutations.set(id,(mutations.get(id)??0)+1);notify();
    if(!syncing) setMessage(syncText,syncComplete?`共同记录已同步 · ${records.size} 条`:`已保存这次更新 · 当前已读取 ${records.size} 条，其他记录尚未完整同步。`,!syncComplete);
    return item;
  }
  async function start() {
    if(syncing||!active())return;
    syncing=true;refresh.disabled=true;setMessage(syncText,'正在同步你们的共同记录…');
    const atStart=new Map(mutations);let failures=0;
    try {
      const found=new Map<string,Metadata>(),seenCursors=new Set<string>();let cursor:string|null=null;
      do {
        const response=await api(`/api/entries${cursor?'?cursor='+encodeURIComponent(cursor):''}`);
        const page=await response.json() as {items?:unknown[];cursor?:unknown};assertActive();
        if(!Array.isArray(page.items))throw new SaveError('记录索引暂时无法读取，请重试。');
        for(const item of page.items){const meta=metadata(item);found.set(meta.id,meta);}
        if(page.cursor!==null&&page.cursor!==undefined&&typeof page.cursor!=='string')throw new SaveError('记录索引暂时无法读取，请重试。');
        cursor=typeof page.cursor==='string'&&page.cursor?page.cursor:null;
        if(cursor){if(seenCursors.has(cursor)||seenCursors.size>1000)throw new SaveError('记录较多，尚未同步完成，请稍后重试。');seenCursors.add(cursor);}
      }while(cursor);
      const queue=[...found.values()];let next=0;
      await Promise.all(Array.from({length:Math.min(3,queue.length)},async()=>{
        while(next<queue.length&&active()) {
          const meta=queue[next++];
          if(records.get(meta.id)?.etag===meta.etag)continue;
          try {const value=await read(meta);if((mutations.get(meta.id)??0)===(atStart.get(meta.id)??0))records.set(meta.id,value);}
          catch {if(!active())return;failures++;}
        }
      }));
      assertActive();syncComplete=failures===0;syncHadFailure=failures>0;notify();
      setMessage(syncText,failures?`有 ${failures} 条记录未同步成功，已显示读取成功的内容。可点击刷新重试。`:`共同记录已同步 · ${records.size} 条`,failures>0);
    }catch(error){if(active()){syncHadFailure=true;syncComplete=false;notify();setMessage(syncText,error instanceof Error?`${error.message} 尚未同步全部记录。`:'尚未同步全部记录，请重试。',true);}}
    finally {if(active()){syncing=false;refresh.disabled=false;}}
  }

  // Photo form. Preview only re-encoded raster data, never an untrusted source URL.
  const photoForm=element('form','editor-form');
  const files=input('file');files.accept='image/jpeg,image/png,image/webp';files.multiple=true;
  const photoTitle=input('text',80), photoCaption=textArea(1000,3), photoDate=input('date');
  const category=select([['couple','合照'],['travel','旅行'],['daily','日常']]);
  const preview=element('div','editor-photo-previews'),photoMessage=formStatus(),photoSubmit=element('button','love-button primary','保存照片');photoSubmit.type='submit';
  photoForm.append(field('选择照片（每次最多 10 张）',files),element('p','editor-help','支持 JPG、PNG、WebP，单张不超过 20 MB。会保留画面并压缩为适合浏览的尺寸。'),field('照片标题（多张会自动加序号）',photoTitle),field('照片分类',category),field('照片日期（选填）',photoDate),field('想记住的话（选填）',photoCaption),preview,photoSubmit,photoMessage);photoEditor.append(photoForm);
  type PendingPhoto={file:File;id:string;value?:PhotoValue;saved:boolean};
  let pendingPhotos:PendingPhoto[]=[],preparing=false,uploading=false,photoAttempt=0;
  function revokePreviews(){previewUrls.forEach(url=>URL.revokeObjectURL(url));previewUrls.clear();preview.replaceChildren();}
  async function convert(file:File):Promise<{value:PhotoValue;blob:Blob}> {
    if(file.size>20*1024*1024||file.size===0)throw new SaveError('请选择非空且不超过 20 MB 的照片。');
    const signature=new Uint8Array(await file.slice(0,12).arrayBuffer());assertActive();
    const jpeg=signature[0]===255&&signature[1]===216&&signature[2]===255;
    const png=signature[0]===137&&signature[1]===80&&signature[2]===78&&signature[3]===71;
    const webp=String.fromCharCode(...signature.slice(0,4))==='RIFF'&&String.fromCharCode(...signature.slice(8,12))==='WEBP';
    if(!jpeg&&!png&&!webp)throw new SaveError('请使用 JPG、PNG 或 WebP 照片。HEIC 请先转换为 JPG。');
    let bitmap:ImageBitmap;
    try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new SaveError('这张照片无法读取，请换一张照片重试。');}
    try {
      assertActive();if(bitmap.width*bitmap.height>60_000_000||bitmap.width<1||bitmap.height<1)throw new SaveError('照片尺寸过大，请先缩小到 6000 万像素以内。');
      const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const context=canvas.getContext('2d');if(!context)throw new SaveError('当前浏览器无法处理照片，请换一个浏览器。');
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const encode=(quality:number)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new SaveError('照片压缩未完成，请重试。')),'image/webp',quality));
      let blob=await encode(.82);assertActive();if(blob.size>3*1024*1024)blob=await encode(.66);assertActive();
      if(blob.type!=='image/webp'||blob.size>3*1024*1024)throw new SaveError('照片压缩后仍然过大，或浏览器不支持 WebP，请换一张重试。');
      const bytes=new Uint8Array(await blob.arrayBuffer());assertActive();let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
      return {blob,value:{title:file.name.replace(/\.[^.]+$/,'').slice(0,80)||'一起的回忆',caption:'',category:'couple',mime:'image/webp',data:btoa(binary),width:canvas.width,height:canvas.height}};
    }finally{bitmap.close();}
  }
  files.addEventListener('change',()=>{void(async()=>{
    if(!active()||uploading)return;const selection=[...(files.files??[])];photoAttempt++;const attempt=photoAttempt;revokePreviews();pendingPhotos=[];
    if(!selection.length){setMessage(photoMessage,'');return;}
    if(selection.length>10){files.value='';setMessage(photoMessage,'每次最多选择 10 张照片，请重新选择。',true);return;}
    preparing=true;busy(photoForm,true);setMessage(photoMessage,'正在准备照片预览…');
    try {
      for(const [index,file]of selection.entries()) {
        const result=await convert(file);assertActive();if(attempt!==photoAttempt)return;
        pendingPhotos.push({file,id:crypto.randomUUID(),value:result.value,saved:false});
        const url=URL.createObjectURL(result.blob);previewUrls.add(url);const frame=element('figure'),img=element('img');img.src=url;img.alt=`待上传照片 ${index+1}`;frame.append(img,element('figcaption','',result.value.title));preview.append(frame);
        setMessage(photoMessage,`已准备 ${index+1} / ${selection.length} 张照片`);
      }
      setMessage(photoMessage,`已准备好 ${pendingPhotos.length} 张照片，填写内容后点击保存。`);
    }catch(error){if(active()){pendingPhotos=[];revokePreviews();files.value='';setMessage(photoMessage,error instanceof Error?error.message:'照片暂时无法处理，请重试。',true);}}
    finally{if(active()){preparing=false;busy(photoForm,false);}}
  })();});
  photoForm.addEventListener('submit',event=>{event.preventDefault();void(async()=>{
    if(preparing||uploading||!active()||!photoForm.reportValidity())return;
    if(!pendingPhotos.length){setMessage(photoMessage,'请先选择要保存的照片。',true);return;}
    uploading=true;busy(photoForm,true);
    try {
      for(const [index,item]of pendingPhotos.entries()) {
        if(item.saved)continue;assertActive();
        const title=photoTitle.value.trim()?`${photoTitle.value.trim()}${pendingPhotos.length>1?` · ${index+1}`:''}`:item.value!.title;
        const value:PhotoValue={...item.value!,title:title.slice(0,80),caption:photoCaption.value,category:category.value as PhotoValue['category']};if(photoDate.value)value.date=photoDate.value;
        setMessage(photoMessage,`正在保存第 ${index+1} / ${pendingPhotos.length} 张照片…`);
        await save('photo',item.id,value);assertActive();item.saved=true;
      }
      const total=pendingPhotos.length;pendingPhotos=[];revokePreviews();photoForm.reset();setMessage(photoMessage,`${total} 张照片已保存到共同相册。`);
    }catch(error){if(active()){const saved=pendingPhotos.filter(item=>item.saved).length;setMessage(photoMessage,`${saved?`已保存 ${saved} 张。`:''}${error instanceof Error?error.message:'这次保存没有完成。'}再次保存会继续剩余照片。`,true);}}
    finally{if(active()){uploading=false;busy(photoForm,false);}}
  })();});

  // Diary form and its shared, searchable reading list.
  const diaryDetails=details('写一篇恋爱日记','不必写得很长，今天的一点开心也值得留下。'),diaryForm=element('form','editor-form');
  const diaryTitle=input('text',80),diaryDate=input('date'),diaryAuthor=input('text',40),diaryBody=textArea(12000,8);diaryTitle.required=true;diaryDate.required=true;diaryBody.required=true;diaryDate.value=shanghaiToday();
  const diaryMessage=formStatus(),diarySubmit=element('button','love-button primary','保存日记');diarySubmit.type='submit';
  const cancelEdit=action('取消编辑',()=>resetDiary(),'text-button');cancelEdit.hidden=true;
  const diaryActions=element('div','editor-actions');diaryActions.append(diarySubmit,cancelEdit);
  diaryForm.append(field('日记标题',diaryTitle),field('日期',diaryDate),field('写下这篇日记的人（选填）',diaryAuthor),field('今天想记住的事',diaryBody),diaryActions,diaryMessage);diaryDetails.append(diaryForm);
  const diarySearch=input('search');diarySearch.placeholder='搜索日记标题或正文';diarySearch.setAttribute('aria-label','搜索恋爱日记');const diarySearchField=field('找一段回忆',diarySearch);
  const diaryList=element('div','diary-list');diaryPanel.append(diaryDetails,diarySearchField,diaryList);
  let editing:LoveEntry|undefined,diaryId:string=crypto.randomUUID(),savingDiary=false;
  function resetDiary(){if(savingDiary)return;editing=undefined;diaryId=crypto.randomUUID();diaryForm.reset();diaryDate.value=shanghaiToday();diarySubmit.textContent='保存日记';cancelEdit.hidden=true;setMessage(diaryMessage,'');}
  function editDiary(entry:LoveEntry){if(entry.type!=='diary'||savingDiary)return;editing=entry;diaryId=entry.id;diaryTitle.value=entry.value.title;diaryDate.value=entry.value.date;diaryAuthor.value=entry.value.author;diaryBody.value=entry.value.body;diarySubmit.textContent='保存修改';cancelEdit.hidden=false;diaryDetails.open=true;setMessage(diaryMessage,'正在编辑这篇日记。保存后，两人的设备都会看到新内容。');diaryTitle.focus();}
  function renderDiaries() {
    const query=diarySearch.value.trim().normalize('NFKC').toLocaleLowerCase();
    const diaries=[...records.values()].filter((entry):entry is LoveEntry&{type:'diary';value:DiaryValue}=>entry.type==='diary').filter(entry=>`${entry.value.title} ${entry.value.body} ${entry.value.author}`.normalize('NFKC').toLocaleLowerCase().includes(query)).sort((a,b)=>b.value.date.localeCompare(a.value.date)||b.createdAt.localeCompare(a.createdAt));
    diaryList.replaceChildren();
    if(!diaries.length){diaryList.append(element('p','diary-empty',query?'没有找到这段回忆，换一个词试试。':syncComplete?'日记的第一页，留给你们一起写。':syncHadFailure?'日记尚未完整读取，请点击“刷新共同记录”后再查看。':'正在读取你们的日记…'));return;}
    diaries.forEach(entry=>{const article=element('article','diary-entry'),meta=element('p','diary-meta',`${formatLoveDate(entry.value.date)}${entry.value.author?` · ${entry.value.author}`:''}`),body=element('div','diary-body');entry.value.body.split(/\n\s*\n/).forEach(paragraph=>body.append(element('p','',paragraph)));article.append(meta,element('h3','',entry.value.title),body,action('编辑这篇日记',()=>editDiary(entry),'text-button'));diaryList.append(article);});
  }
  diarySearch.addEventListener('input',renderDiaries);renderDiaries();
  diaryForm.addEventListener('submit',event=>{event.preventDefault();void(async()=>{
    if(savingDiary||!active()||!diaryForm.reportValidity())return;savingDiary=true;busy(diaryForm,true);setMessage(diaryMessage,'正在保存日记…');
    try {await save('diary',diaryId,{title:diaryTitle.value,date:diaryDate.value,author:diaryAuthor.value,body:diaryBody.value},editing);assertActive();savingDiary=false;resetDiary();setMessage(diaryMessage,'日记已保存，下次打开仍能读到这一页。');}
    catch(error){if(active())setMessage(diaryMessage,error instanceof Error?error.message:'日记没有保存成功，请重试。',true);}
    finally{if(active()){savingDiary=false;busy(diaryForm,false);}}
  })();});

  const anniversaryForm=element('form','editor-form'),anniversaryTitle=input('text',80),anniversaryDate=input('date'),anniversaryRepeat=select([['once','只纪念这一天'],['yearly','每年这一天']]),anniversaryNote=textArea(1000,3);
  anniversaryTitle.required=true;anniversaryDate.required=true;anniversaryDate.value=shanghaiToday();
  const anniversaryMessage=formStatus(),anniversarySubmit=element('button','love-button primary','保存纪念日');anniversarySubmit.type='submit';
  anniversaryForm.append(field('纪念日名称',anniversaryTitle),field('日期',anniversaryDate),field('重复方式',anniversaryRepeat),field('关于这一天（选填）',anniversaryNote),anniversarySubmit,anniversaryMessage);anniversaryEditor.append(anniversaryForm);
  let anniversaryId=crypto.randomUUID(),savingAnniversary=false;
  anniversaryForm.addEventListener('submit',event=>{event.preventDefault();void(async()=>{
    if(savingAnniversary||!active()||!anniversaryForm.reportValidity())return;savingAnniversary=true;busy(anniversaryForm,true);setMessage(anniversaryMessage,'正在保存纪念日…');
    try {await save('anniversary',anniversaryId,{title:anniversaryTitle.value,date:anniversaryDate.value,repeat:anniversaryRepeat.value as 'once'|'yearly',note:anniversaryNote.value});assertActive();anniversaryId=crypto.randomUUID();anniversaryForm.reset();anniversaryDate.value=shanghaiToday();setMessage(anniversaryMessage,'纪念日已保存，可以在日历里找到这一天。');}
    catch(error){if(active())setMessage(anniversaryMessage,error instanceof Error?error.message:'纪念日没有保存成功，请重试。',true);}
    finally{if(active()){savingAnniversary=false;busy(anniversaryForm,false);}}
  })();});

  function stop() {
    if(stopped)return;stopped=true;controller.abort();secret='';token='';options.password='';options.config.token='';options.onChange=()=>{};editing=undefined;photoAttempt++;pendingPhotos=[];records.clear();mutations.clear();revokePreviews();
    for(const root of [photoEditor,anniversaryEditor,diaryPanel,statusElement]){root.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea').forEach(node=>node.value='');root.replaceChildren();}
    options.signal.removeEventListener('abort',stop);
  }
  options.signal.addEventListener('abort',stop,{once:true});if(options.signal.aborted)stop();
  return {photoEditor,diaryPanel,anniversaryEditor,statusElement,start,stop};
}

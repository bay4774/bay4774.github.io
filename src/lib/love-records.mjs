const DAY = 86400000;
/** @typedef {{title:string,caption:string,date?:string,category:'couple'|'travel'|'daily',mime:'image/webp',data:string,width:number,height:number}} PhotoValue */
/** @typedef {{title:string,date:string,body:string,author:string}} DiaryValue */
/** @typedef {{title:string,date:string,repeat:'once'|'yearly',note:string}} AnniversaryValue */
/** @typedef {{id:string,type:string,value:PhotoValue|DiaryValue|AnniversaryValue}} RecordEntry */

function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('记录格式无效。');
  return /** @type {Record<string, unknown>} */ (value);
}
function string(value, limit, required = false) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) throw new TypeError('请检查必填内容和文字长度。');
  return value.trim();
}
/** Accept real calendar dates, including leap days, independently of host timezone. */
export function validateRecordDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError('请填写有效日期。');
  const date = new Date(`${value}T00:00:00Z`);
  if (value.startsWith('0000') || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new TypeError('请填写有效日期。');
  return value;
}
/** @returns {PhotoValue | DiaryValue | AnniversaryValue} */
export function validateLoveRecord(type, value) {
  const source = object(value);
  const title = string(source.title, 80, true);
  if (type === 'photo') {
    if (!['couple', 'travel', 'daily'].includes(String(source.category)) || source.mime !== 'image/webp') throw new TypeError('照片分类或格式无效。');
    if (!Number.isInteger(source.width) || !Number.isInteger(source.height) || Number(source.width) < 1 || Number(source.height) < 1 || Number(source.width) > 1600 || Number(source.height) > 1600) throw new TypeError('照片尺寸无效。');
    const data = source.data;
    if (typeof data !== 'string' || !data.length || data.length > 5_000_000 || data.length % 4 || /[^A-Za-z0-9+/=]/.test(data)) throw new TypeError('照片数据无效。');
    let binary;
    try { binary = atob(data); } catch { throw new TypeError('照片数据无效。'); }
    if (btoa(binary) !== data || binary.slice(0, 4) !== 'RIFF' || binary.slice(8, 12) !== 'WEBP') throw new TypeError('照片数据无效。');
    const photo = /** @type {PhotoValue} */ ({ title, caption: string(source.caption ?? '', 1000), category: source.category, mime: source.mime, data, width: source.width, height: source.height });
    if (source.date !== undefined && source.date !== '') photo.date = validateRecordDate(source.date);
    return photo;
  }
  if (type === 'diary') return { title, date: validateRecordDate(source.date), body: string(source.body, 12000, true), author: string(source.author ?? '', 40) };
  if (type === 'anniversary') {
    if (source.repeat !== 'once' && source.repeat !== 'yearly') throw new TypeError('请选择纪念日的重复方式。');
    return { title, date: validateRecordDate(source.date), repeat: source.repeat, note: string(source.note ?? '', 1000) };
  }
  throw new TypeError('不支持这种记录。');
}
export function shanghaiToday(now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new TypeError('日期无效。');
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function dayNumber(date) { return new Date(`${date}T00:00:00Z`).getTime() / DAY; }
function occurrence(original, year) {
  const [, month, day] = original.split('-').map(Number);
  const value = new Date(0); value.setUTCFullYear(year, month, 0);
  return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(Math.min(day, value.getUTCDate())).padStart(2,'0')}`;
}
/** @param {RecordEntry[]} entries */
export function customAnniversaries(entries, now = new Date()) {
  const today = shanghaiToday(now), currentYear = Number(today.slice(0,4));
  return entries.filter(entry => entry.type === 'anniversary').map(entry => {
    const value = /** @type {AnniversaryValue} */ (validateLoveRecord('anniversary', entry.value));
    let date = value.date;
    if (value.repeat === 'yearly') {
      const year = Math.max(currentYear, Number(value.date.slice(0,4)));
      date = occurrence(value.date, year);
      if (date < today) date = occurrence(value.date, year + 1);
    }
    return { id: entry.id, title: value.title, date, daysUntil: dayNumber(date) - dayNumber(today), kind: 'custom', detail: value.note || (value.repeat === 'yearly' ? '每年一起记得这一天' : '属于我们的特别日子') };
  }).filter(entry => entry.daysUntil >= 0).sort((a,b) => a.daysUntil - b.daysUntil || a.id.localeCompare(b.id));
}
/** @param {RecordEntry[]} entries */
export function customDatesInMonth(entries, year, month) {
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) throw new TypeError('月份无效。');
  const prefix = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-`;
  return entries.filter(entry => entry.type === 'anniversary').flatMap(entry => {
    const value = /** @type {AnniversaryValue} */ (validateLoveRecord('anniversary', entry.value));
    if (year < Number(value.date.slice(0,4))) return [];
    const date = value.repeat === 'yearly' ? occurrence(value.date, year) : value.date;
    return date.startsWith(prefix) ? [{id:entry.id,title:value.title,date,kind:'custom',detail:value.note || (value.repeat === 'yearly' ? '每年的纪念日' : '属于我们的特别日子')}] : [];
  });
}

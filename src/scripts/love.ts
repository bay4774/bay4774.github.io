import { decryptLovePayload } from '../lib/love-crypto.mjs';

interface Photo { title: string; caption: string; mime: string; data: string; width: number; height: number; }
interface Story { version: number; boyName: string; girlName: string; nickname: string; meetDate: string; intro: string; chapters: {title: string; text: string}[]; letter: {title: string; paragraphs: string[]; signature: string}; photos: Photo[]; music?: {title: string}; }
const main = document.querySelector<HTMLElement>('#main-content')!;
const gate = document.querySelector<HTMLElement>('#love-gate')!;
const storyRoot = document.querySelector<HTMLElement>('#love-story')!;
const form = document.querySelector<HTMLFormElement>('#love-form')!;
const passwordInput = document.querySelector<HTMLInputElement>('#love-password')!;
const submit = document.querySelector<HTMLButtonElement>('#unlock-love')!;
const message = document.querySelector<HTMLElement>('#password-message')!;
const lockButton = document.querySelector<HTMLButtonElement>('#lock-love')!;
const togglePassword = document.querySelector<HTMLButtonElement>('#toggle-password')!;
const dialog = document.querySelector<HTMLDialogElement>('#photo-dialog')!;
const largePhoto = document.querySelector<HTMLImageElement>('#photo-large')!;
let password = '';
let story: Story | null = null;
let urls: string[] = [];
let photoUrls: string[] = [];
let currentPhoto = 0;
let audio: HTMLAudioElement | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
let observer: IntersectionObserver | null = null;
let generation = 0;
let request: AbortController | null = null;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function blobUrl(data: string, mime: string) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], {type: mime}));
  urls.push(url);
  return url;
}
function showPhoto(index: number) {
  if (!story) return;
  currentPhoto = (index + story.photos.length) % story.photos.length;
  const photo = story.photos[currentPhoto];
  largePhoto.src = photoUrls[currentPhoto];
  largePhoto.alt = photo.title;
  document.querySelector('#photo-title')!.textContent = photo.title;
  document.querySelector('#photo-caption')!.textContent = photo.caption;
  document.querySelector('#photo-position')!.textContent = `${currentPhoto + 1} / ${story.photos.length}`;
  if (!dialog.open) dialog.showModal();
}
function imageButton(photo: Photo, index: number, lazy = true) {
  const button = element('button');
  button.type = 'button';
  button.setAttribute('aria-label', `查看照片：${photo.title}`);
  const img = element('img');
  img.src = photoUrls[index];
  img.alt = photo.title;
  img.width = photo.width;
  img.height = photo.height;
  img.loading = lazy ? 'lazy' : 'eager';
  button.append(img);
  button.addEventListener('click', () => showPhoto(index));
  return button;
}
async function fetchEnvelope(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {cache: 'no-store', signal});
  if (!response.ok) throw new Error('RESOURCE_UNAVAILABLE');
  return response.json();
}
function renderStory(data: Story) {
  storyRoot.replaceChildren();
  photoUrls = data.photos.map(photo => blobUrl(photo.data, photo.mime));
  // Keep object URLs while viewing, rather than a second copy of all base64 images.
  data.photos.forEach(photo => { photo.data = ''; });
  const heading = element('header', 'story-heading');
  const names = element('div');
  const title = element('h1', '', '我们的故事');
  title.tabIndex = -1;
  names.append(title, element('p', '', `${data.boyName} 与 ${data.girlName}，把日子一页页留住。`));
  const actions = element('div', 'story-heading-actions');
  const readLetter = element('a', 'love-button primary', '读那封信 ↗');
  readLetter.href = '#our-letter';
  actions.append(readLetter);
  let musicStatus: HTMLElement | undefined;
  if (data.music) {
    const music = element('button', 'love-button', `播放《${data.music.title}》`);
    music.type = 'button';
    music.setAttribute('aria-pressed', 'false');
    musicStatus = element('p', 'music-status');
    musicStatus.setAttribute('role', 'status');
    music.addEventListener('click', async () => {
      const session = generation;
      if (audio && !audio.paused) {
        audio.pause();
        music.textContent = `播放《${data.music!.title}》`;
        music.setAttribute('aria-pressed', 'false');
        return;
      }
      music.disabled = true;
      musicStatus!.textContent = '正在打开音乐…';
      try {
        if (!audio) {
          const envelope = await fetchEnvelope(main.dataset.songUrl!, request?.signal);
          if (session !== generation) return;
          const media = await decryptLovePayload(envelope, password) as {mime: string; data: string};
          if (session !== generation) return;
          audio = new Audio(blobUrl(media.data, media.mime));
          audio.loop = true;
        }
        await audio.play();
        if (session !== generation) return;
        music.textContent = '暂停音乐';
        music.setAttribute('aria-pressed', 'true');
        musicStatus!.textContent = '';
      } catch {
        if (session === generation) musicStatus!.textContent = '音乐暂时无法播放，请点击重试。';
      } finally { music.disabled = false; }
    });
    actions.append(music);
  }
  heading.append(names, actions);
  const facts = element('div', 'story-facts');
  const date = new Date(data.meetDate);
  const dateText = new Intl.DateTimeFormat('zh-CN', {timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'}).format(date);
  const since = element('div');
  since.append(element('p', '', '故事的起点'), element('strong', '', dateText));
  const elapsed = element('div');
  const days = element('strong');
  elapsed.append(element('p', '', '相识至今'), days);
  const moment = element('div');
  const clock = element('strong');
  moment.append(element('p', '', '时间还在继续'), clock);
  const tick = () => {
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    days.textContent = `${Math.floor(seconds / 86400)} 天`;
    clock.textContent = `${Math.floor(seconds % 86400 / 3600)} 时 ${Math.floor(seconds % 3600 / 60)} 分 ${seconds % 60} 秒`;
  };
  tick(); timer = setInterval(tick, 1000);
  facts.append(since, elapsed, moment);
  const strip = element('div', 'story-strip');
  strip.setAttribute('aria-label', '回忆照片，可横向滑动');
  data.photos.slice(0, 6).forEach((photo, index) => strip.append(imageButton(photo, index, false)));
  const chapters = element('section', 'story-chapters');
  chapters.setAttribute('aria-label', '相遇与心动');
  data.chapters.forEach(chapter => {
    const section = element('div');
    section.append(element('h2', '', chapter.title), element('p', '', chapter.text));
    chapters.append(section);
  });
  const album = element('section');
  album.id = 'our-album';
  const albumHeading = element('div', 'album-heading');
  albumHeading.append(element('h2', '', '一起收藏的瞬间'), element('p', '', `${data.photos.length} 张照片，装着旅行，也装着日常。点击任意一张，慢慢看。`));
  const gallery = element('div', 'album-grid');
  data.photos.forEach((photo, index) => {
    const figure = element('figure', 'memory-photo');
    figure.append(imageButton(photo, index), element('figcaption', '', photo.title));
    gallery.append(figure);
  });
  album.append(albumHeading, gallery);
  const letter = element('section', 'letter');
  letter.id = 'our-letter';
  const letterBody = element('div', 'letter-body');
  data.letter.paragraphs.forEach(paragraph => letterBody.append(element('p', '', paragraph)));
  letterBody.append(element('p', 'letter-signature', data.letter.signature));
  letter.append(element('h2', '', data.letter.title), letterBody);
  const bottom = element('div', 'story-bottom');
  const close = element('button', 'love-button', '收好回忆，锁定页面');
  close.type = 'button'; close.addEventListener('click', () => lock());
  bottom.append(element('p', '', '下一次，再一起翻到这里。'), close);
  storyRoot.append(heading);
  if (musicStatus) storyRoot.append(musicStatus);
  storyRoot.append(facts, strip, element('p', 'story-intro', data.intro), chapters, album, letter, bottom);
  gate.hidden = true; storyRoot.hidden = false; lockButton.hidden = false;
  window.scrollTo({top: 0, behavior: 'instant'});
  title.focus({preventScroll: true});
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.animate([{opacity: .4, transform: 'translateY(18px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 500, easing: 'ease-out'});
      observer?.unobserve(entry.target);
    }), {threshold: .08});
    storyRoot.querySelectorAll('.story-heading,.story-facts>div,.story-strip>button,.story-intro,.story-chapters>div,.memory-photo,.letter>h2,.letter-body>p').forEach(node => observer!.observe(node));
  }
}
function lock(focus = true) {
  generation++;
  request?.abort(); request = null;
  observer?.disconnect(); observer = null;
  if (timer) clearInterval(timer);
  timer = undefined;
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; }
  dialog.close(); largePhoto.removeAttribute('src'); largePhoto.alt = '';
  for (const id of ['photo-title', 'photo-caption', 'photo-position']) document.getElementById(id)!.textContent = '';
  storyRoot.replaceChildren(); storyRoot.hidden = true;
  urls.forEach(url => URL.revokeObjectURL(url)); urls = []; photoUrls = [];
  story = null; password = ''; passwordInput.value = ''; passwordInput.type = 'password';
  togglePassword.textContent = '显示'; togglePassword.setAttribute('aria-label', '显示密码'); togglePassword.setAttribute('aria-pressed', 'false');
  passwordInput.removeAttribute('aria-invalid'); form.removeAttribute('aria-busy');
  gate.hidden = false; lockButton.hidden = true; submit.disabled = false;
  submit.innerHTML = '打开纪念册 <span aria-hidden="true">↗</span>';
  message.textContent = '';
  if (focus) { window.scrollTo({top: 0, behavior: 'instant'}); passwordInput.focus({preventScroll: true}); }
}
togglePassword.addEventListener('click', () => {
  const reveal = passwordInput.type === 'password';
  passwordInput.type = reveal ? 'text' : 'password';
  togglePassword.textContent = reveal ? '隐藏' : '显示';
  togglePassword.setAttribute('aria-label', reveal ? '隐藏密码' : '显示密码');
  togglePassword.setAttribute('aria-pressed', String(reveal));
});
passwordInput.addEventListener('input', () => passwordInput.removeAttribute('aria-invalid'));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled || !form.reportValidity()) return;
  if (!window.crypto?.subtle) { message.textContent = '请使用 HTTPS 或本机 localhost 地址打开纪念册。'; return; }
  const attempt = passwordInput.value;
  const session = ++generation;
  request?.abort(); request = new AbortController();
  submit.disabled = true; submit.textContent = '正在打开…'; form.setAttribute('aria-busy', 'true');
  passwordInput.removeAttribute('aria-invalid'); message.textContent = '正在读取纪念册，请稍候…';
  let envelope;
  try { envelope = await fetchEnvelope(main.dataset.vaultUrl!, request.signal); }
  catch {
    if (session !== generation) return;
    message.textContent = '纪念册暂时无法加载，请检查网络后重试。';
    submit.disabled = false; submit.textContent = '重新打开纪念册'; form.removeAttribute('aria-busy'); return;
  }
  try {
    message.textContent = '正在验证密码…';
    const data = await decryptLovePayload(envelope, attempt) as Story;
    if (session !== generation) return;
    if (data.version !== 1 || !Array.isArray(data.photos) || !data.photos.length || !Number.isFinite(Date.parse(data.meetDate))) throw new Error('INVALID_STORY');
    password = attempt; story = data; passwordInput.value = '';
    renderStory(data);
    message.textContent = '';
  } catch {
    if (session !== generation) return;
    // A malformed authenticated payload must also leave no partially rendered content.
    lock(false);
    message.textContent = '密码不正确，或纪念册文件已损坏，请重试。';
    passwordInput.setAttribute('aria-invalid', 'true'); passwordInput.focus();
  } finally {
    if (session === generation) { submit.disabled = false; submit.textContent = '打开纪念册 ↗'; form.removeAttribute('aria-busy'); }
  }
});
lockButton.addEventListener('click', () => lock());
document.querySelector('#close-photo')!.addEventListener('click', () => dialog.close());
document.querySelector('#previous-photo')!.addEventListener('click', () => showPhoto(currentPhoto - 1));
document.querySelector('#next-photo')!.addEventListener('click', () => showPhoto(currentPhoto + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1)); }
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
window.addEventListener('pagehide', () => lock(false));
window.addEventListener('pageshow', event => { if (event.persisted) lock(false); });

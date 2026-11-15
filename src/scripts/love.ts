import { decryptLovePayload } from '../lib/love-crypto.mjs';
import { getLoveStats, getAnniversaries, formatLoveDate } from '../lib/love-dates.mjs';
import { createLoveEditor, type LoveEntry } from './love-editor';
import { customAnniversaries, customDatesInMonth } from '../lib/love-records.mjs';
import '../styles/love-editor.css';

interface Photo { title: string; caption: string; mime: string; data: string; width: number; height: number; category?: 'travel' | 'daily' | 'couple'; date?: string; location?: string; trip?: string; dateLabel?: string; }
interface Letter { id: string; title: string; context: string; date?: string; paragraphs: string[]; signature: string; }
interface Story { version: number; boyName: string; girlName: string; nickname: string; meetDate: string; relationshipDate: string; intro: string; heroPhotoIndex?: number; storyPhotoIndexes?: number[]; cloud?: {apiUrl:string;token:string}; chapters: {title: string; text: string}[]; letter: {title: string; paragraphs: string[]; signature: string}; letters?: Letter[]; loveNotes?: {title: string; text: string}[]; photos: Photo[]; music?: {title: string; lyrics?: string[]}; }
type PanelId = 'today' | 'story' | 'album' | 'diary' | 'dates' | 'letters' | 'music';
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
let urls: string[] = [], photoUrls: string[] = [], viewerIndexes: number[] = [];
let currentPhoto = 0;
let audio: HTMLAudioElement | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
let observer: IntersectionObserver | null = null;
let generation = 0;
let request: AbortController | null = null;
let dateRefreshers: (() => void)[] = [];
let musicButtons: HTMLButtonElement[] = [];
let musicLoading = false;
let musicStatus: HTMLElement | null = null;
let selectPanel: (id: PanelId, focus?: boolean) => void = () => {};
let editor: ReturnType<typeof createLoveEditor> | null = null;
let cloudEntries: LoveEntry[] = [];
let albumView = {category:'all', query:'', trip:''};
let calendarView: {year:number;month:number;selected:string} | null = null;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function allAnniversaries(data: Story, now = new Date()) {
  return [...getAnniversaries(data.meetDate, data.relationshipDate, now), ...customAnniversaries(cloudEntries, now)]
    .sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title, 'zh-CN'));
}

function e<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function button(text: string, action: () => void, className = 'love-button') {
  const node = e('button', className, text); node.type = 'button'; node.addEventListener('click', action); return node;
}
function go(text: string, panel: PanelId, className = 'text-button') { return button(text, () => selectPanel(panel, true), className); }
function heading(title: string, description: string) {
  const head = e('header', 'panel-heading'); head.append(e('h2', '', title), e('p', '', description)); return head;
}
function blobUrl(data: string, mime: string) {
  const binary = atob(data), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], {type: mime})); urls.push(url); return url;
}
function showPhoto(index: number, indexes?: number[]) {
  if (!story) return;
  if (indexes) viewerIndexes = indexes;
  currentPhoto = index;
  const photo = story.photos[index];
  largePhoto.src = photoUrls[index]; largePhoto.alt = photo.title;
  document.querySelector('#photo-title')!.textContent = photo.title;
  const dateLabel = photo.dateLabel && !photo.trip?.includes(photo.dateLabel) ? photo.dateLabel : '';
  document.querySelector('#photo-caption')!.textContent = [photo.location, photo.trip, dateLabel, photo.caption].filter(Boolean).join(' · ');
  document.querySelector('#photo-position')!.textContent = `${viewerIndexes.indexOf(index) + 1} / ${viewerIndexes.length}`;
  if (!dialog.open) dialog.showModal();
}
function movePhoto(direction: number) {
  if (!viewerIndexes.length) return;
  const next = (viewerIndexes.indexOf(currentPhoto) + direction + viewerIndexes.length) % viewerIndexes.length;
  showPhoto(viewerIndexes[next]);
}
function imageButton(index: number, lazy = true, indexes?: () => number[]) {
  const photo = story!.photos[index];
  const node = button('', () => showPhoto(index, indexes?.() ?? story!.photos.map((_, i) => i)), 'photo-open');
  node.setAttribute('aria-label', `查看照片：${photo.title}（第 ${index + 1} 张）`);
  const img = e('img'); img.src = photoUrls[index]; img.alt = photo.title; img.width = photo.width; img.height = photo.height;
  img.loading = lazy ? 'lazy' : 'eager'; node.append(img); return node;
}
function figure(index: number, indexes?: () => number[]) {
  const node = e('figure', 'memory-photo'), photo = story!.photos[index], caption = e('figcaption');
  caption.append(e('strong', '', photo.title));
  if (photo.location) caption.append(e('p', 'photo-location', photo.location));
  if (photo.dateLabel) caption.append(e('p', 'photo-date', photo.dateLabel));
  node.append(imageButton(index, true, indexes), caption); return node;
}
async function fetchEnvelope(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {cache: 'no-store', signal});
  if (!response.ok) throw new Error('RESOURCE_UNAVAILABLE'); return response.json();
}
function updateMusicButtons() {
  for (const node of musicButtons) {
    const playing = !!audio && !audio.paused;
    node.textContent = musicLoading ? '正在打开音乐…' : playing ? '暂停音乐' : '播放我们的歌';
    node.disabled = musicLoading; node.setAttribute('aria-pressed', String(playing));
  }
}
async function toggleMusic() {
  if (!story?.music || musicLoading) return;
  const session = generation;
  if (audio && !audio.paused) { audio.pause(); return; }
  musicLoading = true; updateMusicButtons();
  if (musicStatus) musicStatus.textContent = '第一次播放需要读取歌曲，请稍候。';
  try {
    if (!audio?.getAttribute('src')) {
      const envelope = await fetchEnvelope(main.dataset.songUrl!, request?.signal);
      if (session !== generation) return;
      const media = await decryptLovePayload(envelope, password) as {mime: string; data: string};
      if (session !== generation || !audio) return;
      audio.src = blobUrl(media.data, media.mime); audio.hidden = false;
    }
    await audio!.play();
    if (session === generation && musicStatus) musicStatus.textContent = '切换栏目时，音乐会继续陪着你。';
  } catch {
    if (session === generation && musicStatus) musicStatus.textContent = '音乐暂时无法播放，请再试一次。';
  } finally { if (session === generation) { musicLoading = false; updateMusicButtons(); } }
}
function musicButton(className = 'love-button') {
  const node = button('播放我们的歌', () => { void toggleMusic(); }, className); node.setAttribute('aria-pressed', 'false'); musicButtons.push(node); return node;
}
function overview(data: Story) {
  const panel = e('section');
  const cover = e('div', 'couple-cover'), words = e('div', 'cover-words');
  const title = e('h2'); title.append(document.createTextNode('从心动，'), e('br'), document.createTextNode('到我们。'));
  const dayCount = e('div', 'relationship-count'), day = e('strong');
  dayCount.append(e('span', '', '在一起的第'), day, e('span', '', '天'));
  const stats = e('div', 'relationship-facts');
  const met = e('strong'), waiting = e('strong');
  for (const [label, value] of [['正式在一起', e('strong', '', formatLoveDate(data.relationshipDate))], ['相识至今', met], ['从相识到相恋', waiting]] as const) {
    const fact = e('div'); fact.append(e('p', '', label), value); stats.append(fact);
  }
  dateRefreshers.push(() => { const values = getLoveStats(data.meetDate, data.relationshipDate); day.textContent = String(values.togetherDayNumber); met.textContent = `${values.metDays} 天`; waiting.textContent = `${values.waitingDays} 天`; });
  const actions = e('div', 'cover-actions'); actions.append(go('一起翻相册 ↗', 'album', 'love-button primary'), go('看看我们的纪念日', 'dates'));
  words.append(e('p', 'couple-names', `${data.boyName} & ${data.girlName}`), title, e('p', 'cover-since', `${formatLoveDate(data.relationshipDate)}，我们正式在一起了。`), dayCount, e('p', 'cover-message', '从这一天起，喜欢有了回应，往后的日子也有了同一个名字：我们。'), actions);
  const photo = e('figure', 'cover-photo'), heroIndex = Math.min(Math.max(data.heroPhotoIndex ?? 0, 0), data.photos.length - 1);
  photo.append(imageButton(heroIndex, false), e('figcaption', '', '你在镜头里，也在我想认认真真过好的日子里。'));
  cover.append(words, photo); panel.append(cover, stats);
  const today = e('div', 'today-grid'), next = e('article', 'next-anniversary'), nextTitle = e('h3'), nextCount = e('strong'), nextTime = e('p');
  const nextBig = e('div', 'anniversary-big'); nextBig.append(nextCount, e('span', '', '天后'));
  next.append(nextTitle, nextBig, nextTime, go('打开纪念日日历 ↗', 'dates'));
  dateRefreshers.push(() => { const upcoming = allAnniversaries(data)[0]; if (upcoming) { nextTitle.textContent = upcoming.title; nextCount.textContent = String(upcoming.daysUntil); nextBig.lastElementChild!.textContent = upcoming.daysUntil === 0 ? '就是今天' : '天后'; nextTime.textContent = formatLoveDate(upcoming.date); } });
  const note = e('article', 'today-letter'); note.append(e('h3', '', '有些话，想一直说给你听'), e('p', '', '以前想把喜欢说给你听。现在想把每一个普通的明天，都和你一起过得认真。'), go('打开写给你的信 ↗', 'letters'));
  today.append(next, note); panel.append(today);
  const memoryHead = e('div', 'section-heading'); memoryHead.append(e('h3', '', '把你放进每一页回忆'), go(`查看全部 ${data.photos.length} 张 ↗`, 'album'));
  const preview = e('div', 'memory-preview');
  [data.storyPhotoIndexes?.[0] ?? 1, 5, 8, 12].filter(index => index < data.photos.length).forEach(index => preview.append(figure(index)));
  panel.append(memoryHead, preview);
  if (data.loveNotes?.length) {
    const promises = e('section', 'promise-section'), list = e('div', 'promise-list');
    data.loveNotes.forEach(note => { const item = e('div'); item.append(e('h4', '', note.title), e('p', '', note.text)); list.append(item); });
    promises.append(e('h3', '', '把喜欢，慢慢做成日常'), list); panel.append(promises);
  }
  return panel;
}
function storyPanel(data: Story) {
  const panel = e('section'); panel.append(heading('故事从相遇开始', '有些日子有清楚的日期，有些片段只记得当时的心动。它们都属于我们。'));
  const timeline = e('ol', 'story-timeline');
  for (const event of [{date: data.meetDate, title: '我们相识了', text: data.intro}, {date: data.relationshipDate, title: '这一次，故事叫「我们」', text: '喜欢有了明确的回应。我们正式确立了恋爱关系，开始一起写往后的日子。'}]) {
    const item = e('li'), time = e('time', 'timeline-date', formatLoveDate(event.date)); time.dateTime = event.date;
    const copy = e('div', 'timeline-copy'); copy.append(e('h3', '', event.title), e('p', '', event.text)); item.append(time, copy); timeline.append(item);
  }
  const scenes = e('div', 'story-scenes');
  data.chapters.forEach((chapter, index) => {
    const scene = e('article', 'scene'), photo = e('figure'), copy = e('div');
    const photoIndex = data.storyPhotoIndexes?.[index] ?? [1, 12, 5][index % 3] % data.photos.length;
    photo.append(imageButton(photoIndex));
    const place = data.photos[photoIndex].location;
    if (place) photo.append(e('figcaption', '', place));
    copy.append(e('h3', '', chapter.title), e('p', '', chapter.text)); scene.append(photo, copy); scenes.append(scene);
  });
  panel.append(timeline, scenes); return panel;
}
function albumPanel(data: Story) {
  const panel = e('section'); panel.append(heading('回忆可以反复看', '旅行的风景，生活的小事，还有镜头里最想留下的人。'));
  if (editor) panel.append(editor.photoEditor);
  const tools = e('div', 'album-tools'), filters = e('div', 'album-filters'); filters.setAttribute('aria-label', '相册分类');
  const searchLabel = e('label', 'album-search', '寻找回忆'), input = e('input'); input.id = 'album-search'; input.type = 'search'; input.placeholder = '搜索照片、地点或回忆'; input.setAttribute('aria-label', '搜索照片'); input.value = albumView.query; searchLabel.append(input);
  const tripLabel = e('label', 'album-trip', '旅行行程'), tripSelect = e('select'); tripSelect.id = 'album-trip';
  const trips = [...new Set(data.photos.map(photo => photo.trip).filter((trip): trip is string => !!trip))];
  for (const trip of ['', ...trips]) { const option = e('option', '', trip || '全部行程'); option.value = trip; tripSelect.append(option); }
  tripSelect.value = trips.includes(albumView.trip) ? albumView.trip : ''; tripLabel.append(tripSelect);
  const count = e('p', 'album-count'); count.setAttribute('role', 'status');
  const grid = e('div', 'album-grid'), empty = e('p', 'album-empty', '还没有找到这段回忆，换一个词试试。'); empty.hidden = true;
  let category = albumView.category, visibleIndexes: number[] = [];
  const filterButtons: HTMLButtonElement[] = [];
  function update() {
    albumView = {category, query:input.value, trip:tripSelect.value};
    const query = input.value.trim().normalize('NFKC').toLocaleLowerCase();
    visibleIndexes = data.photos.map((photo, index) => ({photo, index})).filter(({photo}) => (category === 'all' || photo.category === category) && (!tripSelect.value || photo.trip === tripSelect.value) && [photo.title, photo.caption, photo.location, photo.trip, photo.dateLabel].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase().includes(query)).map(({index}) => index);
    grid.replaceChildren(); visibleIndexes.forEach(index => grid.append(figure(index, () => visibleIndexes)));
    count.textContent = `找到 ${visibleIndexes.length} 张回忆 · 共 ${data.photos.length} 张`; empty.hidden = visibleIndexes.length > 0;
    filterButtons.forEach(node => node.setAttribute('aria-pressed', String(node.dataset.category === category)));
  }
  for (const [id, title] of [['all', '全部回忆'], ['couple', '我们的合照'], ['travel', '旅行记忆'], ['daily', '日常里的你']]) {
    const total = id === 'all' ? data.photos.length : data.photos.filter(photo => photo.category === id).length;
    const node = button(`${title} · ${total}`, () => { category = id; update(); }, 'filter-button'); node.dataset.category = id; node.setAttribute('aria-pressed', String(id === 'all')); filterButtons.push(node); filters.append(node);
  }
  input.addEventListener('input', update); tripSelect.addEventListener('change', update); tools.append(filters, tripLabel, searchLabel); panel.append(tools, count, grid, empty); update(); return panel;
}
function isoDay(now: Date) { return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
function datesPanel(data: Story) {
  const panel = e('section'); panel.append(heading('把重要的日子记住', '相识是故事的开头，在一起是新的篇章。每一个值得期待的日子，都留在这里。'));
  if (editor) panel.append(editor.anniversaryEditor);
  const feature = e('div', 'anniversary-feature'), featureTitle = e('h3'), featureCount = e('strong'), featureUnit = e('span'), featureDate = e('p');
  const big = e('div', 'anniversary-big'), featureCopy = e('div'); big.append(featureCount, featureUnit); featureCopy.append(featureTitle, featureDate); feature.append(featureCopy, big);
  const list = e('div', 'anniversary-list');
  function updateDates() {
    const dates = allAnniversaries(data);
    const first = dates[0]; if (first) { featureTitle.textContent = `下一次一起期待 · ${first.title}`; featureCount.textContent = String(first.daysUntil); featureUnit.textContent = first.daysUntil ? '天后' : '就是今天'; featureDate.textContent = formatLoveDate(first.date); }
    list.replaceChildren(); dates.forEach(event => {
      const row = e('article', 'anniversary-row'), copy = e('div'), time = e('time', '', formatLoveDate(event.date)); time.dateTime = event.date;
      copy.append(e('h3', '', event.title), time, e('p', '', event.detail));
      const count = e('div', 'countdown'); count.append(e('strong', '', String(event.daysUntil)), e('small', '', event.daysUntil ? '天后' : '今天')); row.append(copy, count); list.append(row);
    });
  }
  dateRefreshers.push(updateDates);
  const calendar = e('section', 'calendar-shell'); calendar.setAttribute('aria-label', '纪念日日历');
  const controls = e('header', 'calendar-controls'), monthTitle = e('h3'); monthTitle.setAttribute('aria-live', 'polite');
  let today = isoDay(new Date()); const [todayYear,todayMonth] = today.split('-').map(Number);
  calendarView ??= {year:todayYear,month:todayMonth,selected:today};
  let {year,month,selected} = calendarView;
  const grid = e('div', 'calendar-grid'), detail = e('div', 'calendar-detail'); detail.setAttribute('aria-live', 'polite');
  let eventMap = new Map<string, {title: string; detail: string}[]>();
  const dayId = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  function selectDay(date: string) {
    selected = date; calendarView = {year,month,selected}; detail.replaceChildren(e('h3', '', formatLoveDate(date)));
    const events = eventMap.get(date) ?? [];
    if (events.length) events.forEach(event => detail.append(e('p', '', `${event.title} · ${event.detail}`)));
    else detail.append(e('p', '', '这一天没有设定纪念日。普通的一天，也可以好好陪伴。'));
    grid.querySelectorAll<HTMLButtonElement>('button').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.date === date)));
  }
  function renderMonth() {
    monthTitle.textContent = `${year} 年 ${month} 月`; eventMap = new Map();
    const first = `${dayId(1)}T00:00:00+08:00`;
    const events = getAnniversaries(data.meetDate, data.relationshipDate, new Date(first));
    const fixed = [{date:isoDay(new Date(data.meetDate)),title:'第一次相识',detail:'我们的故事从这一天开始。'}, {date:data.relationshipDate.slice(0,10),title:'正式在一起',detail:'我们确立了恋爱关系。'}];
    for (const event of [...fixed, ...events, ...customDatesInMonth(cloudEntries, year, month)]) { const entries = eventMap.get(event.date) ?? []; if (!entries.some(value => value.title === event.title)) entries.push({title:event.title, detail:event.detail}); eventMap.set(event.date, entries); }
    grid.replaceChildren();
    const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = 0; i < offset; i++) { const blank = e('span', 'calendar-blank'); blank.setAttribute('aria-hidden','true'); grid.append(blank); }
    for (let day = 1; day <= total; day++) {
      const date = dayId(day), events = eventMap.get(date) ?? [];
      const node = button('', () => selectDay(date), 'calendar-day'); node.dataset.date = date;
      node.append(e('span', '', String(day))); if (events.length) { node.classList.add('has-event'); node.append(e('small', '', events[0].title)); }
      if (date === today) { node.classList.add('is-today'); node.setAttribute('aria-current', 'date'); }
      node.setAttribute('aria-label', `${formatLoveDate(date)}${events.length ? '，' + events.map(event=>event.title).join('，') : ''}`); grid.append(node);
    }
    if (!selected.startsWith(`${year}-${String(month).padStart(2,'0')}-`)) selected = [...eventMap.keys()].find(date => date.startsWith(`${year}-${String(month).padStart(2,'0')}-`)) ?? dayId(1);
    selectDay(selected);
  }
  function shiftMonth(delta: number) { const target = new Date(Date.UTC(year, month - 1 + delta, 1)); year = target.getUTCFullYear(); month = target.getUTCMonth() + 1; renderMonth(); }
  const previous = button('←', () => shiftMonth(-1)), next = button('→', () => shiftMonth(1)); previous.setAttribute('aria-label','上一个月'); next.setAttribute('aria-label','下一个月');
  controls.append(previous, monthTitle, next);
  const weekdays = e('div', 'calendar-weekdays'); ['一','二','三','四','五','六','日'].forEach(day => weekdays.append(e('span', '', day)));
  calendar.append(controls, weekdays, grid, e('p', 'calendar-legend', '深色标记纪念日，点击日期查看。日期均按北京时间计算。'), detail); renderMonth();
  dateRefreshers.push(() => { const current = isoDay(new Date()); if (current !== today) { today = current; renderMonth(); } });
  panel.append(feature, list, calendar); return panel;
}
function lettersPanel(data: Story) {
  const panel = e('section'); panel.append(heading('想说的话，都留给你', '在一起之前的心意，和在一起之后的认真。可以换一封信，慢慢读。'));
  const letters: Letter[] = data.letters?.length ? data.letters : [{id:'before-us',context:'在一起之前',...data.letter}];
  const layout = e('div', 'letter-layout'), menu = e('div', 'letter-menu'), sheet = e('article', 'letter-sheet');
  menu.setAttribute('role','tablist'); menu.setAttribute('aria-label','选择情书'); menu.setAttribute('aria-orientation','vertical');
  sheet.id = 'letter-sheet'; sheet.setAttribute('role','tabpanel');
  const choices: HTMLButtonElement[] = [];
  function choose(index: number, focus = false) {
    const letter = letters[index];
    choices.forEach((node, i) => { node.setAttribute('aria-selected',String(i === index)); node.tabIndex = i === index ? 0 : -1; });
    sheet.setAttribute('aria-labelledby', choices[index].id);
    sheet.replaceChildren(e('p', 'letter-context', letter.context), e('h3', '', letter.title));
    if (letter.date) sheet.append(e('p', 'letter-date', formatLoveDate(letter.date)));
    const body = e('div', 'letter-body'); letter.paragraphs.forEach(paragraph => body.append(e('p', '', paragraph))); body.append(e('p', 'letter-signature', letter.signature)); sheet.append(body);
    if (focus) choices[index].focus();
  }
  letters.forEach((letter, index) => {
    const node = button('', () => choose(index), 'letter-choice'); node.id = `letter-tab-${index}`; node.setAttribute('role','tab'); node.setAttribute('aria-controls','letter-sheet'); node.append(e('strong', '', letter.title), e('small', '', letter.context));
    node.addEventListener('keydown', event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); choose((index + (event.key === 'ArrowDown' ? 1 : -1) + letters.length) % letters.length, true); } }); choices.push(node); menu.append(node);
  });
  layout.append(menu, sheet); panel.append(layout); choose(letters.length - 1); return panel;
}
function musicPanel(data: Story) {
  const panel = e('section'); panel.append(heading('有一首歌，想陪你听', '曾经想用旋律说出的心意，现在可以在我们的每一天里继续播放。'));
  if (!data.music) { panel.append(e('p', '', '还没有收录歌曲。')); return panel; }
  const layout = e('div', 'music-layout'), art = e('figure', 'record-art'); art.append(imageButton(data.heroPhotoIndex ?? 0, true), e('figcaption', '', `《${data.music.title}》`));
  const details = e('div', 'music-details'); details.append(e('h2', '', `《${data.music.title}》`), e('p', 'music-description', '点下播放，让这首歌成为翻阅回忆时的背景。可以暂停，也可以从喜欢的那一句重新听。'), musicButton('love-button primary music-toggle'));
  musicStatus = e('p', 'music-status'); musicStatus.setAttribute('role','status');
  audio = e('audio', 'music-player'); audio.controls = true; audio.loop = true; audio.preload = 'none'; audio.hidden = true; audio.setAttribute('aria-label',`播放${data.music.title}`);
  audio.addEventListener('play', updateMusicButtons); audio.addEventListener('pause', updateMusicButtons);
  audio.addEventListener('error', () => { if (musicStatus && audio?.getAttribute('src')) musicStatus.textContent = '音乐读取失败，请点击播放重试。'; });
  details.append(musicStatus, audio); layout.append(art, details); panel.append(layout);
  if (data.music.lyrics?.length) { const lyrics = e('div', 'lyrics-panel'); lyrics.append(e('h3', '', '把歌里的话，再读一遍')); data.music.lyrics.forEach(line => lyrics.append(e('p', line ? 'lyric-line' : 'lyric-break', line || '\u00a0'))); panel.append(lyrics); }
  return panel;
}
function animatePanel(panel: HTMLElement) {
  observer?.disconnect(); observer = null;
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.animate([{opacity:.35,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}], {duration:560,easing:'cubic-bezier(.2,.65,.3,1)'}); observer?.unobserve(entry.target);
  }), {threshold:.06});
  panel.querySelectorAll('.cover-words>*,.cover-photo,.relationship-facts>div,.today-grid>article,.section-heading,.memory-photo,.promise-list>div,.timeline-copy,.scene,.anniversary-row,.letter-sheet,.music-details,.lyrics-panel').forEach(node=>observer!.observe(node));
}
function renderStory(data: Story) {
  storyRoot.replaceChildren(); photoUrls = data.photos.map(photo=>blobUrl(photo.data,photo.mime)); data.photos.forEach(photo=>{photo.data='';});
  const session = generation, basePhotos = data.photos.slice(), baseUrls = photoUrls.slice();
  const cloudPhotos = new Map<string, {etag: string; photo: Photo; url: string}>();
  let refreshViews = () => {};
  if (data.cloud && request) {
    const config = {...data.cloud};
    if (import.meta.env.DEV && import.meta.env.PUBLIC_LOVE_API_URL) config.apiUrl = import.meta.env.PUBLIC_LOVE_API_URL;
    editor = createLoveEditor({config, password, signal:request.signal, onChange(entries) {
      if (session !== generation) return;
      cloudEntries = entries;
      const activeIds = new Set<string>();
      for (const entry of entries.filter(item => item.type === 'photo')) {
        activeIds.add(entry.id);
        if (cloudPhotos.get(entry.id)?.etag === entry.etag) continue;
        const previous = cloudPhotos.get(entry.id); if (previous) URL.revokeObjectURL(previous.url);
        const photo = entry.value as Photo;
        cloudPhotos.set(entry.id, {etag:entry.etag, photo:{...photo,data:''}, url:blobUrl(photo.data,photo.mime)});
      }
      for (const [id, item] of cloudPhotos) if (!activeIds.has(id)) { URL.revokeObjectURL(item.url); cloudPhotos.delete(id); }
      const additions = [...cloudPhotos.values()];
      data.photos = [...basePhotos, ...additions.map(item => item.photo)];
      photoUrls = [...baseUrls, ...additions.map(item => item.url)];
      refreshViews();
    }});
  }
  const masthead = e('header','journal-masthead'), identity = e('div'); identity.append(e('h1','','我们的小世界'),e('p','names',`${data.boyName} 与 ${data.girlName} · 一起把日子过成故事`)); masthead.append(identity); if(data.music) masthead.append(musicButton('text-button global-music'));
  const nav = e('nav','journal-nav'); nav.setAttribute('role','tablist'); nav.setAttribute('aria-label','纪念册栏目');
  const sections: {id:PanelId;label:string;node:HTMLElement}[] = [
    {id:'today',label:'我们的今天',node:overview(data)}, {id:'story',label:'故事时间线',node:storyPanel(data)}, {id:'album',label:'回忆相册',node:albumPanel(data)},
    {id:'diary',label:'恋爱日记',node:editor?.diaryPanel ?? heading('把日子，慢慢写下来', '云端记录功能尚未配置。已有回忆仍可正常查看。')},
    {id:'dates',label:'纪念日',node:datesPanel(data)}, {id:'letters',label:'写给你的信',node:lettersPanel(data)}, {id:'music',label:'我们的歌',node:musicPanel(data)},
  ];
  const tabs: HTMLButtonElement[] = [];
  selectPanel = (id, focus=false) => {
    const index = sections.findIndex(section=>section.id===id); if(index<0)return;
    sections.forEach((section,i)=>{section.node.hidden=i!==index;tabs[i].setAttribute('aria-selected',String(i===index));tabs[i].tabIndex=i===index?0:-1;});
    dateRefreshers.forEach(update=>update()); animatePanel(sections[index].node); window.scrollTo({top:0,behavior:'instant'});
    if(focus){const title=sections[index].node.querySelector<HTMLElement>('h2');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}}
  };
  sections.forEach((section,index)=>{
    section.node.id=`panel-${section.id}`;section.node.classList.add('journal-panel');section.node.setAttribute('role','tabpanel');section.node.setAttribute('aria-labelledby',`tab-${section.id}`);
    const tab=button(section.label,()=>selectPanel(section.id),'journal-tab');tab.id=`tab-${section.id}`;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',section.node.id);
    tab.addEventListener('keydown',event=>{
      let next=index;if(event.key==='ArrowRight')next=(index+1)%sections.length;else if(event.key==='ArrowLeft')next=(index-1+sections.length)%sections.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=sections.length-1;else return;
      event.preventDefault();selectPanel(sections[next].id);tabs[next].focus();
    });tabs.push(tab);nav.append(tab);
  });
  refreshViews = () => {
    // Preserve the editor nodes, music player, active tab and viewport while
    // refreshing only views that depend on newly synchronized records.
    const top = window.scrollY, focused = document.activeElement as HTMLElement | null;
    dateRefreshers = [];
    for (const [id, build] of [['today', overview], ['album', albumPanel], ['dates', datesPanel]] as const) {
      const section = sections.find(item => item.id === id)!;
      const previous = section.node, next = build(data);
      next.id = previous.id; next.hidden = previous.hidden;
      next.classList.add('journal-panel'); next.setAttribute('role','tabpanel');
      next.setAttribute('aria-labelledby', `tab-${id}`); previous.replaceWith(next); section.node = next;
    }
    dateRefreshers.forEach(update => update());
    const restored = focused?.isConnected ? focused : focused?.id ? document.getElementById(focused.id) : focused?.dataset.date ? storyRoot.querySelector<HTMLElement>(`[data-date="${focused.dataset.date}"]`) : null;
    restored?.focus({preventScroll:true});
    window.scrollTo({top,behavior:'instant'});
    // A saved photo can change album indices. Close an already-open viewer
    // rather than leaving its pagination bound to an old snapshot.
    if (dialog.open) dialog.close(); viewerIndexes = [];
  };
  const end=e('div','journal-end');end.append(e('p','','这里的每一页，都想和你一起慢慢写下去。'),button('收好回忆，锁定页面',()=>lock()));
  storyRoot.append(masthead);
  if (editor) storyRoot.append(editor.statusElement);
  storyRoot.append(nav,...sections.map(section=>section.node),end);
  gate.hidden=true;storyRoot.hidden=false;lockButton.hidden=false;selectPanel('today');timer=setInterval(()=>dateRefreshers.forEach(update=>update()),30000);
  const title=masthead.querySelector('h1')!;title.tabIndex=-1;title.focus({preventScroll:true});
  if (editor) void editor.start();
}
function lock(focus=true) {
  generation++;request?.abort();request=null;observer?.disconnect();observer=null;if(timer)clearInterval(timer);timer=undefined;dateRefreshers=[];
  editor?.stop(); editor=null; cloudEntries=[]; albumView={category:'all',query:'',trip:''}; calendarView=null;
  if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}musicButtons=[];musicStatus=null;musicLoading=false;selectPanel=()=>{};
  dialog.close();largePhoto.removeAttribute('src');largePhoto.alt='';for(const id of ['photo-title','photo-caption','photo-position'])document.getElementById(id)!.textContent='';
  storyRoot.replaceChildren();storyRoot.hidden=true;urls.forEach(url=>URL.revokeObjectURL(url));urls=[];photoUrls=[];viewerIndexes=[];
  story=null;password='';passwordInput.value='';passwordInput.type='password';togglePassword.textContent='显示';togglePassword.setAttribute('aria-label','显示密码');togglePassword.setAttribute('aria-pressed','false');
  passwordInput.removeAttribute('aria-invalid');form.removeAttribute('aria-busy');gate.hidden=false;lockButton.hidden=true;submit.disabled=false;submit.textContent='打开纪念册 ↗';message.textContent='';
  if(focus){window.scrollTo({top:0,behavior:'instant'});passwordInput.focus({preventScroll:true});}
}
togglePassword.addEventListener('click',()=>{const reveal=passwordInput.type==='password';passwordInput.type=reveal?'text':'password';togglePassword.textContent=reveal?'隐藏':'显示';togglePassword.setAttribute('aria-label',reveal?'隐藏密码':'显示密码');togglePassword.setAttribute('aria-pressed',String(reveal));});
passwordInput.addEventListener('input',()=>passwordInput.removeAttribute('aria-invalid'));
form.addEventListener('submit',async event=>{
  event.preventDefault();if(submit.disabled||!form.reportValidity())return;if(!window.crypto?.subtle){message.textContent='请使用 HTTPS 或本机 localhost 地址打开纪念册。';return;}
  const attempt=passwordInput.value,session=++generation;request?.abort();request=new AbortController();submit.disabled=true;submit.textContent='正在打开…';form.setAttribute('aria-busy','true');passwordInput.removeAttribute('aria-invalid');message.textContent='正在读取我们的纪念册…';
  let envelope;try{envelope=await fetchEnvelope(main.dataset.vaultUrl!,request.signal);}catch{if(session!==generation)return;message.textContent='纪念册暂时无法加载，请检查网络后重试。';submit.disabled=false;submit.textContent='重新打开纪念册';form.removeAttribute('aria-busy');return;}
  try{
    message.textContent='正在验证密码…';const data=await decryptLovePayload(envelope,attempt) as Story;if(session!==generation)return;
    if(data.version!==1||!Array.isArray(data.photos)||!data.photos.length||!data.relationshipDate)throw new Error('INVALID_STORY');
    password=attempt;story=data;passwordInput.value='';renderStory(data);message.textContent='';
  }catch{if(session!==generation)return;lock(false);message.textContent='密码不正确，或纪念册文件已损坏，请重试。';passwordInput.setAttribute('aria-invalid','true');passwordInput.focus();}
  finally{if(session===generation){submit.disabled=false;submit.textContent='打开纪念册 ↗';form.removeAttribute('aria-busy');}}
});
lockButton.addEventListener('click',()=>lock());document.querySelector('#close-photo')!.addEventListener('click',()=>dialog.close());
document.querySelector('#previous-photo')!.addEventListener('click',()=>movePhoto(-1));document.querySelector('#next-photo')!.addEventListener('click',()=>movePhoto(1));
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();movePhoto(event.key==='ArrowRight'?1:-1);}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
window.addEventListener('pagehide',()=>lock(false));window.addEventListener('pageshow',event=>{if(event.persisted)lock(false);});

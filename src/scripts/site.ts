import { withBase } from '../lib/paths';

const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('.primary-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  nav?.classList.toggle('is-open', open);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.click();
    menu.focus();
  }
});

async function copy(text: string, button: HTMLButtonElement) {
  const original = button.textContent || 'Copy';
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = '已复制 ✓';
  } catch {
    button.textContent = '请选中文字复制';
  }
  setTimeout(() => { button.textContent = original; }, 2000);
}

document.querySelectorAll<HTMLElement>('.prose pre').forEach((pre) => {
  if (pre.querySelector('.code-toolbar') || pre.closest('.citation-dialog')) return;
  const code = pre.querySelector('code');
  if (!code) return;
  const toolbar = document.createElement('div');
  toolbar.className = 'code-toolbar';
  const lights = document.createElement('span');
  lights.className = 'code-lights';
  lights.setAttribute('aria-hidden', 'true');
  lights.innerHTML = '<i></i><i></i><i></i>';
  const label = document.createElement('span');
  label.textContent = pre.dataset.language || code.className.replace('language-', '') || 'CODE';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', '复制代码');
  button.addEventListener('click', () => copy(code.textContent || '', button));
  toolbar.append(lights, label, button);
  pre.prepend(toolbar);
});

document.querySelectorAll<HTMLElement>('[data-comparison]').forEach((comparison) => {
  const range = comparison.querySelector<HTMLInputElement>('input');
  const stage = comparison.querySelector<HTMLElement>('.comparison-stage');
  range?.addEventListener('input', () => {
    stage?.style.setProperty('--position', `${range.value}%`);
    range.setAttribute('aria-valuetext', `显示 ${range.value}% 的改进效果`);
  });
});

// Resolve Markdown media under a GitHub project repository's base path.
document.querySelectorAll<HTMLImageElement>('.prose img[src^="/"]').forEach((img) => {
  const src = img.getAttribute('src') || '';
  const base = import.meta.env.BASE_URL;
  if (base !== '/' && !src.startsWith(base)) img.src = withBase(src);
});

const citation = document.querySelector<HTMLDialogElement>('#citation-dialog');
document.querySelectorAll<HTMLButtonElement>('[data-bibtex]').forEach((button) => {
  button.addEventListener('click', () => {
    const content = document.querySelector('#citation-content');
    const warning = document.querySelector('#citation-warning');
    if (content) content.textContent = button.dataset.bibtex || '';
    if (warning) warning.textContent = button.dataset.demo === 'true' ? '这是示例引用，正式发布前请替换为真实论文的 BibTeX。' : '引用信息以论文正式发表版本为准。';
    citation?.showModal();
  });
});
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => citation?.close()));
citation?.addEventListener('click', (event) => { if (event.target === citation) { const r = citation.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) citation.close(); } });
document.querySelector<HTMLButtonElement>('[data-copy-citation]')?.addEventListener('click', (event) => copy(document.querySelector('#citation-content')?.textContent || '', event.currentTarget as HTMLButtonElement));

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll<HTMLElement>('[data-publication-media]').forEach((media) => {
  const video = media.querySelector<HTMLVideoElement>('video');
  const toggle = media.querySelector<HTMLButtonElement>('[data-video-toggle]');
  if (!video) return;
  function reflect() {
    media.classList.toggle('is-playing', !video!.paused);
    if (toggle) {
      toggle.textContent = video!.paused ? '播放预览' : '暂停预览';
      toggle.setAttribute('aria-pressed', String(!video!.paused));
    }
  }
  media.addEventListener('mouseenter', () => { if (hoverPointer.matches && !reducedMotion.matches) video.play().catch(() => {}); });
  media.addEventListener('mouseleave', () => { if (hoverPointer.matches) video.pause(); });
  toggle?.addEventListener('click', () => video.paused ? video.play().catch(() => {}) : video.pause());
  video.addEventListener('play', reflect);
  video.addEventListener('pause', reflect);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) video.pause(); });
});

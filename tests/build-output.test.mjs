import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.TEST_DIST || 'dist');
const base = (process.env.BASE_PATH || '/').replace(/^\/?/, '/').replace(/\/+$/, '') || '';
const origin = 'https://site-test.invalid';
const documents = new Map();

async function collect(folder) {
  const files = await readdir(folder, { withFileTypes: true });
  for (const file of files) {
    const filename = path.join(folder, file.name);
    if (file.isDirectory()) await collect(filename);
    else if (file.name.endsWith('.html')) documents.set(filename, await readFile(filename, 'utf8'));
  }
}

function unescape(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function documentUrl(filename) {
  let relative = path.relative(root, filename).split(path.sep).join('/');
  relative = relative === 'index.html' ? '' : relative.replace(/index\.html$/, '');
  return new URL(`${base}/${relative}`, origin);
}

async function resolveLocal(url) {
  const decoded = decodeURIComponent(url.pathname);
  assert.ok(base === '' || decoded === base || decoded.startsWith(`${base}/`), `路径未包含部署 base ${base}：${decoded}`);
  const relative = base ? decoded.slice(base.length) : decoded;
  const direct = path.resolve(root, `.${relative}`);
  const within = path.relative(root, direct);
  assert.ok(!within.startsWith('..') && !path.isAbsolute(within), `路径超出构建目录：${decoded}`);
  const candidates = relative.endsWith('/') ? [path.join(direct, 'index.html')] : [direct, path.join(direct, 'index.html')];
  for (const candidate of candidates) {
    try { if ((await stat(candidate)).isFile()) return candidate; } catch { /* Try the directory route. */ }
  }
  throw new Error(`构建产物缺少链接或资源：${decoded}`);
}

test('all six pillars and their generated detail pages build with titles and one h1', async () => {
  try { await collect(root); } catch { assert.fail('请先执行 pnpm build，再执行 pnpm test。'); }
  assert.ok(documents.size >= 6, '应生成六大模块及内容详情页');
  for (const section of ['', 'publications', 'digest', 'notes', 'projects', 'trajectory']) {
    assert.ok(documents.has(path.join(root, section, 'index.html')), `缺少模块：${section || 'Home'}`);
  }
  for (const [filename, html] of documents) {
    assert.match(html, /<title>[^<]+<\/title>/, `${filename} 缺少标题`);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${filename} 应有且仅有一个 h1`);
  }
});

test('every generated local link, media URL and anchor resolves under the configured base', async () => {
  if (!documents.size) await collect(root);
  const failures = [];
  let checked = 0;
  for (const [filename, html] of documents) {
    const pageUrl = documentUrl(filename);
    for (const match of html.matchAll(/\b(?:href|src|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      const value = unescape(match[1] ?? match[2]);
      if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) continue;
      try {
        const url = new URL(value, pageUrl);
        if (url.origin !== origin) continue;
        const target = await resolveLocal(url);
        if (url.hash && target.endsWith('.html')) {
          const targetHtml = documents.get(target) || await readFile(target, 'utf8');
          const anchor = decodeURIComponent(url.hash.slice(1));
          const ids = [...targetHtml.matchAll(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(item => unescape(item[1] ?? item[2]));
          assert.ok(ids.includes(anchor), `锚点不存在：${url.pathname}${url.hash}`);
        }
        checked++;
      } catch (error) {
        failures.push(`${path.relative(root, filename)} → ${value}: ${error.message}`);
      }
    }
  }
  assert.ok(checked > 0, '应检查至少一个站内链接');
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('Markdown and MDX render researcher notes, numbered math, code and comparison controls', async () => {
  const digest = await readFile(path.join(root, 'digest/demo-diffusion-control/index.html'), 'utf8');
  const publication = await readFile(path.join(root, 'publications/embodied-control/index.html'), 'utf8');
  const note = await readFile(path.join(root, 'notes/reproducible-motion-pipeline/index.html'), 'utf8');
  for (const html of [digest, publication]) {
    assert.match(html, /class="katex-display"/, '编号数学公式应由 KaTeX 渲染');
    assert.match(html, /class="tag"/, '公式应保留等式编号');
    assert.match(html, /class="astro-code/, '代码应有语法高亮');
  }
  for (const html of [digest, note]) {
    assert.match(html, /<aside[^>]+class="research-note"/, 'Markdown 和 MDX 手记都应渲染');
    assert.doesNotMatch(html, /:::my-take/, '手记标记不应泄露为原始文本');
  }
  assert.match(note, /type="range"/, '比较组件应提供可用键盘操作的滑块');
});

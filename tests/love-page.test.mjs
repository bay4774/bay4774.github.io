import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.TEST_DIST || 'dist');
const base = (process.env.BASE_PATH || '/').replace(/^\/?/, '/').replace(/\/+$/, '') || '';

async function builtFile(relative) {
  try { return await readFile(path.join(root, relative), 'utf8'); }
  catch { assert.fail(`Build the site before checking the love page: missing ${relative}`); }
}

test('the home links to a locked love page with no pre-rendered private media', async () => {
  const home = await builtFile('index.html');
  const page = await builtFile('love/index.html');
  assert.ok(home.includes(`href="${base}/love/"`), 'The homepage must expose the love entrance');
  assert.match(page, /<meta\b[^>]*name="robots"[^>]*content="noindex, nofollow, noarchive"/);
  assert.match(page, /<article\b[^>]*id="love-story"[^>]*\bhidden[^>]*>\s*<\/article>/,
    'The private article must be empty and hidden in the build');
  const passwordInput = page.match(/<input\b[^>]*id="love-password"[^>]*>/)?.[0];
  assert.ok(passwordInput, 'The gate must contain the password field');
  assert.match(passwordInput, /type="password"/);
  assert.doesNotMatch(passwordInput, /\bvalue\s*=/, 'Never prefill a password in generated HTML');
  assert.ok(page.includes(`data-vault-url="${base}/love/vault.json"`));
  assert.ok(page.includes(`data-song-url="${base}/love/song.json"`));
  assert.doesNotMatch(page, /<(?:audio|video)\b|data:(?:image|audio)\//i);
  assert.doesNotMatch(page, /<img\b[^>]*\bsrc\s*=/i,
    'The locked page must not expose original or unencrypted photographs');
  assert.doesNotMatch(page, /\.private[\\/]|password\.txt|LOVE_PASSWORD/);
});

test('published love resources contain only fixed authenticated encryption envelopes', async () => {
  const entries = await readdir(path.join(root, 'love'), { withFileTypes: true });
  assert.deepEqual(entries.map(entry => entry.name).sort(), ['index.html', 'song.json', 'vault.json'],
    'Do not publish source photos, music, passwords, or plaintext manifests alongside the gate');
  const expectedKeys = ['cipher', 'ciphertext', 'iterations', 'iv', 'kdf', 'salt', 'version'].sort();
  for (const filename of ['vault.json', 'song.json']) {
    const envelope = JSON.parse(await builtFile(`love/${filename}`));
    assert.deepEqual(Object.keys(envelope).sort(), expectedKeys, 'Envelope must not contain plaintext fields');
    assert.equal(envelope.version, 1);
    assert.equal(envelope.kdf, 'PBKDF2-SHA256');
    assert.equal(envelope.iterations, 600_000);
    assert.equal(envelope.cipher, 'AES-GCM');
    assert.equal(Buffer.from(envelope.salt, 'base64').length, 16);
    assert.equal(Buffer.from(envelope.iv, 'base64').length, 12);
    assert.ok(Buffer.from(envelope.ciphertext, 'base64').length > 16);
    for (const field of ['salt', 'iv', 'ciphertext']) {
      assert.equal(Buffer.from(envelope[field], 'base64').toString('base64'), envelope[field]);
    }
  }
});

test('private source excerpts never enter published HTML, scripts, or data', async () => {
  // CI has the ciphertext but intentionally lacks .private/. Generic protection
  // still runs above; local builds additionally scan for actual private excerpts.
  let content;
  try { content = JSON.parse(await readFile('.private/love/content.json', 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  const excerpts = [content.intro, ...(content.chapters || []).map(chapter => chapter.text),
    ...(content.letter?.paragraphs || [])]
    .filter(value => typeof value === 'string' && value.length >= 24)
    .map(value => Buffer.from(value, 'utf8'));
  assert.ok(excerpts.length, 'Use private prose excerpts without embedding them in test source');
  let checked = 0;
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) { await visit(filename); continue; }
      if (!/\.(?:html|js|mjs|json|map|txt|xml|css|webmanifest)$/.test(entry.name)) continue;
      const bytes = await readFile(filename);
      assert.equal(excerpts.some(excerpt => bytes.includes(excerpt)), false,
        `Private prose was found in generated file ${path.relative(root, filename)}`);
      checked++;
    }
  }
  await visit(root);
  assert.ok(checked > 0);
});

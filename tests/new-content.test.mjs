import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createContent, isoWeek, todayInShanghai, validateSlug } from '../scripts/new-content.mjs';

async function removeTemporaryRoot(root) {
  const absolute = path.resolve(root);
  assert.equal(path.dirname(absolute), path.resolve(os.tmpdir()));
  assert.match(path.basename(absolute), /^research-site-/);
  await rm(absolute, { recursive: true, force: true });
}

test('a content draft is created with a Shanghai date, ISO week and separated callout delimiters', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'research-site-content-'));
  t.after(() => removeTemporaryRoot(root));
  const filename = await createContent('digest', 'diffusion-policy', { root, date: '2026-10-14' });
  assert.equal(filename, path.join(root, 'src', 'content', 'digest', 'diffusion-policy.md'));
  const content = await readFile(filename, 'utf8');
  assert.match(content, /date: '2026-10-14'/);
  assert.match(content, /week: '2026-W42'/);
  assert.match(content, /demo: true\ndraft: true/);
  assert.match(content, /:::my-take\n\n[^]+\n\n:::/);
  assert.doesNotMatch(content, /\{\{[A-Z]+\}\}/);
});

test('every content kind has a usable template, including plural aliases', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'research-site-templates-'));
  t.after(() => removeTemporaryRoot(root));
  for (const [kind, folder] of [['publication', 'publications'], ['notes', 'notes'], ['projects', 'projects']]) {
    const filename = await createContent(kind, `test-${kind}`, { root, date: '2026-10-14' });
    assert.equal(path.basename(path.dirname(filename)), folder);
    const content = await readFile(filename, 'utf8');
    assert.match(content, /^---\n/);
    assert.match(content, /draft: true/);
    assert.doesNotMatch(content, /\{\{[A-Z]+\}\}/);
  }
});

test('existing content is never overwritten', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'research-site-no-overwrite-'));
  t.after(() => removeTemporaryRoot(root));
  const filename = await createContent('note', 'my-note', { root, date: '2026-10-14' });
  const original = await readFile(filename, 'utf8');
  await assert.rejects(createContent('note', 'my-note', { root, date: '2026-10-15' }), /未覆盖/);
  assert.equal(await readFile(filename, 'utf8'), original);
});

test('invalid types and path traversal are rejected before creating directories', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'research-site-validation-'));
  t.after(() => removeTemporaryRoot(root));
  for (const slug of ['../outside', 'a/b', 'a\\b', 'Uppercase', 'a--b', '-start', 'end-', 'con', '', 'a'.repeat(101)]) {
    assert.throws(() => validateSlug(slug));
    await assert.rejects(createContent('digest', slug, { root }));
  }
  await assert.rejects(createContent('unknown', 'valid', { root }), /类型/);
  assert.deepEqual(await readdir(root), []);
});

test('Shanghai dates and ISO weeks behave correctly near midnight and year boundaries', () => {
  assert.equal(todayInShanghai(new Date('2026-10-13T17:00:00Z')), '2026-10-14');
  assert.equal(isoWeek('2026-10-14'), '2026-W42');
  assert.equal(isoWeek('2021-01-01'), '2020-W53');
  assert.equal(isoWeek('2024-12-30'), '2025-W01');
});

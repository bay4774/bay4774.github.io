import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildLovePayload, calendarDate, resolvePhotoSource, validateLoveContent } from '../scripts/prepare-love.mjs';

/**
 * Mutable pre-validation fixture: selected fields deliberately accept invalid
 * values so rejection tests exercise the runtime boundary without type casts.
 * @typedef {Object} TestContent
 * @property {number} version
 * @property {string} boyName
 * @property {string} girlName
 * @property {string} nickname
 * @property {string} meetDate
 * @property {string} intro
 * @property {{ title: string, text: string }[]} chapters
 * @property {{ title: string, paragraphs: string[], signature: string, source?: string }} letter
 * @property {{ source: string, title: string, caption: string, category?: string }[]} photos
 * @property {{ source: string, title: string, lyrics?: (string | number)[], copyright?: string }} music
 * @property {string} [relationshipDate]
 * @property {number | string} [heroPhotoIndex]
 * @property {(number | string)[] | string} [storyPhotoIndexes]
 * @property {{ title: string, text: string, privateNote?: string }[]} [loveNotes]
 * @property {{ id: string, title: string, context: string, date?: string, paragraphs: string[], signature: string, secret?: string }[]} [letters]
 * @property {string} [password]
 * @property {string} [birthday]
 * @property {{ apiUrl: string, token: string, privateNote?: string }} [cloud]
 */

/** @returns {TestContent} */
function originalContent() {
  return {
    version: 1,
    boyName: 'Example A', girlName: 'Example B', nickname: 'Example',
    meetDate: '2020-02-29T00:00:00+08:00', intro: 'A sample story.',
    chapters: [{ title: 'Beginning', text: 'A sample chapter.' }],
    letter: { title: 'A letter', paragraphs: ['A sample paragraph.'], signature: 'Example A' },
    photos: [{ source: 'Picture/example.jpg', title: 'A photo', caption: 'A sample caption.' }],
    music: { source: 'LYX/example.mp3', title: 'A song' },
  };
}

test('original version 1 content remains valid without expanded fields', () => {
  const result = validateLoveContent(originalContent());
  assert.equal(result.version, 1);
  for (const field of ['relationshipDate', 'heroPhotoIndex', 'storyPhotoIndexes', 'loveNotes', 'letters', 'cloud']) {
    assert.equal(Object.hasOwn(result, field), false);
  }
  assert.equal(Object.hasOwn(result.photos[0], 'category'), false);
  assert.equal(Object.hasOwn(result.music, 'lyrics'), false);
});

test('calendar dates reject normalized impossible days and ambiguous formats', () => {
  assert.equal(calendarDate('2020-02-29'), '2020-02-29');
  for (const value of ['2021-02-29', '2020-02-30', '2020-04-31', '2020-13-01', '2020-2-29', '2020-02-29T00:00:00Z']) {
    assert.throws(() => calendarDate(value));
  }
  const content = originalContent();
  content.meetDate = '2020-02-30T00:00:00+08:00';
  assert.throws(() => validateLoveContent(content), /meetDate/);
});

test('relationship milestone must be a real calendar date on or after meeting', () => {
  const content = originalContent();
  content.relationshipDate = '2020-03-01';
  assert.equal(validateLoveContent(content).relationshipDate, '2020-03-01');
  content.relationshipDate = '2020-02-28';
  assert.throws(() => validateLoveContent(content), /relationshipDate/);
  content.relationshipDate = '2021-02-29';
  assert.throws(() => validateLoveContent(content), /relationshipDate/);
});

test('photo categories and cover index cannot silently point at unsupported content', () => {
  const content = originalContent();
  content.photos[0].category = 'travel';
  content.heroPhotoIndex = 0;
  assert.equal(validateLoveContent(content).photos[0].category, 'travel');
  content.photos[0].category = 'daily';
  assert.equal(validateLoveContent(content).photos[0].category, 'daily');
  content.photos[0].category = 'couple';
  assert.equal(validateLoveContent(content).photos[0].category, 'couple');
  content.photos[0].category = 'invented';
  assert.throws(() => validateLoveContent(content), /category/);
  content.photos[0].category = 'travel';
  for (const value of [-1, 1, 0.5, '0']) {
    content.heroPhotoIndex = value;
    assert.throws(() => validateLoveContent(content), /heroPhotoIndex/);
  }
});

test('story photo choices match every chapter and point to existing photos', () => {
  const content = originalContent();
  content.photos.push({ source: 'imports/together.jpg', category: 'couple', title: 'Together', caption: 'A shared memory.' });
  content.storyPhotoIndexes = [1];
  const result = validateLoveContent(content);
  assert.deepEqual(result.storyPhotoIndexes, [1]);
  assert.notEqual(result.storyPhotoIndexes, content.storyPhotoIndexes);
  for (const invalid of [[], [0, 1], [-1], [2], [0.5], ['0'], '0']) {
    content.storyPhotoIndexes = invalid;
    assert.throws(() => validateLoveContent(content), /storyPhotoIndexes/);
  }
});

async function sourceFixture(t) {
  const tempRoot = await realpath(os.tmpdir());
  const directory = await mkdtemp(path.join(tempRoot, 'love-content-'));
  const relative = path.relative(tempRoot, directory);
  assert.ok(relative.startsWith('love-content-') && !relative.includes(path.sep));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'original');
  const imports = path.join(directory, 'imports');
  const outside = path.join(directory, 'outside');
  await Promise.all([source, imports, outside].map(folder => mkdir(folder)));
  await Promise.all([
    writeFile(path.join(source, 'old.txt'), 'original'),
    writeFile(path.join(imports, 'new.txt'), 'imported'),
    writeFile(path.join(outside, 'private.txt'), 'private'),
  ]);
  return { source, imports, outside };
}

test('imported photos resolve under their explicit private root and reject escapes', async t => {
  const { source, imports, outside } = await sourceFixture(t);
  assert.equal(await resolvePhotoSource(source, 'old.txt', imports), await realpath(path.join(source, 'old.txt')));
  assert.equal(await resolvePhotoSource(source, 'imports/new.txt', imports), await realpath(path.join(imports, 'new.txt')));
  assert.equal(await resolvePhotoSource(source, 'imports\\new.txt', imports), await realpath(path.join(imports, 'new.txt')));
  for (const invalid of ['imports/../outside/private.txt', 'imports/./new.txt', 'imports//new.txt', 'imports/', 'imports/C:/private.txt', path.join(outside, 'private.txt')]) {
    await assert.rejects(resolvePhotoSource(source, invalid, imports));
  }
});

test('imported photos reject links outside the private imports root', async t => {
  const { source, imports, outside } = await sourceFixture(t);
  const link = path.join(imports, 'escape');
  try {
    await symlink(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EPERM') {
      t.skip('This Windows environment does not permit fixture junctions.');
      return;
    }
    throw error;
  }
  await assert.rejects(resolvePhotoSource(source, 'imports/escape/private.txt', imports), /以外/);
});

test('imported image packing preserves the story choice without exposing source paths', async t => {
  const { source, imports } = await sourceFixture(t);
  const content = originalContent();
  content.photos = [{ source: 'imports/shared.svg', title: 'Together', caption: 'A shared memory.', category: 'couple' }];
  content.storyPhotoIndexes = [0];
  content.music.source = 'song.mp3';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="red"/></svg>';
  await Promise.all([writeFile(path.join(imports, 'shared.svg'), svg), writeFile(path.join(source, 'song.mp3'), 'test audio')]);
  const { payload } = await buildLovePayload(content, source, imports);
  assert.deepEqual(payload.storyPhotoIndexes, [0]);
  assert.equal(payload.photos[0].category, 'couple');
  assert.equal(payload.photos[0].mime, 'image/webp');
  assert.equal(payload.photos[0].width, 1);
  assert.equal(Object.hasOwn(payload.photos[0], 'source'), false);
  assert.equal(Object.hasOwn(payload.music, 'source'), false);
});

test('expanded letters preserve omitted dates, original lyrics and only allowed fields', () => {
  const content = originalContent();
  content.password = 'must-not-copy';
  content.birthday = 'unknown';
  content.letter.source = 'private-path';
  content.music.lyrics = ['First stanza', '', 'Second stanza'];
  content.music.copyright = 'unverified';
  content.loveNotes = [{ title: 'Care', text: 'A promise.', privateNote: 'must-not-copy' }];
  content.letters = [
    { id: 'before-us', title: 'Before', context: 'Before the relationship', paragraphs: ['A letter.'], signature: 'Example A', secret: 'must-not-copy' },
    { id: 'our-beginning', title: 'After', context: 'After the relationship', date: '2020-03-01', paragraphs: ['Another letter.'], signature: 'Example A' },
  ];
  const result = validateLoveContent(content);
  assert.deepEqual(result.music.lyrics, ['First stanza', '', 'Second stanza']);
  assert.ok(result.letters, 'Expanded input must retain its validated letters');
  assert.equal(Object.hasOwn(result.letters[0], 'date'), false);
  assert.equal(result.letters[1].date, '2020-03-01');
  assert.doesNotMatch(JSON.stringify(result), /must-not-copy|unverified|private-path|birthday/);
  content.letters[1].id = 'before-us';
  assert.throws(() => validateLoveContent(content), /id/);
  content.letters[1].id = 'our-beginning';
  content.letters[1].date = '2020-04-31';
  assert.throws(() => validateLoveContent(content), /date/);
  content.letters[1].date = '2020-03-01';
  content.music.lyrics = ['A line', 42];
  assert.throws(() => validateLoveContent(content), /lyrics/);
});

test('cloud configuration only retains a validated HTTPS origin and random-token format', () => {
  const content = originalContent();
  const fixtureToken = 'ab'.repeat(32);
  content.cloud = { apiUrl: 'https://example.com/', token: fixtureToken, privateNote: 'must-not-copy' };
  assert.deepEqual(validateLoveContent(content).cloud, { apiUrl: 'https://example.com', token: fixtureToken });
  for (const apiUrl of ['http://example.com', 'https://example.com/path', 'https://example.com/?x=1', 'https://example.com/#fragment', 'https://user:pass@example.com', 'https://example.com/.', '//example.com', 'not a url']) {
    content.cloud.apiUrl = apiUrl;
    assert.throws(() => validateLoveContent(content), /cloud.apiUrl/);
  }
  content.cloud.apiUrl = 'https://example.com';
  for (const token of ['', 'abc', 'z'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)]) {
    content.cloud.token = token;
    assert.throws(() => validateLoveContent(content), /cloud.token/);
  }
});

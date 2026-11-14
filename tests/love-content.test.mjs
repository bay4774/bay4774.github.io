import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDate, validateLoveContent } from '../scripts/prepare-love.mjs';

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
 * @property {{ title: string, text: string, privateNote?: string }[]} [loveNotes]
 * @property {{ id: string, title: string, context: string, date?: string, paragraphs: string[], signature: string, secret?: string }[]} [letters]
 * @property {string} [password]
 * @property {string} [birthday]
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
  for (const field of ['relationshipDate', 'heroPhotoIndex', 'loveNotes', 'letters']) {
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
  content.photos[0].category = 'invented';
  assert.throws(() => validateLoveContent(content), /category/);
  content.photos[0].category = 'travel';
  for (const value of [-1, 1, 0.5, '0']) {
    content.heroPhotoIndex = value;
    assert.throws(() => validateLoveContent(content), /heroPhotoIndex/);
  }
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

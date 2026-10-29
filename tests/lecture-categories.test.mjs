import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const source = new URL('../src/content/notes/', import.meta.url);
const output = path.resolve(process.env.TEST_DIST || 'dist');
const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const teachingIds = ['advanced-algorithm-design', 'advanced-artificial-intelligence'];
const entries = [];
for (const filename of await readdir(source)) {
  if (!/\.mdx?$/.test(filename)) continue;
  const text = await readFile(new URL(filename, source), 'utf8');
  const metadata = text.split('---')[1];
  entries.push({
    id: filename.replace(/\.mdx?$/, ''),
    category: metadata?.match(/^category:\s*['"]([^'"]+)['"]/m)?.[1],
    isFoundation: /^foundationChapter:/m.test(metadata || ''),
    isDirection: /^directionTrack:/m.test(metadata || ''),
    isCourseGuide: /^foundationOrder:/m.test(metadata || '') || filename === 'direction-foundations.mdx',
  });
}

test('only the two taught courses are teaching lectures; research foundations retain their course category', () => {
  assert.deepEqual(entries.filter(entry => entry.category === 'teaching').map(entry => entry.id).sort(), teachingIds);
  const courses = entries.filter(entry => entry.isFoundation || entry.isDirection);
  assert.equal(courses.length, 160);
  for (const entry of courses) assert.equal(entry.category, 'lecture', entry.id);
  for (const entry of entries.filter(entry => entry.isCourseGuide)) assert.equal(entry.category, 'lecture', entry.id);
});

test('homepage, directory and detail pages expose the same teaching classification and stable links', async () => {
  const home = await readFile(path.join(output, 'index.html'), 'utf8');
  const listing = await readFile(path.join(output, 'notes/index.html'), 'utf8');
  assert.match(home, /id="teaching-lectures"/);
  assert.match(home, />教学讲义</);
  assert.match(home, />课程讲义</);
  assert.ok(home.includes(base + '/notes/#notes-group-teaching-lectures'));
  assert.match(listing, /id="notes-group-teaching-lectures"/);
  assert.match(listing, /data-note-category="teaching"/);
  assert.match(listing, /data-note-category="lecture"/);
  assert.equal((listing.match(/data-category="teaching"/g) || []).length, 2);
  assert.equal((listing.match(/data-note-category="[^"]+"/g) || []).length, 2);
  for (const id of teachingIds) {
    const detail = await readFile(path.join(output, 'notes', id, 'index.html'), 'utf8');
    assert.match(detail, /class="article-meta"[^>]*><span>教学讲义<\/span>/);
    assert.ok(home.includes(base + '/lectures/' + id + '/index.html'));
    assert.ok(listing.includes(base + '/notes/' + id + '/'));
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const curriculum = JSON.parse(await readFile(new URL('../src/data/foundations-curriculum.json', import.meta.url), 'utf8'));
const chapterData = JSON.parse(await readFile(new URL('../src/data/foundations-chapters.json', import.meta.url), 'utf8'));
const legacy = JSON.parse(await readFile(new URL('../src/data/foundations-legacy-links.json', import.meta.url), 'utf8'));
const output = path.resolve(process.env.TEST_DIST || 'dist');
const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const pad = n => String(n).padStart(2, '0');

test('80 topic chapters are independent of the 40-week reading schedule', () => {
  assert.equal(chapterData.chapters.length, 80);
  assert.equal(new Set(chapterData.chapters.map(c => c.slug)).size, 80);
  chapterData.chapters.forEach((chapter, id) => {
    assert.equal(chapter.id, id);
    for (const prerequisite of chapter.prerequisites) {
      assert.ok(Number.isInteger(prerequisite) && prerequisite >= 0 && prerequisite < id,
        'Chapter ' + id + ' requires a missing or future chapter ' + prerequisite);
    }
  });
  assert.equal(curriculum.blocks.length, 20);
  const assignedChapters = [];
  curriculum.blocks.forEach((block, index) => {
    assert.equal(block.weekStart, index * 2 + 1);
    assert.equal(block.weekEnd, index * 2 + 2);
    assert.equal(block.weeks.length, 2);
    assert.deepEqual(block.weeks.map(w => w.week), [block.weekStart, block.weekEnd]);
    assert.deepEqual(block.weeks.flatMap(w => w.chapterIds), block.chapterIds);
    assignedChapters.push(...block.chapterIds);
  });
  assert.deepEqual(assignedChapters, chapterData.chapters.map(c => c.id));
});

test('every chapter has its own content, chapter navigation and valid mathematics', async () => {
  for (const chapter of chapterData.chapters) {
    const markdown = await readFile(new URL('../src/content/notes/' + chapter.slug + '.md', import.meta.url), 'utf8');
    const frontmatter = markdown.split('---')[1];
    assert.match(frontmatter, new RegExp('foundationChapter: ' + chapter.id + '(?:\\r?\\n|$)'));
    assert.match(frontmatter, new RegExp("title: ['\"]" + pad(chapter.id) + ' · '));
    assert.doesNotMatch(frontmatter, /^week(?:Start|End):/m);
    assert.doesNotMatch(frontmatter, /^title:.*第\d+.*周/m);
    assert.match(frontmatter, /reviewStatus: ['"](?:self-reviewed|reviewed)['"]/);
    const body = markdown.split('---').slice(2).join('---');
    assert.ok(body.length > 1000, chapter.slug + ': provide a substantive chapter, not a schedule stub');
    const sections = Number(frontmatter.match(/chapters:\s*(\d+)/)?.[1]);
    let inFence = false;
    let headings = 0;
    for (const line of body.split(/\r?\n/)) {
      if (line.startsWith('~~~') || line.slice(0, 3) === String.fromCharCode(96).repeat(3)) inFence = !inFence;
      if (!inFence && line.startsWith('## ')) headings++;
    }
    assert.equal(sections, headings, chapter.slug + ': section metadata must match content');
    const html = await readFile(path.join(output, 'notes', chapter.slug, 'index.html'), 'utf8');
    assert.match(html, /aria-label="章节导航"/);
    assert.doesNotMatch(html, /class="katex-error"/, chapter.slug + ': fix malformed mathematics');
    if (body.includes('$')) assert.match(html, /class="katex(?:\s|")/);
  }
});

test('the reading path links chapters while review records follow four-chapter windows', async () => {
  const html = await readFile(path.join(output, 'notes/foundations-course-index/index.html'), 'utf8');
  for (const chapter of chapterData.chapters) {
    assert.ok(html.includes(base + '/notes/' + chapter.slug + '/'), 'Reading path omits chapter ' + chapter.id);
  }
  for (const block of curriculum.blocks) {
    const start = block.chapterIds[0];
    const end = block.chapterIds.at(-1);
    const review = await readFile(new URL('../docs/foundations/chapter-reviews/chapters-' + pad(start) + '-' + pad(end) + '.md', import.meta.url), 'utf8');
    assert.ok(review.length > 200);
    assert.ok(html.includes('id="weeks-' + pad(block.weekStart) + '-' + pad(block.weekEnd) + '"'));
  }
  const listing = await readFile(path.join(output, 'notes/index.html'), 'utf8');
  assert.doesNotMatch(listing, /href="[^"]*\/notes\/foundations-weeks-/);
});

test('retired combined lectures and starter URLs redirect to the chapter reading structure', async () => {
  assert.equal(legacy.length, 22);
  for (const item of legacy) {
    const filename = path.join(output, item.from.replace(/^\/+/, ''), 'index.html');
    const html = await readFile(filename, 'utf8');
    assert.match(html, /http-equiv="refresh"/);
    assert.ok(html.includes(base + item.to), item.from + ': preserve deployment prefix and destination anchor');
  }
});

test('each chapter reaches its assigned cumulative review and beginner support', async () => {
  const review = await readFile(path.join(output, 'notes/foundations-review-exercises/index.html'), 'utf8');
  const guide = await readFile(path.join(output, 'notes/foundations-study-guide/index.html'), 'utf8');
  assert.doesNotMatch(review + guide, /class="katex-error"/);
  for (const block of curriculum.blocks) {
    const range = pad(block.chapterIds[0]) + '-' + pad(block.chapterIds.at(-1));
    assert.ok(review.includes('id="review-' + range + '"'), 'Missing review questions ' + range);
    assert.ok(review.includes('id="answers-' + range + '"'), 'Missing review answers ' + range);
    for (const id of block.chapterIds) {
      const chapter = chapterData.chapters[id];
      const html = await readFile(path.join(output, 'notes', chapter.slug, 'index.html'), 'utf8');
      assert.ok(html.includes(base + '/notes/foundations-review-exercises/#review-' + range), chapter.slug + ': review mapping');
      assert.ok(html.includes(base + '/notes/foundations-study-guide/'), chapter.slug + ': support entry');
    }
  }
});

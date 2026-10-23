import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const curriculum = JSON.parse(await readFile(new URL('../src/data/direction-curriculum.json', import.meta.url), 'utf8'));
const source = new URL('../src/content/notes/', import.meta.url);
const output = path.resolve(process.env.TEST_DIST || 'dist');
const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const chapters = [];
for (const filename of await readdir(source)) {
  if (!/\.mdx?$/.test(filename)) continue;
  const markdown = await readFile(new URL(filename, source), 'utf8');
  const [, metadata, ...body] = markdown.split('---');
  const track = metadata?.match(/^directionTrack:\s*['"]([^'"]+)['"]/m)?.[1];
  const order = metadata?.match(/^directionChapter:\s*(\d+)/m)?.[1];
  assert.equal(Boolean(track), Boolean(order), filename + ': track and chapter must be supplied together');
  if (track) chapters.push({ filename, slug: filename.replace(/\.mdx?$/, ''), track, order: Number(order), metadata, body: body.join('---') });
}

test('the six requested directions have independent, extensible teaching orders', () => {
  assert.deepEqual(curriculum.tracks.map(track => track.id), ['llm', 'embodied', 'robotics', 'physics', 'agent', 'gesture']);
  assert.equal(new Set(chapters.map(chapter => chapter.slug)).size, chapters.length);
  for (const chapter of chapters) assert.ok(curriculum.tracks.some(track => track.id === chapter.track), chapter.filename + ': unknown direction');
  for (const track of curriculum.tracks) {
    const entries = chapters.filter(chapter => chapter.track === track.id).sort((a, b) => a.order - b.order);
    assert.ok(entries.length > 0, track.title + ': missing lessons');
    assert.deepEqual(entries.map(chapter => chapter.order), entries.map((_, index) => index + 1), track.title + ': duplicate or missing teaching position');
    for (const chapter of entries) {
      assert.match(chapter.metadata, new RegExp("title: ['\"]" + track.prefix + String(chapter.order).padStart(2, '0') + ' · '));
      assert.doesNotMatch(chapter.metadata, /^foundation(?:Order|Chapter):/m, 'Direction chapters must not overwrite the public foundations numbering');
    }
  }
});

test('authored chapter labels and adjacent links match the current teaching order', () => {
  const bySlug = new Map(chapters.map(chapter => [chapter.slug, chapter]));
  const labelOf = chapter => {
    const track = curriculum.tracks.find(track => track.id === chapter.track);
    return track.prefix + String(chapter.order).padStart(2, '0');
  };
  for (const chapter of chapters) {
    for (const link of chapter.body.matchAll(/\[([^\]]*)\]\(\/notes\/([^/#)]+)\/?(?:#[^)]*)?\)/g)) {
      const target = bySlug.get(link[2]);
      if (!target) continue;
      const numbered = link[1].match(/(?:^|[：\s])([LERPTG]\d{2})(?!\d)/);
      if (numbered) assert.equal(numbered[1], labelOf(target), chapter.slug + ': stale label for ' + target.slug);
      const offset = link[1].startsWith('上一章') ? -1 : link[1].startsWith('下一章') ? 1 : 0;
      if (offset) {
        assert.equal(target.track, chapter.track, chapter.slug + ': adjacent link changes direction');
        assert.equal(target.order, chapter.order + offset, chapter.slug + ': stale adjacent link');
      }
    }
  }
});

test('direction lessons contain teaching material and their rendered mathematics is valid', async () => {
  for (const chapter of chapters) {
    assert.ok(chapter.body.length > 1400, chapter.filename + ': a lesson must contain more than a topic outline');
    assert.ok(/先修/.test(chapter.body), chapter.filename + ': missing prerequisite guidance');
    assert.ok(/自测/.test(chapter.body), chapter.filename + ': missing self-assessment');
    assert.ok(/答案|参考解|\*\*解/.test(chapter.body), chapter.filename + ': missing worked answers');
    assert.ok(/实验|可复现/.test(chapter.body), chapter.filename + ': missing reproducible practice');
    // Applicability limits require semantic review; their presence cannot be
    // established reliably by requiring a particular word in every lesson.
    let fence = false;
    let sections = 0;
    for (const line of chapter.body.split(/\r?\n/)) {
      if (/^(?:~~~|```)/.test(line)) fence = !fence;
      if (!fence && line.startsWith('## ')) sections++;
    }
    assert.equal(Number(chapter.metadata.match(/^chapters:\s*(\d+)/m)?.[1]), sections, chapter.filename + ': section count differs');
    const html = await readFile(path.join(output, 'notes', chapter.slug, 'index.html'), 'utf8');
    assert.match(html, /aria-label="方向章节导航"/);
    assert.ok(!html.includes('class="katex-error"'), chapter.slug + ': malformed mathematics');
    if (chapter.body.includes('$')) assert.match(html, /class="katex(?:\s|")/);
  }
});

test('the catalog and chapter navigation follow metadata rather than a fixed chapter count', async () => {
  const hub = await readFile(path.join(output, 'notes/direction-foundations/index.html'), 'utf8');
  const listing = await readFile(path.join(output, 'notes/index.html'), 'utf8');
  for (const track of curriculum.tracks) {
    assert.ok(hub.includes('id="' + track.id + '"'), track.title + ': no catalog anchor');
    assert.ok(listing.includes('data-note-track="' + track.id + '"'), track.title + ': no listing filter');
    const entries = chapters.filter(chapter => chapter.track === track.id).sort((a, b) => a.order - b.order);
    let previousPosition = -1;
    for (let index = 0; index < entries.length; index++) {
      const chapter = entries[index];
      const position = listing.indexOf('href="' + base + '/notes/' + chapter.slug + '/"');
      assert.ok(position > previousPosition, chapter.slug + ': listing must follow teaching order');
      previousPosition = position;
      const html = await readFile(path.join(output, 'notes', chapter.slug, 'index.html'), 'utf8');
      assert.ok(hub.includes(base + '/notes/' + chapter.slug + '/'), 'Catalog omits ' + chapter.slug);
      assert.ok(html.includes(base + '/notes/direction-foundations/#' + track.id));
      for (const adjacent of [entries[index - 1], entries[index + 1]].filter(Boolean)) {
        assert.ok(html.includes(base + '/notes/' + adjacent.slug + '/'), chapter.slug + ': missing adjacent lesson ' + adjacent.slug);
      }
    }
  }
});

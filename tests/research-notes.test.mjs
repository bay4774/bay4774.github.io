import test from 'node:test';
import assert from 'node:assert/strict';
import remarkResearchNotes from '../src/lib/remark-research-notes.mjs';

const paragraph = value => ({ type: 'paragraph', children: [{ type: 'text', value }] });
const transform = tree => { remarkResearchNotes()(tree); return tree; };

test('my-take preserves rich content and produces a semantic research note', () => {
  const heading = { type: 'heading', depth: 3, children: [{ type: 'text', value: 'A testable idea' }] };
  const code = { type: 'code', lang: 'python', value: 'evaluate(policy)' };
  const math = { type: 'math', value: 'x_{t+1} = f(x_t)' };
  const body = { type: 'paragraph', children: [{ type: 'emphasis', children: [{ type: 'text', value: 'My hypothesis' }] }] };
  const tree = transform({ type: 'root', children: [paragraph('Before'), paragraph(':::my-take'), heading, body, code, math, paragraph(':::'), paragraph('After')] });
  assert.equal(tree.children.length, 3);
  const note = tree.children[1];
  assert.equal(note.data.hName, 'aside');
  assert.equal(note.data.hProperties.role, 'note');
  assert.deepEqual(note.data.hProperties.className, ['research-note']);
  assert.match(note.children[0].children[0].value, /RESEARCHER’S NOTE/);
  assert.deepEqual(note.children.slice(1), [heading, body, code, math]);
  assert.equal(tree.children[2].children[0].value, 'After');
});

test('multiple callouts are transformed independently, including nested containers', () => {
  const nested = { type: 'blockquote', children: [paragraph(':::my-take'), paragraph('Nested idea'), paragraph(':::')] };
  const tree = transform({ type: 'root', children: [paragraph(':::my-take'), paragraph('First idea'), paragraph(':::'), paragraph('Middle'), nested, paragraph(':::my-take'), paragraph('Last idea'), paragraph(':::')] });
  assert.equal(tree.children.length, 4);
  assert.equal(tree.children[0].data.hName, 'aside');
  assert.equal(tree.children[2].children[0].data.hName, 'aside');
  assert.equal(tree.children[3].data.hName, 'aside');
});

test('an unmatched opening marker leaves the document intact', () => {
  const tree = { type: 'root', children: [paragraph(':::my-take'), paragraph('An unfinished thought'), { type: 'code', value: ':::' }] };
  const original = structuredClone(tree);
  transform(tree);
  assert.deepEqual(tree, original);
});

test('inline markers, styled markers and code are ordinary content', () => {
  const tree = { type: 'root', children: [paragraph('Use :::my-take as a standalone line.'), { type: 'paragraph', children: [{ type: 'strong', children: [{ type: 'text', value: ':::my-take' }] }] }, { type: 'code', lang: 'markdown', value: ':::my-take\n\nA thought\n\n:::' }, paragraph(':::')] };
  const original = structuredClone(tree);
  transform(tree);
  assert.deepEqual(tree, original);
});

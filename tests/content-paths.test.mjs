import test from 'node:test';
import assert from 'node:assert/strict';
import remarkContentPaths from '../src/lib/remark-content-paths.mjs';

test('project deployments rewrite Markdown links, images and reference definitions at build time', () => {
  const tree = { type: 'root', children: [
    { type: 'paragraph', children: [
      { type: 'link', url: '/digest/?topic=Motion-Tracking#reader', children: [{ type: 'text', value: 'Read' }] },
      { type: 'image', url: '/images/teaser.webp', alt: 'Architecture' },
    ] },
    { type: 'definition', identifier: 'slides', url: '/files/slides.pdf' },
  ] };
  remarkContentPaths({ base: '/my-site/' })(tree);
  assert.equal(tree.children[0].children[0].url, '/my-site/digest/?topic=Motion-Tracking#reader');
  assert.equal(tree.children[0].children[1].url, '/my-site/images/teaser.webp');
  assert.equal(tree.children[1].url, '/my-site/files/slides.pdf');
});

test('external, protocol-relative, anchor and relative URLs retain their meaning', () => {
  const urls = ['https://example.com/paper', '//cdn.example.com/teaser.webp', '#method', 'mailto:research@example.com', '../related/', 'data:image/png;base64,example'];
  const tree = { type: 'root', children: urls.map(url => ({ type: 'link', url, children: [] })) };
  remarkContentPaths({ base: '/my-site' })(tree);
  assert.deepEqual(tree.children.map(node => node.url), urls);
});

test('root deployments preserve source URLs', () => {
  const tree = { type: 'root', children: [{ type: 'link', url: '/notes/', children: [] }, { type: 'image', url: '/images/photo.webp', alt: 'Photo' }] };
  const original = structuredClone(tree);
  remarkContentPaths({ base: '/' })(tree);
  assert.deepEqual(tree, original);
});

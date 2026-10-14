import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { markdownConfigDefaults } from '@astrojs/markdown-remark';
import config from '../astro.config.mjs';

// Keep this fixture out of src/content so it never becomes a public article.
// Use the site's actual processor: removing a required plugin must fail tests.
const fixture = String.raw`## A rendering fixture

:::my-take

**A testable idea** with an inline equation $x^2$.

:::

$$
x_{t+1} = f(x_t)
\tag{1}
$$

~~~python
evaluate(policy)
~~~
`;
const shared = { ...markdownConfigDefaults, ...config.markdown };

test('configured Markdown renders callouts, numbered math and highlighted code independently of site content', async () => {
  const renderer = await config.markdown.processor.createRenderer(shared);
  const { code: html } = await renderer.render(fixture);
  assert.match(html, /<aside[^>]+class="research-note"[^>]+role="note"/);
  assert.match(html, /<strong>A testable idea<\/strong>/);
  assert.doesNotMatch(html, /:::my-take/);
  assert.match(html, /class="katex-display"/);
  assert.match(html, /class="tag"/);
  assert.match(html, /class="astro-code/);
});

test('configured MDX compiles callouts, numbered math and highlighted code independently of site content', async () => {
  const renderer = await config.markdown.processor.createMdxRenderer(shared, {
    srcDir: new URL('../src/', import.meta.url),
    optimize: false,
    sourcemap: false,
  });
  const { code } = await renderer.process(fixture, fileURLToPath(new URL('./fixture.mdx', import.meta.url)), {});
  assert.match(code, /_components\.aside/);
  assert.match(code, /class: "research-note"/);
  assert.match(code, /role: "note"/);
  assert.doesNotMatch(code, /:::my-take/);
  assert.match(code, /class: "katex-display"/);
  assert.match(code, /class: "tag"/);
  assert.match(code, /class: "astro-code/);
});

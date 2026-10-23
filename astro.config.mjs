import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkResearchNotes from './src/lib/remark-research-notes.mjs';
import remarkContentPaths from './src/lib/remark-content-paths.mjs';

const foundationRedirects = JSON.parse(readFileSync(new URL('./src/data/foundations-legacy-links.json', import.meta.url), 'utf8'));
const deploymentBase = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

export default defineConfig({
  site: process.env.SITE_URL || 'https://your-username.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  redirects: Object.fromEntries(foundationRedirects.map(({ from, to }) => [from, deploymentBase + to])),
  integrations: [mdx()],
  markdown: {
    processor: unified({
      remarkPlugins: [[remarkContentPaths, { base: process.env.BASE_PATH || '/' }], remarkResearchNotes, remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }]],
    }),
    shikiConfig: { theme: 'github-dark', wrap: false },
  },
});

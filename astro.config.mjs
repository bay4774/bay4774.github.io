import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkResearchNotes from './src/lib/remark-research-notes.mjs';
import remarkContentPaths from './src/lib/remark-content-paths.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://your-username.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    processor: unified({
      remarkPlugins: [[remarkContentPaths, { base: process.env.BASE_PATH || '/' }], remarkResearchNotes, remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }]],
    }),
    shikiConfig: { theme: 'github-dark', wrap: false },
  },
});

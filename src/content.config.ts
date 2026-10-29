import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const common = {
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()),
  demo: z.boolean().default(false),
  draft: z.boolean().default(false),
};
const publications = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/publications' }),
  schema: z.object({
    ...common,
    venue: z.string(),
    status: z.string(),
    authors: z.array(z.object({ name: z.string(), self: z.boolean().default(false) })),
    featured: z.boolean().default(false),
    image: z.string(),
    video: z.string().optional(),
    paper: z.string().optional(),
    code: z.string().optional(),
    videoLink: z.string().optional(),
    bibtex: z.string().optional(),
  }),
});
const digest = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/digest' }),
  schema: z.object({
    ...common,
    originalTitle: z.string(),
    authors: z.string(),
    lab: z.string(),
    venue: z.string(),
    year: z.number(),
    rating: z.enum(['must-read', 'inspiring', 'engineering']),
    stars: z.number().min(1).max(5).default(4),
    method: z.string(),
    verdict: z.string(),
    readTime: z.number(),
    week: z.string(),
    curated: z.boolean().default(false),
    foundationOrder: z.number().int().nonnegative().optional(),
    featured: z.boolean().default(false),
    citations: z.object({
      count: z.number().int().nonnegative(),
      source: z.string(),
      url: z.url(),
      accessed: z.string(),
    }).optional(),
    originalUrl: z.string().optional(),
    code: z.string().optional(),
    related: z.array(z.string()).default([]),
  }),
});
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    ...common,
    category: z.enum(['theory', 'tutorial', 'lecture', 'teaching']),
    foundationOrder: z.number().int().nonnegative().optional(),
    foundationChapter: z.number().int().min(0).max(79).optional(),
    directionTrack: z.enum(['llm', 'embodied', 'robotics', 'physics', 'agent', 'gesture']).optional(),
    directionChapter: z.number().int().positive().optional(),
    reviewStatus: z.enum(['self-reviewed', 'reviewed']).optional(),
    readTime: z.number(),
    chapters: z.number().default(1),
    pdf: z.string().optional(),
    slides: z.string().optional(),
    html: z.string().optional(),
  }),
});
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    ...common,
    image: z.string(),
    category: z.string(),
    status: z.string(),
    stack: z.array(z.string()),
    code: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});
export const collections = { publications, digest, notes, projects };

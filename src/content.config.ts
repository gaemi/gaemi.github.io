import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['private', 'draft', 'published']).default('private'),
  }),
});

/**
 * Reserved schema for future portfolio / product entries (`src/content/work/`).
 * Intentionally unexposed in UI and routes until items are ready to publish.
 */
const work = defineCollection({
  loader: glob({
    base: './src/content/work',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    kind: z.enum(['product', 'project', 'experiment']).default('project'),
    href: z.url().optional(),
    repo: z.url().optional(),
    order: z.number().int().default(0),
    status: z.enum(['draft', 'published']).default('draft'),
  }),
});

export const collections = { blog, work };

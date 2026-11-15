import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';

function resolveWritingPostsDir(): string {
  const root = process.cwd();
  if (process.env.WRITING_POSTS_DIR) {
    return path.resolve(root, process.env.WRITING_POSTS_DIR);
  }
  if (process.env.WRITING_DIR) {
    return path.resolve(root, process.env.WRITING_DIR, 'posts');
  }
  const ciCheckout = path.resolve(root, '.writing/posts');
  if (existsSync(ciCheckout)) {
    return ciCheckout;
  }
  return path.resolve(root, '../writing/posts');
}

/**
 * Loads blog entries from the external private `writing` repository.
 * - `astro dev` (`ctx.watcher` present): keeps both `private` and `published` entries with live HMR.
 * - `astro build` / `astro check` (`!ctx.watcher`): validates schemas for all entries, then purges
 *   non-published entries from the content store before Vite bundles co-located assets or pages.
 */
function createWritingLoader(postsDir: string): Loader {
  const baseUrl = pathToFileURL(`${postsDir.replace(/\/+$/, '')}/`).href;
  const inner = glob({
    base: baseUrl,
    pattern: '**/*.{md,mdx}',
  });

  return {
    name: 'writing-blog-loader',
    load: async (ctx) => {
      await inner.load(ctx);
      if (!ctx.watcher) {
        for (const [id, entry] of ctx.store.entries()) {
          if ((entry.data as { status?: string } | undefined)?.status !== 'published') {
            ctx.store.delete(id);
          }
        }
      }
    },
  };
}

const blog = defineCollection({
  loader: createWritingLoader(resolveWritingPostsDir()),
  schema: z
    .object({
      title: z.string().min(1),
      summary: z.string().default(''),
      publishedAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      status: z.enum(['private', 'draft', 'published']).default('private'),
    })
    .refine((data) => data.status !== 'published' || Boolean(data.publishedAt), {
      message: 'published 상태의 글에는 publishedAt 날짜가 필요합니다.',
      path: ['publishedAt'],
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

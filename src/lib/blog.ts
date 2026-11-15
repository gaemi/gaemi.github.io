import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export function isPublishedEntry(entry: BlogEntry): boolean {
  return entry.data.status === 'published';
}

export function isPrivateEntry(entry: BlogEntry): boolean {
  return entry.data.status !== 'published';
}

export function getPostSlug(entry: BlogEntry): string {
  return entry.id;
}

export function getPostDate(entry: BlogEntry): Date | null {
  return entry.data.publishedAt ?? entry.data.updatedAt ?? null;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatEntryDate(entry: BlogEntry): string {
  const date = getPostDate(entry);
  return date ? formatDate(date) : '미발행';
}

/**
 * In production builds (`astro build`), strictly returns `published` posts.
 * In local development (`astro dev`), includes `private` posts from `writing/posts` for live preview.
 */
export async function getVisiblePosts(isProd = import.meta.env.PROD): Promise<BlogEntry[]> {
  const entries = await getCollection('blog');
  const filtered = entries.filter((entry) => (isProd ? isPublishedEntry(entry) : true));

  return filtered.sort((a, b) => {
    const aTime = getPostDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = getPostDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (bTime !== aTime) return bTime - aTime;
    return a.data.title.localeCompare(b.data.title, 'ko');
  });
}

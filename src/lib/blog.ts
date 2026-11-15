import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export function isPrivateEntry(entry: BlogEntry): boolean {
  return entry.id.startsWith('private/') || entry.data.status === 'private';
}

export function isPublishedEntry(entry: BlogEntry): boolean {
  return !entry.id.startsWith('private/') && entry.data.status === 'published';
}

export function getPostSlug(entry: BlogEntry): string {
  return entry.id.replace(/^private\//, '');
}

export function getPostDate(entry: BlogEntry): Date {
  return entry.data.publishedAt ?? entry.data.updatedAt ?? new Date(0);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * In production builds (`astro build`), strictly returns `published` posts outside `private/`.
 * In local development (`astro dev`), includes `private` and `draft` posts for live preview.
 */
export async function getVisiblePosts(isProd = import.meta.env.PROD): Promise<BlogEntry[]> {
  const entries = await getCollection('blog');
  const filtered = entries.filter((entry) => (isProd ? isPublishedEntry(entry) : true));

  return filtered.sort((a, b) => {
    const timeDiff = getPostDate(b).getTime() - getPostDate(a).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.data.title.localeCompare(b.data.title, 'ko');
  });
}

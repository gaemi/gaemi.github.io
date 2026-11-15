import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { siteConfig } from '../data/site';
import { getPostDate, getPostSlug, getVisiblePosts } from '../lib/blog';

export async function GET(context: APIContext) {
  // Always enforce production visibility so private/draft posts never enter RSS
  const posts = await getVisiblePosts(true);

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: getPostDate(post),
      link: `/blog/${getPostSlug(post)}/`,
    })),
  });
}

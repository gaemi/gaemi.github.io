import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');

const REQUIRED_DIST_FILES = [
  'index.html',
  'blog/index.html',
  '404.html',
  'rss.xml',
  '.nojekyll',
  'apps/use-trail/privacy/index.html',
];

function resolveWritingPostsDir() {
  if (process.env.WRITING_POSTS_DIR) {
    return path.resolve(ROOT, process.env.WRITING_POSTS_DIR);
  }
  if (process.env.WRITING_DIR) {
    return path.resolve(ROOT, process.env.WRITING_DIR, 'posts');
  }
  const ciCheckout = path.resolve(ROOT, '.writing/posts');
  if (existsSync(ciCheckout)) {
    return ciCheckout;
  }
  return path.resolve(ROOT, '../writing/posts');
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir, baseDir = dir) {
  const out = [];
  if (!(await exists(dir))) return out;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(full, baseDir)));
    } else if (entry.isFile()) {
      out.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

function extractStatus(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return 'private';
  const line = match[1].match(/^status:\s*(.+?)\s*$/m);
  return line ? line[1].replace(/^['"]|['"]$/g, '') : 'private';
}

function extractRelativeImageStems(raw) {
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').replace(/```[\s\S]*?```/g, '');
  const stems = [];
  const imgRe = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = imgRe.exec(body)) !== null) {
    const target = match[1];
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('/') ||
      target.startsWith('data:')
    ) {
      continue;
    }
    const clean = target.split('#')[0].split('?')[0];
    const base = path.basename(clean, path.extname(clean));
    if (base) stems.push(base);
  }
  return stems;
}

function fileToSlug(relPath) {
  return relPath.replace(/\/index\.(md|mdx)$/, '').replace(/\.(md|mdx)$/, '');
}

async function main() {
  const errors = [];

  // 1. Verify required output artifacts & preserved app routes
  for (const rel of REQUIRED_DIST_FILES) {
    if (!(await exists(path.join(DIST_DIR, rel)))) {
      errors.push(`Missing required build output: dist/${rel}`);
    }
  }

  // 2. Enforce content-code separation (no blog markdown stored in gaemi.github.io)
  const legacyBlogDir = path.join(ROOT, 'src/content/blog');
  const legacyFiles = (await walkFiles(legacyBlogDir)).filter((f) => /\.(md|mdx)$/.test(f));
  if (legacyFiles.length > 0) {
    errors.push(
      `Blog markdown found inside site repo (${legacyFiles.join(', ')}). Blog content belongs in the private "writing" repository.`,
    );
  }

  // 3. Verify published vs private posts from external writing repo
  const postsDir = resolveWritingPostsDir();
  const hasWritingDir = await exists(postsDir);
  const blogFiles = hasWritingDir
    ? (await walkFiles(postsDir)).filter((f) => /\.(md|mdx)$/.test(f))
    : [];

  const rssContent = (await exists(path.join(DIST_DIR, 'rss.xml')))
    ? await fs.readFile(path.join(DIST_DIR, 'rss.xml'), 'utf8')
    : '';

  const distFiles = await walkFiles(DIST_DIR);
  const astroAssetFiles = distFiles
    .filter((f) => f.startsWith('_astro/'))
    .map((f) => path.basename(f));
  const sitemapFiles = distFiles.filter((f) => /^sitemap.*\.xml$/.test(f));
  const sitemapContents = await Promise.all(
    sitemapFiles.map((f) => fs.readFile(path.join(DIST_DIR, f), 'utf8')),
  );

  const parsedPosts = await Promise.all(
    blogFiles.map(async (rel) => {
      const raw = await fs.readFile(path.join(postsDir, rel), 'utf8');
      return {
        rel,
        slug: fileToSlug(rel),
        status: extractStatus(raw),
        imageStems: extractRelativeImageStems(raw),
      };
    }),
  );

  const publishedImageStems = new Set(
    parsedPosts.filter((p) => p.status === 'published').flatMap((p) => p.imageStems),
  );

  for (const post of parsedPosts) {
    const builtPostPath = path.join(DIST_DIR, 'blog', post.slug, 'index.html');
    const routeNeedle = `/blog/${post.slug}/`;

    if (post.status !== 'published') {
      if (await exists(builtPostPath)) {
        errors.push(
          `Unpublished post leaked into HTML build: dist/blog/${post.slug}/index.html (${post.rel})`,
        );
      }
      if (rssContent.includes(routeNeedle)) {
        errors.push(`Unpublished post leaked into RSS feed: ${routeNeedle} (${post.rel})`);
      }
      for (let i = 0; i < sitemapContents.length; i++) {
        if (sitemapContents[i].includes(routeNeedle)) {
          errors.push(
            `Unpublished post leaked into ${sitemapFiles[i]}: ${routeNeedle} (${post.rel})`,
          );
        }
      }
      for (const stem of post.imageStems) {
        if (publishedImageStems.has(stem)) continue;
        const leakedAsset = astroAssetFiles.find((name) => name.startsWith(`${stem}.`));
        if (leakedAsset) {
          errors.push(
            `Unpublished post asset leaked into dist/_astro/${leakedAsset} (${post.rel})`,
          );
        }
      }
    } else if (!(await exists(builtPostPath))) {
      errors.push(
        `Published post missing from build output: dist/blog/${post.slug}/index.html (${post.rel})`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('✗ Build verification failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const sourceNote = hasWritingDir ? `${blogFiles.length} writing post(s) checked` : 'writing repo not mounted (0 posts)';
  console.log(
    `✓ Build verified: ${REQUIRED_DIST_FILES.length} core routes intact, ${sourceNote} (zero leaks).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

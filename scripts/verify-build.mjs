import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');

const REQUIRED_DIST_FILES = [
  'index.html',
  'blog/index.html',
  '404.html',
  'rss.xml',
  '.nojekyll',
  'apps/use-trail/privacy/index.html',
];

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

async function main() {
  const errors = [];

  // 1. Verify required output artifacts & preserved app routes
  for (const rel of REQUIRED_DIST_FILES) {
    if (!(await exists(path.join(DIST_DIR, rel)))) {
      errors.push(`Missing required build output: dist/${rel}`);
    }
  }

  // 2. Verify private/draft posts never leak into dist HTML, RSS, or Sitemap
  const rssContent = (await exists(path.join(DIST_DIR, 'rss.xml')))
    ? await fs.readFile(path.join(DIST_DIR, 'rss.xml'), 'utf8')
    : '';

  const distFiles = await walkFiles(DIST_DIR);
  const sitemapFiles = distFiles.filter((f) => /^sitemap.*\.xml$/.test(f));
  const sitemapContents = await Promise.all(
    sitemapFiles.map((f) => fs.readFile(path.join(DIST_DIR, f), 'utf8')),
  );

  const blogFiles = (await walkFiles(BLOG_DIR)).filter((f) => /\.(md|mdx)$/.test(f));

  for (const rel of blogFiles) {
    const raw = await fs.readFile(path.join(BLOG_DIR, rel), 'utf8');
    const isInPrivateDir = rel.startsWith('private/');
    const status = extractStatus(raw);
    const slug = rel.replace(/^private\//, '').replace(/\.(md|mdx)$/, '');
    const builtPostPath = path.join(DIST_DIR, 'blog', slug, 'index.html');
    const routeNeedle = `/blog/${slug}/`;

    if (isInPrivateDir || status !== 'published') {
      if (await exists(builtPostPath)) {
        errors.push(`Unpublished post leaked into HTML build: dist/blog/${slug}/index.html (${rel})`);
      }
      if (rssContent.includes(routeNeedle)) {
        errors.push(`Unpublished post leaked into RSS feed: ${routeNeedle} (${rel})`);
      }
      for (let i = 0; i < sitemapContents.length; i++) {
        if (sitemapContents[i].includes(routeNeedle)) {
          errors.push(`Unpublished post leaked into ${sitemapFiles[i]}: ${routeNeedle} (${rel})`);
        }
      }
    } else {
      if (!(await exists(builtPostPath))) {
        errors.push(`Published post missing from build output: dist/blog/${slug}/index.html (${rel})`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('✗ Build verification failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `✓ Build verified: ${REQUIRED_DIST_FILES.length} core routes intact, ${blogFiles.length} blog entries checked (zero leaks).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

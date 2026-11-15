import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const PRIVATE_DIR = path.join(BLOG_DIR, 'private');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function todayKST() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function validateSlug(raw) {
  if (!raw) {
    throw new Error('Usage: npm run post:<new|release> -- <slug>');
  }
  const normalized = raw.replace(/^private\//, '').replace(/\.(md|mdx)$/, '');
  if (!SLUG_RE.test(normalized) || normalized.startsWith('private')) {
    throw new Error(
      `Invalid slug "${raw}". Use lowercase letters, numbers, and hyphens (e.g. "first-note").`,
    );
  }
  return normalized;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkMarkdown(dir, baseDir = dir) {
  const out = [];
  if (!(await exists(dir))) return out;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full, baseDir)));
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      out.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return out.sort();
}

function extractFrontmatterField(raw, field) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const lineMatch = match[1].match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'));
  return lineMatch ? lineMatch[1].replace(/^['"]|['"]$/g, '') : null;
}

function upsertFrontmatter(raw, updates) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
  if (!match) {
    throw new Error('Missing YAML frontmatter block (--- ... ---).');
  }
  let fm = match[1];
  const body = match[2];

  for (const [key, value] of Object.entries(updates)) {
    const lineRe = new RegExp(`^${key}:\\s*.*$`, 'm');
    if (lineRe.test(fm)) {
      fm = fm.replace(lineRe, `${key}: ${value}`);
    } else {
      fm = `${fm}\n${key}: ${value}`;
    }
  }

  return `---\n${fm}\n---${body}`;
}

async function cmdNew(positional, flags) {
  const slug = validateSlug(positional[0]);
  const isTrackedDraft = Boolean(flags.draft);
  const status = isTrackedDraft ? 'draft' : 'private';
  const targetDir = isTrackedDraft ? BLOG_DIR : PRIVATE_DIR;
  const targetPath = path.join(targetDir, `${slug}.md`);

  for (const candidate of [
    path.join(PRIVATE_DIR, `${slug}.md`),
    path.join(PRIVATE_DIR, `${slug}.mdx`),
    path.join(BLOG_DIR, `${slug}.md`),
    path.join(BLOG_DIR, `${slug}.mdx`),
  ]) {
    if (await exists(candidate)) {
      throw new Error(`Post already exists at ${path.relative(ROOT, candidate)}`);
    }
  }

  const title =
    typeof flags.title === 'string' && flags.title.trim()
      ? flags.title.trim()
      : slug.replace(/-/g, ' ');
  const date = todayKST();

  const template = `---
title: ${JSON.stringify(title)}
summary: ""
publishedAt: ${date}
status: ${status}
tags: []
---

여기에 본문을 작성하세요.
`;

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, template, 'utf8');

  const rel = path.relative(ROOT, targetPath);
  console.log(`✓ Created ${status} post: ${rel}`);
  console.log(`  Preview URL (dev): http://localhost:4321/blog/${slug}/`);
  if (!isTrackedDraft) {
    console.log(`  Note: ${rel} is git-ignored until released with "npm run post:release -- ${slug}"`);
  }
}

async function cmdRelease(positional, flags) {
  const slug = validateSlug(positional[0]);
  const dateOverride = typeof flags.date === 'string' ? flags.date : null;

  let sourcePath = null;
  let ext = '.md';

  for (const [dir, extension] of [
    [PRIVATE_DIR, '.md'],
    [PRIVATE_DIR, '.mdx'],
    [BLOG_DIR, '.md'],
    [BLOG_DIR, '.mdx'],
  ]) {
    const candidate = path.join(dir, `${slug}${extension}`);
    if (await exists(candidate)) {
      sourcePath = candidate;
      ext = extension;
      break;
    }
  }

  if (!sourcePath) {
    throw new Error(`Could not find private or draft post for slug "${slug}".`);
  }

  const destPath = path.join(BLOG_DIR, `${slug}${ext}`);
  if (sourcePath !== destPath && (await exists(destPath))) {
    throw new Error(
      `Destination already exists at ${path.relative(ROOT, destPath)}. Resolve manually before releasing.`,
    );
  }

  const raw = await fs.readFile(sourcePath, 'utf8');
  const existingDate = extractFrontmatterField(raw, 'publishedAt');
  const publishedAt = dateOverride ?? existingDate ?? todayKST();

  const updated = upsertFrontmatter(raw, {
    status: 'published',
    publishedAt,
  });

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, updated, 'utf8');
  if (sourcePath !== destPath) {
    await fs.unlink(sourcePath);
  }

  console.log(`✓ Released post: ${path.relative(ROOT, destPath)} (publishedAt: ${publishedAt})`);
  console.log('  Run "npm run verify" before committing.');
}

async function cmdList() {
  const files = await walkMarkdown(BLOG_DIR);
  if (files.length === 0) {
    console.log('No blog posts found in src/content/blog/.');
    return;
  }

  for (const rel of files) {
    const full = path.join(BLOG_DIR, rel);
    const raw = await fs.readFile(full, 'utf8');
    const isInPrivateDir = rel.startsWith('private/');
    const fmStatus = extractFrontmatterField(raw, 'status') ?? 'private';
    const effectiveStatus = isInPrivateDir ? 'private' : fmStatus;
    const date = extractFrontmatterField(raw, 'publishedAt') ?? '—';
    const title = extractFrontmatterField(raw, 'title') ?? rel;
    console.log(`${effectiveStatus.padEnd(10)} ${date.padEnd(12)} ${rel}  (${title})`);
  }
}

async function main() {
  const [subcommand, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);

  switch (subcommand) {
    case 'new':
      await cmdNew(positional, flags);
      break;
    case 'release':
      await cmdRelease(positional, flags);
      break;
    case 'list':
      await cmdList();
      break;
    default:
      throw new Error('Usage: node scripts/post.mjs <new|release|list> [slug] [--title ...] [--draft]');
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

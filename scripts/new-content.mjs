import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const collections = new Map([
  ['digest', { folder: 'digest', template: 'digest.md' }],
  ['publication', { folder: 'publications', template: 'publication.md' }],
  ['note', { folder: 'notes', template: 'note.md' }],
  ['project', { folder: 'projects', template: 'project.md' }],
]);
const aliases = new Map([['publications', 'publication'], ['notes', 'note'], ['projects', 'project']]);
const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function validateSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100 || reservedNames.test(slug)) {
    throw new Error('slug 必须是 1–100 个小写英文字母、数字或单个连字符，例如 diffusion-policy；不能包含路径或 Windows 保留名称。');
  }
  return slug;
}

export function isoWeek(date) {
  const current = new Date(`${date}T12:00:00Z`);
  const weekday = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - weekday);
  const year = current.getUTCFullYear();
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const number = Math.ceil(((current - firstDay) / 86400000 + 1) / 7);
  return `${year}-W${String(number).padStart(2, '0')}`;
}

export function todayInShanghai(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = type => parts.find(value => value.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export async function createContent(kind, slug, options = {}) {
  const normalizedKind = aliases.get(kind) || kind;
  const collection = collections.get(normalizedKind);
  if (!collection) throw new Error('类型应为 digest、publication、note 或 project。');
  validateSlug(slug);
  const root = path.resolve(options.root || projectRoot);
  const date = options.date || todayInShanghai();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error('日期必须是有效的 YYYY-MM-DD 日期。');
  }
  const resolvedRoot = await realpath(root);
  let resolvedFolder = resolvedRoot;
  for (const segment of ['src', 'content', collection.folder]) {
    const next = path.join(resolvedFolder, segment);
    await mkdir(next, { recursive: true });
    resolvedFolder = await realpath(next);
    const relativeFolder = path.relative(resolvedRoot, resolvedFolder);
    if (relativeFolder.startsWith(`..${path.sep}`) || relativeFolder === '..' || path.isAbsolute(relativeFolder)) {
      throw new Error('内容目录必须位于项目目录内。');
    }
  }
  const target = path.join(resolvedFolder, `${slug}.md`);
  const template = await readFile(path.join(projectRoot, 'templates', collection.template), 'utf8');
  const content = template.replaceAll('{{DATE}}', date).replaceAll('{{YEAR}}', date.slice(0, 4)).replaceAll('{{WEEK}}', isoWeek(date)).replaceAll('{{SLUG}}', slug);
  try {
    await writeFile(target, content, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`文件已存在，未覆盖：${path.relative(root, target)}`);
    throw error;
  }
  return target;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('用法：pnpm new <digest|publication|note|project> <slug>\n示例：pnpm new digest diffusion-policy');
  } else {
    try {
      if (args.length !== 2) throw new Error('用法：pnpm new <digest|publication|note|project> <slug>');
      const filename = await createContent(args[0], args[1]);
      console.log(`已创建：${path.relative(projectRoot, filename)}\n请填写真实内容；完成后将 draft: true 改为 false，demo: true 改为 false。`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

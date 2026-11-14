import { readFile, realpath, stat, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encryptLovePayload } from '../src/lib/love-crypto.mjs';

/**
 * @typedef {{ title: string, text: string }} LoveNote
 * @typedef {{ title: string, paragraphs: string[], signature: string }} LoveLetter
 * @typedef {LoveLetter & { id: string, context: string, date?: string }} LoveContextLetter
 * @typedef {{ source: string, title: string, caption: string, category?: 'travel' | 'daily' }} LoveSourcePhoto
 * @typedef {Object} LoveSourceContent
 * @property {1} version
 * @property {string} boyName
 * @property {string} girlName
 * @property {string} nickname
 * @property {string} meetDate
 * @property {string} intro
 * @property {LoveNote[]} chapters
 * @property {LoveLetter} letter
 * @property {LoveSourcePhoto[]} photos
 * @property {{ source: string, title: string, lyrics?: string[] }} music
 * @property {string} [relationshipDate]
 * @property {number} [heroPhotoIndex]
 * @property {LoveNote[]} [loveNotes]
 * @property {LoveContextLetter[]} [letters]
 */

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
// Reuse Astro's installed optional image dependency, including strict pnpm layouts.
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const sharp = astroRequire('sharp');

function text(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`私有内容缺少有效字段：${field}`);
  }
  return value;
}

/** Resolve a source file without allowing parent traversal or symlink escapes. */
export async function resolveSourceFile(sourceDirectory, source) {
  if (typeof source !== 'string' || !source || path.isAbsolute(source)
    || path.win32.isAbsolute(source) || source.includes('\0')) {
    throw new Error('素材路径必须是来源目录内的相对路径。');
  }
  const parts = source.replaceAll('\\', '/').split('/');
  if (parts.some(part => !part || part === '..' || part === '.')) {
    throw new Error('素材路径不能包含空段、当前目录或父目录。');
  }
  const root = await realpath(sourceDirectory);
  const candidate = await realpath(path.resolve(root, ...parts));
  const relative = path.relative(root, candidate);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error('素材路径或符号链接指向了来源目录以外。');
  }
  if (!(await stat(candidate)).isFile()) throw new Error('素材路径必须指向文件。');
  return candidate;
}

/** Validate a calendar date without JavaScript's silent overflow normalization. */
export function calendarDate(value, field = 'date') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} 必须使用 YYYY-MM-DD 格式。`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} 必须是有效的日历日期。`);
  }
  return value;
}

function paragraphs(value, field) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${field} 必须包含至少一段正文。`);
  return value.map((paragraph, index) => text(paragraph, `${field}[${index}]`));
}

/**
 * Keep an explicit whitelist; private source paths never reach the public payload.
 * @returns {LoveSourceContent}
 */
export function validateLoveContent(content) {
  if (content?.version !== 1 || !Array.isArray(content.photos) || !content.photos.length) {
    throw new Error('私有内容必须使用 version: 1，并包含至少一张照片。');
  }
  if (!Array.isArray(content.chapters) || !content.chapters.length || !content.letter) {
    throw new Error('私有内容缺少故事章节或信件。');
  }
  const meetDate = text(content.meetDate, 'meetDate');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(meetDate)
    || !Number.isFinite(Date.parse(meetDate)) || Number(meetDate.slice(11, 13)) > 23) {
    throw new Error('meetDate 必须是包含时区的有效日期时间。');
  }
  calendarDate(meetDate.slice(0, 10), 'meetDate');
  /** @type {LoveSourceContent} */
  const result = {
    version: 1,
    boyName: text(content.boyName, 'boyName'),
    girlName: text(content.girlName, 'girlName'),
    nickname: text(content.nickname, 'nickname'),
    meetDate,
    intro: text(content.intro, 'intro'),
    chapters: content.chapters.map((chapter, index) => ({
      title: text(chapter.title, `chapters[${index}].title`),
      text: text(chapter.text, `chapters[${index}].text`),
    })),
    letter: {
      title: text(content.letter.title, 'letter.title'),
      paragraphs: paragraphs(content.letter.paragraphs, 'letter.paragraphs'),
      signature: text(content.letter.signature, 'letter.signature'),
    },
    photos: content.photos.map((photo, index) => {
      /** @type {LoveSourcePhoto} */
      const item = {
        source: text(photo.source, `photos[${index}].source`),
        title: text(photo.title, `photos[${index}].title`),
        caption: typeof photo.caption === 'string' ? photo.caption : '',
      };
      if (photo.category !== undefined) {
        if (!['travel', 'daily'].includes(photo.category)) {
          throw new Error(`photos[${index}].category 只能是 travel 或 daily。`);
        }
        item.category = photo.category;
      }
      return item;
    }),
    music: {
      source: text(content.music?.source, 'music.source'),
      title: text(content.music?.title, 'music.title'),
    },
  };
  if (content.relationshipDate !== undefined) {
    result.relationshipDate = calendarDate(content.relationshipDate, 'relationshipDate');
    if (result.relationshipDate < meetDate.slice(0, 10)) {
      throw new Error('relationshipDate 不能早于 meetDate。');
    }
  }
  if (content.heroPhotoIndex !== undefined) {
    if (!Number.isInteger(content.heroPhotoIndex) || content.heroPhotoIndex < 0
      || content.heroPhotoIndex >= result.photos.length) {
      throw new Error('heroPhotoIndex 必须指向相册中已有照片的有效索引。');
    }
    result.heroPhotoIndex = content.heroPhotoIndex;
  }
  if (content.music.lyrics !== undefined) {
    if (!Array.isArray(content.music.lyrics) || !content.music.lyrics.every(line => typeof line === 'string')) {
      throw new Error('music.lyrics 必须是字符串数组。');
    }
    // Empty strings preserve stanza breaks from the original lyrics.
    result.music.lyrics = [...content.music.lyrics];
  }
  if (content.loveNotes !== undefined) {
    if (!Array.isArray(content.loveNotes) || !content.loveNotes.length) throw new Error('loveNotes 不能为空。');
    result.loveNotes = content.loveNotes.map((note, index) => ({
      title: text(note.title, `loveNotes[${index}].title`),
      text: text(note.text, `loveNotes[${index}].text`),
    }));
  }
  if (content.letters !== undefined) {
    if (!Array.isArray(content.letters) || !content.letters.length) throw new Error('letters 不能为空。');
    const ids = new Set();
    result.letters = content.letters.map((letter, index) => {
      const id = text(letter.id, `letters[${index}].id`);
      if (!/^[a-z][a-z0-9-]*$/.test(id) || ids.has(id)) throw new Error('letters[].id 必须是唯一的英文短标识。');
      ids.add(id);
      /** @type {LoveContextLetter} */
      const item = {
        id,
        title: text(letter.title, `letters[${index}].title`),
        context: text(letter.context, `letters[${index}].context`),
        paragraphs: paragraphs(letter.paragraphs, `letters[${index}].paragraphs`),
        signature: text(letter.signature, `letters[${index}].signature`),
      };
      if (letter.date !== undefined) item.date = calendarDate(letter.date, `letters[${index}].date`);
      return item;
    });
  }
  return result;
}

/** Build private data in memory; never write unencrypted media to public/. */
export async function buildLovePayload(content, sourceDirectory) {
  const normalized = validateLoveContent(content);
  const photos = [];
  // Process sequentially to keep memory bounded for full-resolution phone photos.
  for (const photo of normalized.photos) {
    const filename = await resolveSourceFile(sourceDirectory, photo.source);
    const { data, info } = await sharp(filename)
      .rotate()
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    const { source: _source, ...metadata } = photo;
    photos.push({
      ...metadata,
      mime: 'image/webp', data: data.toString('base64'), width: info.width, height: info.height,
    });
  }
  const musicFile = await resolveSourceFile(sourceDirectory, normalized.music.source);
  if (path.extname(musicFile).toLowerCase() !== '.mp3') {
    throw new Error('音乐素材必须是 MP3 文件。');
  }
  const { source: _musicSource, ...music } = normalized.music;
  const payload = { ...normalized, photos, music };
  const song = { mime: 'audio/mpeg', data: (await readFile(musicFile)).toString('base64') };
  return { payload, song };
}

export async function readLovePassword(passwordFile = path.join(projectRoot, '.private/love/password.txt')) {
  if (process.env.LOVE_PASSWORD !== undefined) {
    if (!process.env.LOVE_PASSWORD.length) throw new Error('LOVE_PASSWORD 不能为空。');
    return process.env.LOVE_PASSWORD;
  }
  let password;
  try {
    // A text editor's final line ending is not part of the password; preserve other whitespace.
    password = (await readFile(passwordFile, 'utf8')).replace(/^\uFEFF/, '').replace(/\r?\n$/, '');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('请先设置 LOVE_PASSWORD 环境变量，或创建 .private/love/password.txt。');
    }
    throw error;
  }
  if (!password.length || /[\r\n]/.test(password)) throw new Error('密码文件应只包含一行非空密码。');
  return password;
}

export async function prepareLove({
  sourceDirectory = path.resolve(projectRoot, '../Love'),
  contentFile = path.join(projectRoot, '.private/love/content.json'),
  outputDirectory = path.join(projectRoot, 'public/love'),
  password,
} = {}) {
  const secret = password ?? await readLovePassword();
  const content = JSON.parse(await readFile(contentFile, 'utf8'));
  const { payload, song } = await buildLovePayload(content, sourceDirectory);
  // Finish both encryptions before replacing any published payload.
  const files = [
    ['vault.json', JSON.stringify(await encryptLovePayload(payload, secret))],
    ['song.json', JSON.stringify(await encryptLovePayload(song, secret))],
  ];
  await mkdir(outputDirectory, { recursive: true });
  const temporary = files.map(([name]) => path.join(outputDirectory, `.${name}.${process.pid}.tmp`));
  try {
    for (let index = 0; index < files.length; index++) {
      await writeFile(temporary[index], `${files[index][1]}\n`, { encoding: 'utf8', flag: 'wx' });
    }
    for (let index = 0; index < files.length; index++) {
      await rename(temporary[index], path.join(outputDirectory, files[index][0]));
    }
  } finally {
    for (const filename of temporary) await rm(filename, { force: true });
  }
  return { photoCount: payload.photos.length, files: files.map(([name, bytes]) => ({ name, bytes: Buffer.byteLength(bytes) + 1 })) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 0 && !(args.length === 2 && args[0] === '--source-dir' && args[1])) {
      throw new Error('用法：node scripts/prepare-love.mjs [--source-dir ../Love]');
    }
    const result = await prepareLove(args.length ? { sourceDirectory: path.resolve(args[1]) } : {});
    console.log(`已加密 ${result.photoCount} 张照片、故事和音乐。`);
    for (const file of result.files) console.log(`public/love/${file.name}：${(file.bytes / 1024 / 1024).toFixed(2)} MiB`);
  } catch (error) {
    // Do not echo the JSON parser's input excerpt, which may include private text.
    console.error(error instanceof SyntaxError ? '私有内容 JSON 格式无效，请检查 .private/love/content.json。' : error.message);
    process.exitCode = 1;
  }
}

import { readFile, realpath, stat, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encryptLovePayload } from '../src/lib/love-crypto.mjs';

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

/** Build private data in memory; never write unencrypted media to public/. */
export async function buildLovePayload(content, sourceDirectory) {
  if (content?.version !== 1 || !Array.isArray(content.photos) || !content.photos.length) {
    throw new Error('私有内容必须使用 version: 1，并包含至少一张照片。');
  }
  if (!Array.isArray(content.chapters) || !Array.isArray(content.letter?.paragraphs)) {
    throw new Error('私有内容缺少故事章节或信件段落。');
  }
  const meetDate = text(content.meetDate, 'meetDate');
  if (!Number.isFinite(Date.parse(meetDate)) || !/(Z|[+-]\d{2}:\d{2})$/.test(meetDate)) {
    throw new Error('meetDate 必须是包含时区的有效日期。');
  }
  const photos = [];
  // Process sequentially to keep memory bounded for full-resolution phone photos.
  for (const [index, photo] of content.photos.entries()) {
    const filename = await resolveSourceFile(sourceDirectory, photo.source);
    const { data, info } = await sharp(filename)
      .rotate()
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    photos.push({
      title: text(photo.title, `photos[${index}].title`),
      caption: typeof photo.caption === 'string' ? photo.caption : '',
      mime: 'image/webp', data: data.toString('base64'), width: info.width, height: info.height,
    });
  }
  const musicFile = await resolveSourceFile(sourceDirectory, content.music?.source);
  if (path.extname(musicFile).toLowerCase() !== '.mp3') {
    throw new Error('音乐素材必须是 MP3 文件。');
  }
  const payload = {
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
      paragraphs: content.letter.paragraphs.map((paragraph, index) => text(paragraph, `letter.paragraphs[${index}]`)),
      signature: text(content.letter.signature, 'letter.signature'),
    },
    photos,
    music: { title: text(content.music.title, 'music.title') },
  };
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

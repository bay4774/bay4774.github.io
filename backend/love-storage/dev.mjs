// Local QA only. Never imported by or copied into the hosted Worker bundle.
import http from 'node:http';
import { Readable } from 'node:stream';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, readdir, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import worker from './worker/index.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const entryKey = /^entries\/[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.json$/;

/** Retry transient Windows file locks without removing the existing record. */
export async function replacePreviewFile(temporary, destination, {
  renameFile = rename,
  pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
} = {}) {
  const retryDelays = [25, 50, 100, 200, 250, 250, 250, 250];
  for (let attempt = 0; ; attempt++) {
    try { await renameFile(temporary, destination); return; }
    catch (error) {
      if (!['EPERM', 'EACCES', 'EBUSY', 'EEXIST'].includes(error.code) || attempt >= retryDelays.length) throw error;
      await pause(retryDelays[attempt]);
    }
  }
}

export class PreviewBucket {
  constructor(directory, replaceFile = replacePreviewFile) { this.directory = directory; this.replaceFile = replaceFile; this.pending = Promise.resolve(); }
  filename(key) {
    if (!entryKey.test(key)) throw new Error('Invalid preview key.');
    return path.join(this.directory, path.basename(key));
  }
  async read(key) {
    try { return JSON.parse(await readFile(this.filename(key), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  meta(key, value) {
    return value ? { key, etag: value.etag, httpEtag: `"${value.etag}"`, uploaded: new Date(value.uploaded), customMetadata: { ...value.customMetadata } } : null;
  }
  async head(key) { return this.meta(key, await this.read(key)); }
  async get(key) {
    const value = await this.read(key);
    return value ? { ...this.meta(key, value), body: new Response(value.body).body } : null;
  }
  async put(key, body, options) {
    const operation = this.pending.then(async () => {
      const previous = await this.read(key);
      const priorTag = previous ? `"${previous.etag}"` : null;
      const none = options.onlyIf.get('If-None-Match');
      const match = options.onlyIf.get('If-Match');
      if (none === '*' && previous) return null;
      if (match && match !== priorTag) return null;
      const value = { body, etag: createHash('md5').update(body).digest('hex'), uploaded: new Date().toISOString(), customMetadata: options.customMetadata };
      await mkdir(this.directory, { recursive: true });
      const destination = this.filename(key);
      const temporary = `${destination}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(value), { flag: 'wx' });
      try {
        // Keep all retry attempts inside this bucket's write queue. The
        // condition is rechecked only by the next queued operation, after the
        // current rename has either succeeded atomically or definitively failed.
        await this.replaceFile(temporary, destination);
      } catch (error) {
        await rm(temporary, { force: true, maxRetries: 3, retryDelay: 100 }).catch(() => {});
        throw error;
      }
      return this.meta(key, value);
    });
    this.pending = operation.then(() => undefined, () => undefined);
    return operation;
  }
  async list({ prefix, limit, cursor }) {
    await mkdir(this.directory, { recursive: true });
    const keys = (await readdir(this.directory)).map(name => `entries/${name}`).filter(key => entryKey.test(key) && key.startsWith(prefix)).sort();
    // Local cursor is the final key, so insertions do not shift a numeric offset.
    const remaining = cursor ? keys.filter(key => key > cursor) : keys;
    const selected = remaining.slice(0, limit);
    const objects = (await Promise.all(selected.map(key => this.head(key)))).filter(Boolean);
    const truncated = remaining.length > selected.length;
    return { objects, truncated, ...(truncated ? { cursor: selected.at(-1) } : {}) };
  }
}

export async function startPreview() {
  const content = JSON.parse(await readFile(path.join(root, '.private/love/content.json'), 'utf8'));
  if (!/^[a-f0-9]{64}$/.test(content.cloud?.token || '')) throw new Error('Configure the private cloud token before starting the preview.');
  const directory = path.resolve(process.env.LOVE_PREVIEW_DIRECTORY || path.join(root, '.qa/love-cloud-preview'));
  const port = Number(process.env.LOVE_PREVIEW_PORT || 4325);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port.');
  const env = {
    BUCKET: new PreviewBucket(directory),
    LOVE_TOKEN_SHA256: createHash('sha256').update(content.cloud.token).digest('hex'),
    ALLOWED_ORIGINS: 'http://127.0.0.1:4323',
  };
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      // The actual service listens on loopback HTTP; the production handler still
      // receives an HTTPS request, exactly as it would behind the hosted edge.
      const request = new Request(new URL(incoming.url, `https://127.0.0.1:${port}`), {
        method: incoming.method,
        headers,
        ...(['GET', 'HEAD'].includes(incoming.method) ? {} : { body: Readable.toWeb(incoming), duplex: 'half' }),
      });
      const response = await worker.fetch(request, env);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).pipe(outgoing);
      else outgoing.end();
    } catch {
      if (!outgoing.headersSent) outgoing.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      outgoing.end('{"error":"preview_unavailable"}');
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  console.log(`Love storage preview: http://127.0.0.1:${port}`);
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startPreview().catch(() => { console.error('Unable to start the local storage preview. Check private configuration and the local port.'); process.exitCode = 1; });
}

/** Ciphertext-only shared storage. No password, photo or diary is decrypted here. */
export const MAX_BODY_BYTES = 6 * 1024 * 1024;
const encoder = new TextEncoder();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES = new Set(['photo', 'diary', 'anniversary']);
const ALLOWED_HEADERS = new Set(['authorization', 'content-type', 'if-match', 'if-none-match']);
const ENVELOPE_KEYS = ['cipher', 'ciphertext', 'iterations', 'iv', 'kdf', 'salt', 'version'];

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function allowedOrigins(env) {
  const origins = new Set(['https://bay4774.github.io']);
  if (typeof env.ALLOWED_ORIGINS !== 'string') return origins;
  for (const value of env.ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)) {
    try {
      const url = new URL(value);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if (url.origin === value && !url.username && !url.password
        && (url.protocol === 'https:' || (local && url.protocol === 'http:'))) origins.add(value);
    } catch { /* An invalid deployment setting does not widen access. */ }
  }
  return origins;
}

function responseHeaders(origin) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    Vary: 'Origin',
  });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Expose-Headers', 'ETag');
  }
  return headers;
}

function json(value, status, origin, extraHeaders) {
  const headers = responseHeaders(origin);
  if (extraHeaders) for (const [key, value] of Object.entries(extraHeaders)) headers.set(key, value);
  return new Response(JSON.stringify(value), { status, headers });
}

async function authorize(request, env) {
  if (!env.BUCKET || typeof env.LOVE_TOKEN_SHA256 !== 'string' || !/^[a-f0-9]{64}$/i.test(env.LOVE_TOKEN_SHA256)) {
    throw new HttpError(503, 'storage_not_configured');
  }
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.get('Authorization') || '');
  if (!match) throw new HttpError(401, 'unauthorized');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(match[1]));
  const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const expected = env.LOVE_TOKEN_SHA256.toLowerCase();
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  if (difference !== 0) throw new HttpError(401, 'unauthorized');
}

function base64Length(value) {
  if (typeof value !== 'string' || !value.length || value.length % 4 || /[^A-Za-z0-9+/=]/.test(value)) {
    throw new HttpError(400, 'invalid_envelope');
  }
  try {
    const binary = atob(value);
    if (btoa(binary) !== value) throw new Error();
    return binary.length;
  } catch { throw new HttpError(400, 'invalid_envelope'); }
}

function validateEnvelope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== ENVELOPE_KEYS.join(',')
    || value.version !== 1 || value.kdf !== 'PBKDF2-SHA256'
    || value.iterations !== 600000 || value.cipher !== 'AES-GCM') {
    throw new HttpError(400, 'invalid_envelope');
  }
  if (base64Length(value.salt) !== 16 || base64Length(value.iv) !== 12 || base64Length(value.ciphertext) < 17) {
    throw new HttpError(400, 'invalid_envelope');
  }
  return value;
}

async function readEnvelope(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) {
    throw new HttpError(400, 'json_required');
  }
  const length = request.headers.get('Content-Length');
  if (length && /^\d+$/.test(length) && Number(length) > MAX_BODY_BYTES) throw new HttpError(413, 'body_too_large');
  if (!request.body) throw new HttpError(400, 'invalid_envelope');
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        throw new HttpError(413, 'body_too_large');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return validateEnvelope(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))); }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'invalid_envelope');
  }
}

function strongEtag(input) {
  if (!input) return null;
  const value = input.startsWith('"') && input.endsWith('"') ? input.slice(1, -1) : input;
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value)) throw new HttpError(400, 'invalid_precondition');
  return `"${value}"`;
}

function recordInfo(object, id) {
  return {
    id,
    type: object.customMetadata.type,
    etag: object.httpEtag,
    createdAt: object.customMetadata.createdAt,
  };
}

async function listEntries(url, env, origin) {
  if ([...url.searchParams.keys()].some(key => key !== 'cursor') || url.searchParams.getAll('cursor').length > 1) {
    throw new HttpError(400, 'invalid_query');
  }
  const cursor = url.searchParams.get('cursor') || undefined;
  if (cursor && cursor.length > 2048) throw new HttpError(400, 'invalid_cursor');
  const listed = await env.BUCKET.list({ prefix: 'entries/', limit: 100, include: ['customMetadata'], ...(cursor ? { cursor } : {}) });
  const items = [];
  for (const object of listed.objects) {
    const id = object.key.slice('entries/'.length, -'.json'.length);
    if (object.key === `entries/${id}.json` && UUID.test(id) && TYPES.has(object.customMetadata?.type)
      && typeof object.customMetadata?.createdAt === 'string') items.push(recordInfo(object, id));
  }
  return json({ items, cursor: listed.truncated ? listed.cursor : null }, 200, origin);
}

async function putEntry(request, url, id, env, origin) {
  if ([...url.searchParams.keys()].some(key => key !== 'type') || url.searchParams.getAll('type').length !== 1) {
    throw new HttpError(400, 'invalid_type');
  }
  const type = url.searchParams.get('type');
  if (!TYPES.has(type)) throw new HttpError(400, 'invalid_type');
  const none = request.headers.get('If-None-Match');
  const match = request.headers.get('If-Match');
  if (none && match) throw new HttpError(400, 'invalid_precondition');
  if (!none && !match) throw new HttpError(428, 'precondition_required');
  if (none && none !== '*') throw new HttpError(400, 'invalid_precondition');
  const etag = strongEtag(match);
  const key = `entries/${id}.json`;
  let createdAt = new Date().toISOString();
  if (etag) {
    const prior = await env.BUCKET.head(key);
    if (!prior) throw new HttpError(404, 'not_found');
    if (prior.customMetadata?.type !== type) throw new HttpError(409, 'type_conflict');
    if (prior.httpEtag !== etag) throw new HttpError(409, 'version_conflict');
    createdAt = prior.customMetadata.createdAt;
  }
  const envelope = await readEnvelope(request);
  const condition = new Headers(etag ? { 'If-Match': etag } : { 'If-None-Match': '*' });
  const object = await env.BUCKET.put(key, JSON.stringify(envelope), {
    onlyIf: condition,
    httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'no-store' },
    customMetadata: { type, createdAt },
  });
  if (!object) throw new HttpError(409, 'version_conflict');
  return json(recordInfo(object, id), etag ? 200 : 201, origin, { ETag: object.httpEtag });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const requestedOrigin = request.headers.get('Origin');
  const origin = requestedOrigin && allowedOrigins(env).has(requestedOrigin) ? requestedOrigin : null;
  try {
    if (url.protocol !== 'https:') throw new HttpError(400, 'https_required');
    if (requestedOrigin && !origin) throw new HttpError(403, 'origin_not_allowed');
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true }, 200, origin);
    if (request.method === 'GET' && url.pathname === '/') {
      const headers = responseHeaders(origin); headers.set('Content-Type', 'text/html; charset=utf-8');
      return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>纪念册云端存储</title><h1>纪念册云端存储</h1><p>这里为纪念册保存加密记录。请回到纪念册，输入密码后查看和更新。</p><p><a href="https://bay4774.github.io/love/">打开恋爱纪念册</a></p></html>', { headers });
    }
    if (!url.pathname.startsWith('/api/')) throw new HttpError(404, 'not_found');
    if (request.method === 'OPTIONS') {
      const method = request.headers.get('Access-Control-Request-Method');
      const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
      if (!origin || !['GET', 'PUT'].includes(method) || requestedHeaders.some(name => !ALLOWED_HEADERS.has(name))) {
        throw new HttpError(403, 'preflight_not_allowed');
      }
      const headers = responseHeaders(origin);
      headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-Match, If-None-Match');
      headers.set('Access-Control-Max-Age', '600');
      return new Response(null, { status: 204, headers });
    }
    await authorize(request, env);
    if (request.method === 'GET' && url.pathname === '/api/entries') return await listEntries(url, env, origin);
    const route = /^\/api\/entries\/([^/]+)$/.exec(url.pathname);
    if (!route || !UUID.test(route[1])) throw new HttpError(400, 'invalid_id');
    const id = route[1].toLowerCase();
    if (request.method === 'PUT') return await putEntry(request, url, id, env, origin);
    if (request.method === 'GET') {
      if (url.search) throw new HttpError(400, 'invalid_query');
      const object = await env.BUCKET.get(`entries/${id}.json`);
      if (!object) throw new HttpError(404, 'not_found');
      const headers = responseHeaders(origin); headers.set('ETag', object.httpEtag);
      return new Response(object.body, { headers });
    }
    return json({ error: 'method_not_allowed' }, 405, origin, { Allow: 'GET, PUT, OPTIONS' });
  } catch (error) {
    // Storage/parser errors may contain data or credentials. Only fixed codes leave the Worker.
    return json({ error: error instanceof HttpError ? error.code : 'storage_unavailable' }, error instanceof HttpError ? error.status : 503, origin);
  }
}

export default { fetch: handle };

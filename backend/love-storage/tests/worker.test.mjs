import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import worker, { MAX_BODY_BYTES } from '../worker/index.js';

const token = 'a'.repeat(64);
const tokenHash = createHash('sha256').update(token).digest('hex');
const origin = 'https://bay4774.github.io';
const id = '10000000-0000-4000-8000-000000000001';
const itemPath = `/api/entries/${id}`;
const b64 = size => Buffer.alloc(size, 1).toString('base64');
const envelope = () => ({ version: 1, kdf: 'PBKDF2-SHA256', iterations: 600000, cipher: 'AES-GCM', salt: b64(16), iv: b64(12), ciphertext: b64(40) });

class MemoryBucket {
  constructor() { this.records = new Map(); this.calls = []; this.beforePut = null; }
  metadata(key) {
    const record = this.records.get(key);
    if (!record) return null;
    return { key, etag: record.etag, httpEtag: `"${record.etag}"`, uploaded: new Date(record.createdAt), customMetadata: { ...record.customMetadata } };
  }
  seed(key, body, customMetadata) {
    this.records.set(key, { body, customMetadata: { ...customMetadata }, etag: createHash('md5').update(body).digest('hex'), createdAt: new Date().toISOString() });
    return this.metadata(key);
  }
  async head(key) { this.calls.push(['head', key]); return this.metadata(key); }
  async get(key) {
    this.calls.push(['get', key]);
    const meta = this.metadata(key);
    return meta ? { ...meta, body: new Response(this.records.get(key).body).body } : null;
  }
  async put(key, body, options) {
    this.calls.push(['put', key, options]);
    if (this.beforePut) { const change = this.beforePut; this.beforePut = null; change(); }
    const current = this.metadata(key);
    const none = options.onlyIf.get('If-None-Match');
    const match = options.onlyIf.get('If-Match');
    if (none === '*' && current) return null;
    if (match && (!current || current.httpEtag !== match)) return null;
    return this.seed(key, body, options.customMetadata);
  }
  async list(options) {
    this.calls.push(['list', options]);
    const keys = [...this.records.keys()].filter(key => key.startsWith(options.prefix)).sort();
    const start = Number(options.cursor || 0);
    const selected = keys.slice(start, start + options.limit);
    const truncated = start + selected.length < keys.length;
    return { objects: selected.map(key => this.metadata(key)), truncated, ...(truncated ? { cursor: String(start + selected.length) } : {}) };
  }
}

function setup() { const bucket = new MemoryBucket(); return { bucket, env: { BUCKET: bucket, LOVE_TOKEN_SHA256: tokenHash } }; }
function request(path = '/api/entries', options = {}) {
  const headers = new Headers({ Authorization: `Bearer ${token}`, Origin: origin, ...options.headers });
  return new Request(`https://storage.example${path}`, { ...options, headers });
}
function put(body = envelope(), options = {}) {
  return request(`${itemPath}?type=diary`, { method: 'PUT', body: JSON.stringify(body), ...options, headers: { 'Content-Type': 'application/json', 'If-None-Match': '*', ...options.headers } });
}
async function created(env, body = envelope()) {
  const response = await worker.fetch(put(body), env);
  assert.equal(response.status, 201);
  return response.json();
}

test('authentication denies reads and writes before touching storage', async () => {
  for (const authorization of ['', `Bearer ${'b'.repeat(64)}`, 'Basic ignored']) {
    const { env, bucket } = setup();
    const response = await worker.fetch(put(envelope(), { headers: { Authorization: authorization } }), env);
    assert.equal(response.status, 401);
    assert.deepEqual(bucket.calls, []);
    assert.deepEqual(await response.json(), { error: 'unauthorized' });
  }
});

test('missing runtime secret or binding fails closed', async () => {
  for (const env of [{}, { BUCKET: new MemoryBucket() }, { BUCKET: new MemoryBucket(), LOVE_TOKEN_SHA256: '*' }, { LOVE_TOKEN_SHA256: tokenHash }]) {
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'storage_not_configured' });
  }
});

test('CORS permits exact configured origins and rejects unknown origins', async () => {
  const { env, bucket } = setup();
  const blocked = await worker.fetch(request('/api/entries', { headers: { Origin: 'https://bay4774.github.io.attacker.example' } }), env);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get('Access-Control-Allow-Origin'), null);
  assert.deepEqual(bucket.calls, []);
  const permitted = await worker.fetch(request(), env);
  assert.equal(permitted.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(permitted.headers.get('Access-Control-Expose-Headers'), 'ETag, X-Entry-ETag, X-Entry-Created-At');
  assert.equal(permitted.headers.get('Cache-Control'), 'no-store, no-transform');
  assert.equal(permitted.headers.get('Vary'), 'Origin');
  env.ALLOWED_ORIGINS = 'http://localhost:4324, https://preview.example, *, https://bad.example/path';
  assert.equal((await worker.fetch(request('/api/entries', { headers: { Origin: 'http://localhost:4324' } }), env)).status, 200);
  assert.equal((await worker.fetch(request('/api/entries', { headers: { Origin: 'https://bad.example' } }), env)).status, 403);
});

test('preflight has no token requirement but enforces origin, method and headers', async () => {
  const { env, bucket } = setup();
  const base = { Authorization: '', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization, content-type, if-match, if-none-match' };
  const response = await worker.fetch(request(itemPath, { method: 'OPTIONS', headers: base }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, PUT, OPTIONS');
  assert.deepEqual(bucket.calls, []);
  for (const headers of [{ ...base, 'Access-Control-Request-Method': 'DELETE' }, { ...base, 'Access-Control-Request-Headers': 'x-private-header' }, { ...base, Origin: 'null' }]) {
    assert.equal((await worker.fetch(request(itemPath, { method: 'OPTIONS', headers }), env)).status, 403);
  }
});

test('authorized requests without Origin work, while HTTP is rejected', async () => {
  const { env } = setup();
  const direct = new Request('https://storage.example/api/entries', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await worker.fetch(direct, env)).status, 200);
  const insecure = new Request('http://storage.example/api/entries', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await worker.fetch(insecure, env)).status, 400);
});

test('invalid IDs, immutable types and missing preconditions cannot create records', async () => {
  const { env, bucket } = setup();
  for (const badId of ['invalid', '10000000-0000-0000-0000-000000000001', '%2e%2e', `${id}.json`]) {
    const response = await worker.fetch(request(`/api/entries/${badId}?type=diary`, { method: 'PUT' }), env);
    assert.equal(response.status, 400);
  }
  for (const suffix of ['?type=secret', '?type=diary&type=photo', '?type=diary&source=private', '']) {
    assert.equal((await worker.fetch(request(`${itemPath}${suffix}`, { method: 'PUT' }), env)).status, 400);
  }
  assert.equal((await worker.fetch(put(envelope(), { headers: { 'If-None-Match': '' } }), env)).status, 428);
  assert.equal((await worker.fetch(put(envelope(), { headers: { 'If-Match': 'etag' } }), env)).status, 400);
  assert.equal(bucket.records.size, 0);
});

test('all three record types round-trip only encrypted fields and metadata', async () => {
  for (const type of ['photo', 'diary', 'anniversary']) {
    const { env, bucket } = setup();
    const payload = envelope();
    const createResponse = await worker.fetch(request(`${itemPath}?type=${type}`, { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json; charset=utf-8', 'If-None-Match': '*' } }), env);
    assert.equal(createResponse.status, 201);
    const info = await createResponse.json();
    assert.equal(info.id, id);
    assert.equal(info.type, type);
    assert.match(info.etag, /^"[a-f0-9]{32}"$/);
    assert.ok(Number.isFinite(Date.parse(info.createdAt)));
    assert.equal(createResponse.headers.get('ETag'), info.etag);
    assert.equal(createResponse.headers.get('X-Entry-ETag'), info.etag);
    assert.equal(createResponse.headers.get('X-Entry-Created-At'), info.createdAt);
    const getResponse = await worker.fetch(request(itemPath), env);
    assert.deepEqual(await getResponse.json(), payload);
    assert.equal(getResponse.headers.get('ETag'), info.etag);
    assert.equal(getResponse.headers.get('X-Entry-ETag'), info.etag);
    assert.equal(getResponse.headers.get('X-Entry-Created-At'), info.createdAt);
    const listResponse = await worker.fetch(request(), env);
    assert.deepEqual(await listResponse.json(), { items: [info], cursor: null });
    assert.equal(bucket.calls.find(call => call[0] === 'put')[2].onlyIf.get('If-None-Match'), '*');
    assert.deepEqual(bucket.calls.find(call => call[0] === 'list')[1].include, ['customMetadata']);
  }
});

test('extra private fields, corrupt encodings and wrong crypto parameters are rejected', async () => {
  const invalid = [
    { ...envelope(), title: 'PRIVATE_SAMPLE' }, { ...envelope(), iterations: 1 },
    { ...envelope(), version: 2 }, { ...envelope(), kdf: 'other' }, { ...envelope(), cipher: 'AES-CBC' },
    { ...envelope(), salt: b64(15) }, { ...envelope(), iv: b64(13) }, { ...envelope(), ciphertext: b64(16) },
    { ...envelope(), ciphertext: 'a===' }, { ...envelope(), ciphertext: 'AA=A' }, { ...envelope(), ciphertext: 'AQJ=' },
    { ...envelope(), salt: 'not base64' }, [], null,
  ];
  for (const value of invalid) {
    const { env, bucket } = setup();
    const response = await worker.fetch(put(value), env);
    assert.equal(response.status, 400);
    assert.equal(bucket.records.size, 0);
    assert.equal((await response.text()).includes('PRIVATE_SAMPLE'), false);
  }
});

test('invalid JSON, invalid UTF-8 and incorrect Content-Type have fixed errors', async () => {
  const { env } = setup();
  for (const body of ['{"PRIVATE_SAMPLE":', new Uint8Array([0xff, 0xfe])]) {
    const response = await worker.fetch(put(envelope(), { body }), env);
    assert.equal(response.status, 400);
    assert.equal(await response.text(), '{"error":"invalid_envelope"}');
  }
  assert.equal((await worker.fetch(put(envelope(), { headers: { 'Content-Type': 'text/plain' } }), env)).status, 400);
});

test('actual streamed bytes enforce the body limit regardless of Content-Length', async () => {
  for (const contentLength of [undefined, '1', String(MAX_BODY_BYTES + 1)]) {
    const { env, bucket } = setup();
    let canceled = false;
    let sent = false;
    const body = new ReadableStream({
      pull(controller) {
        if (sent) return;
        sent = true;
        controller.enqueue(new Uint8Array(MAX_BODY_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() { canceled = true; },
    });
    const response = await worker.fetch(put(envelope(), { body, duplex: 'half', headers: contentLength ? { 'Content-Length': contentLength } : {} }), env);
    assert.equal(response.status, 413);
    assert.equal(bucket.records.size, 0);
    if (!contentLength || contentLength === '1') assert.equal(canceled, true);
  }
});

test('create retries conflict and cannot overwrite an existing object', async () => {
  const { env, bucket } = setup();
  await created(env);
  const original = bucket.records.get(`entries/${id}.json`).body;
  const changed = { ...envelope(), ciphertext: b64(41) };
  assert.equal((await worker.fetch(put(changed), env)).status, 409);
  assert.equal(bucket.records.get(`entries/${id}.json`).body, original);
});

test('update preserves the original creation time and supports strong ETag round-trips', async () => {
  const { env } = setup();
  const original = await created(env);
  const changed = { ...envelope(), ciphertext: b64(41) };
  const response = await worker.fetch(put(changed, { headers: { 'If-None-Match': '', 'If-Match': original.etag } }), env);
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.equal(updated.createdAt, original.createdAt);
  assert.notEqual(updated.etag, original.etag);
  assert.equal((await worker.fetch(put(envelope(), { headers: { 'If-None-Match': '', 'If-Match': original.etag } }), env)).status, 409);
  const rawTag = updated.etag.slice(1, -1);
  assert.equal((await worker.fetch(put(envelope(), { headers: { 'If-None-Match': '', 'If-Match': rawTag } }), env)).status, 200);
});

test('atomic R2 condition rejects a competing update after the metadata read', async () => {
  const { env, bucket } = setup();
  const original = await created(env);
  const concurrent = JSON.stringify({ ...envelope(), ciphertext: b64(42) });
  bucket.beforePut = () => bucket.seed(`entries/${id}.json`, concurrent, { type: 'diary', createdAt: original.createdAt });
  const response = await worker.fetch(put({ ...envelope(), ciphertext: b64(43) }, { headers: { 'If-None-Match': '', 'If-Match': original.etag } }), env);
  assert.equal(response.status, 409);
  assert.equal(bucket.records.get(`entries/${id}.json`).body, concurrent);
});

test('changing type or updating a missing entry is refused', async () => {
  const { env } = setup();
  const missing = await worker.fetch(put(envelope(), { headers: { 'If-None-Match': '', 'If-Match': 'missing' } }), env);
  assert.equal(missing.status, 404);
  const original = await created(env);
  const crossType = await worker.fetch(request(`${itemPath}?type=photo`, { method: 'PUT', body: JSON.stringify(envelope()), headers: { 'Content-Type': 'application/json', 'If-Match': original.etag } }), env);
  assert.equal(crossType.status, 409);
  assert.equal((await worker.fetch(request('/api/entries/10000000-0000-4000-8000-000000000002'), env)).status, 404);
});

test('listing pages use opaque cursors and never expose ciphertext', async () => {
  const { env, bucket } = setup();
  for (let index = 0; index < 101; index++) {
    const entryId = `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
    bucket.seed(`entries/${entryId}.json`, 'PRIVATE_CIPHERTEXT', { type: 'diary', createdAt: '2020-01-01T00:00:00.000Z' });
  }
  bucket.seed('other/private.json', 'PRIVATE_CIPHERTEXT', { type: 'diary', createdAt: '2020-01-01T00:00:00.000Z' });
  const first = await worker.fetch(request(), env);
  const firstText = await first.text();
  assert.equal(firstText.includes('PRIVATE_CIPHERTEXT'), false);
  const page = JSON.parse(firstText);
  assert.equal(page.items.length, 100);
  assert.equal(page.cursor, '100');
  const second = await (await worker.fetch(request(`/api/entries?cursor=${page.cursor}`), env)).json();
  assert.equal(second.items.length, 1);
  assert.equal(second.cursor, null);
  assert.equal((await worker.fetch(request(`/api/entries?cursor=${'a'.repeat(2049)}`), env)).status, 400);
});

test('health is content-free and internal storage errors are never echoed', async () => {
  const health = await worker.fetch(new Request('https://storage.example/health'), {});
  assert.deepEqual(await health.json(), { ok: true });
  const { env, bucket } = setup();
  bucket.list = async () => { throw new Error('PRIVATE_CONTENT_AND_TOKEN'); };
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 503);
  assert.equal(await response.text(), '{"error":"storage_unavailable"}');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import worker from '../backend/love-storage/worker/index.js';

// Compile the actual browser module for Node. Only the CSS side-effect import is
// removed; relative JS imports retain the production implementations.
const entryUrl = new URL('../src/scripts/love-editor.ts', import.meta.url);
const source = (await readFile(entryUrl, 'utf8'))
  .replace(/^import ['"]\.\.\/styles\/love-editor\.css['"];\r?\n/m, '')
  .replace(/from (['"])(\.\.\/lib\/[^'"]+)\1/g, (_whole, _quote, relative) => `from ${JSON.stringify(new URL(relative, entryUrl).href)}`);
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { readEntryMetadata } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const id = '10000000-0000-4000-8000-000000000001';
const createdAt = '2020-01-01T00:00:00.000Z';
const meta = { id, type: 'diary', etag: '"old-version"', createdAt };

test('custom version and creation headers survive a CDN-weakened ETag', () => {
  const response = new Response(null, { headers: { ETag: 'W/"proxy-version"', 'X-Entry-ETag': '"stored-version"', 'X-Entry-Created-At': createdAt } });
  const result = readEntryMetadata(response, { ...meta, etag: 'pending', createdAt: '2020-01-02T00:00:00.000Z' });
  assert.equal(result.etag, '"stored-version"');
  assert.equal(result.createdAt, createdAt);
});

test('legacy strong, weak and absent response headers remain usable', () => {
  for (const incoming of ['"stored-version"', 'W/"stored-version"', 'stored-version']) {
    assert.equal(readEntryMetadata(new Response(null, { headers: { ETag: incoming } }), meta).etag, '"stored-version"');
  }
  assert.deepEqual(readEntryMetadata(new Response(null), meta), meta);
  assert.deepEqual(readEntryMetadata(new Response(null, { headers: { ETag: 'W/"malformed", "multiple"', 'X-Entry-Created-At': 'invalid-date' } }), meta), meta);
});

test('a read transformed by the CDN can still update using the exact stored version', async () => {
  const token = 'a'.repeat(64);
  const payload = value => ({ version: 1, kdf: 'PBKDF2-SHA256', iterations: 600000, cipher: 'AES-GCM', salt: Buffer.alloc(16).toString('base64'), iv: Buffer.alloc(12).toString('base64'), ciphertext: Buffer.alloc(40, value).toString('base64') });
  let stored;
  const info = () => stored && ({ httpEtag: `"${stored.etag}"`, customMetadata: stored.customMetadata });
  const env = {
    LOVE_TOKEN_SHA256: createHash('sha256').update(token).digest('hex'),
    BUCKET: {
      async head() { return info(); },
      async get() { return stored ? { ...info(), body: new Response(stored.body).body } : null; },
      async put(_key, body, options) {
        const prior = info();
        if (options.onlyIf.get('If-None-Match') === '*' && prior) return null;
        if (options.onlyIf.has('If-Match') && options.onlyIf.get('If-Match') !== prior?.httpEtag) return null;
        stored = { body, etag: createHash('md5').update(body).digest('hex'), customMetadata: options.customMetadata };
        return info();
      },
    },
  };
  const request = (method, body, condition) => new Request(`https://storage.example/api/entries/${id}${method === 'PUT' ? '?type=diary' : ''}`, { method, ...(body ? { body: JSON.stringify(body) } : {}), headers: { Origin: 'https://bay4774.github.io', Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...condition } });
  const initial = await worker.fetch(request('PUT', payload(1), { 'If-None-Match': '*' }), env);
  assert.equal(initial.status, 201);
  const original = await initial.json();
  const retrieved = await worker.fetch(request('GET'), env);
  assert.equal(retrieved.status, 200);
  const transformed = new Headers(retrieved.headers);
  transformed.set('ETag', `W/${original.etag}`);
  const recovered = readEntryMetadata({ headers: transformed }, { ...original, etag: 'pending', createdAt: '2020-01-02T00:00:00.000Z' });
  assert.equal(recovered.etag, original.etag);
  assert.equal(recovered.createdAt, original.createdAt);
  const updated = await worker.fetch(request('PUT', payload(2), { 'If-Match': recovered.etag }), env);
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).createdAt, original.createdAt);
  // The previous stored version still cannot overwrite the newer record.
  assert.equal((await worker.fetch(request('PUT', payload(3), { 'If-Match': recovered.etag }), env)).status, 409);
});

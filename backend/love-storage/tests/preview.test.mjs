import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PreviewBucket } from '../dev.mjs';

test('preview storage persists ciphertext and atomically rejects duplicate creates and stale updates', async () => {
  const base = fileURLToPath(new URL('../.test-data/', import.meta.url));
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, 'bucket-'));
  try {
    const bucket = new PreviewBucket(directory);
    const key = 'entries/10000000-0000-4000-8000-000000000001.json';
    const options = { onlyIf: new Headers({ 'If-None-Match': '*' }), customMetadata: { type: 'diary', createdAt: '2020-01-01T00:00:00.000Z' } };
    const competing = await Promise.all([bucket.put(key, 'ciphertext-a', options), bucket.put(key, 'ciphertext-b', options)]);
    assert.equal(competing.filter(Boolean).length, 1);
    const original = competing.find(Boolean);
    const restarted = new PreviewBucket(directory);
    assert.equal((await restarted.head(key)).httpEtag, original.httpEtag);
    const update = { ...options, onlyIf: new Headers({ 'If-Match': original.httpEtag }) };
    const revised = await Promise.all([bucket.put(key, 'ciphertext-c', update), bucket.put(key, 'ciphertext-d', update)]);
    assert.equal(revised.filter(Boolean).length, 1);
    const response = await restarted.get(key);
    assert.equal(await new Response(response.body).text(), 'ciphertext-c');
    const listing = await restarted.list({ prefix: 'entries/', limit: 100 });
    assert.equal(listing.objects.length, 1);
    assert.equal(listing.truncated, false);
    await assert.rejects(bucket.head('../escape.json'));
  } finally {
    assert.ok(path.resolve(directory).startsWith(`${path.resolve(base)}${path.sep}`));
    await rm(directory, { recursive: true, force: true });
  }
});

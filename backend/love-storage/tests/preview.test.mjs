import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, rename, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PreviewBucket, replacePreviewFile } from '../dev.mjs';

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
    await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});

test('transient replacement locks retain the original file and the conditional-write queue', async () => {
  const base = fileURLToPath(new URL('../.test-data/', import.meta.url));
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, 'retry-'));
  try {
    const key = 'entries/10000000-0000-4000-8000-000000000001.json';
    const originalBucket = new PreviewBucket(directory);
    const original = await originalBucket.put(key, 'original', { onlyIf: new Headers({ 'If-None-Match': '*' }), customMetadata: { type: 'diary', createdAt: '2020-01-01T00:00:00.000Z' } });
    let announceRetry, releaseRetry;
    const retryStarted = new Promise(resolve => { announceRetry = resolve; });
    const resume = new Promise(resolve => { releaseRetry = resolve; });
    let attempts = 0;
    const bucket = new PreviewBucket(directory, (temporary, destination) => replacePreviewFile(temporary, destination, {
      renameFile: async (source, target) => {
        if (++attempts === 1) throw Object.assign(new Error('Simulated Windows sharing violation.'), { code: 'EPERM' });
        return rename(source, target);
      },
      pause: async () => { announceRetry(); await resume; },
    }));
    const condition = { onlyIf: new Headers({ 'If-Match': original.httpEtag }), customMetadata: { ...original.customMetadata } };
    const first = bucket.put(key, 'replacement', condition);
    const competing = bucket.put(key, 'stale-overwrite', condition);
    await retryStarted;
    assert.equal(await new Response((await originalBucket.get(key)).body).text(), 'original');
    releaseRetry();
    assert.ok(await first);
    assert.equal(await competing, null);
    assert.equal(attempts, 2);
    assert.equal(await new Response((await originalBucket.get(key)).body).text(), 'replacement');
    assert.equal((await readdir(directory)).some(filename => filename.endsWith('.tmp')), false);
  } finally {
    assert.ok(path.resolve(directory).startsWith(`${path.resolve(base)}${path.sep}`));
    await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});

test('replacement retries are finite and do not retry unrelated filesystem failures', async () => {
  const delays = []; let attempts = 0;
  await assert.rejects(replacePreviewFile('temporary', 'destination', {
    renameFile: async () => { attempts++; throw Object.assign(new Error('Locked.'), { code: 'EPERM' }); },
    pause: async delay => { delays.push(delay); },
  }), { code: 'EPERM' });
  assert.equal(attempts, 9);
  assert.deepEqual(delays, [25, 50, 100, 200, 250, 250, 250, 250]);
  attempts = 0;
  await assert.rejects(replacePreviewFile('temporary', 'destination', {
    renameFile: async () => { attempts++; throw Object.assign(new Error('Disk full.'), { code: 'ENOSPC' }); },
    pause: async () => { assert.fail('A non-transient error must not be retried.'); },
  }), { code: 'ENOSPC' });
  assert.equal(attempts, 1);
});

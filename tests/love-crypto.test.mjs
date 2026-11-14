import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptLovePayload, decryptLovePayload } from '../src/lib/love-crypto.mjs';

const password = 'Test-only / 我们的纪念 🕊️';
const privateText = 'LOVE_CRYPTO_TEST_CANARY_一起走过的日子';
const payload = { title: privateText, photos: ['data:image/png;base64,AAAA'], dates: [null, 0, true] };
let encrypted;

test('love content survives JSON transport and Unicode password encryption', async () => {
  encrypted = await encryptLovePayload(payload, password);
  const serialized = JSON.stringify(encrypted);
  assert.equal(serialized.includes(privateText), false);
  assert.equal(serialized.includes(password), false);
  assert.deepEqual(await decryptLovePayload(JSON.parse(serialized), password), payload);
  assert.equal(encrypted.iterations, 600_000);
  assert.equal(Buffer.from(encrypted.salt, 'base64').length, 16);
  assert.equal(Buffer.from(encrypted.iv, 'base64').length, 12);
});

test('the same content and password produce independent salts, IVs and ciphertext', async () => {
  const second = await encryptLovePayload(payload, password);
  assert.notEqual(second.salt, encrypted.salt);
  assert.notEqual(second.iv, encrypted.iv);
  assert.notEqual(second.ciphertext, encrypted.ciphertext);
  assert.deepEqual(await decryptLovePayload(second, password), payload);
});

test('wrong passwords and modified authenticated content do not reveal plaintext', async () => {
  await assert.rejects(decryptLovePayload(encrypted, 'incorrect'), /Unable to unlock/);
  for (const field of ['ciphertext', 'iv', 'salt']) {
    const bytes = Buffer.from(encrypted[field], 'base64');
    bytes[0] ^= 1;
    await assert.rejects(
      decryptLovePayload({ ...encrypted, [field]: bytes.toString('base64') }, password),
      /Unable to unlock/,
    );
  }
});

test('unsupported versions and attacker-controlled work factors are rejected', async () => {
  for (const patch of [
    { version: 2 }, { kdf: 'PBKDF2-SHA1' }, { cipher: 'AES-CBC' },
    { iterations: 1 }, { iterations: 2 ** 53 }, { iterations: '600000' },
  ]) {
    await assert.rejects(decryptLovePayload({ ...encrypted, ...patch }, password), /Unsupported/);
  }
  for (const value of [null, [], 'ciphertext']) {
    await assert.rejects(decryptLovePayload(value, password), /Unsupported/);
  }
});

test('invalid encoded bytes and truncated ciphertext are rejected', async () => {
  for (const patch of [
    { salt: '!!!' }, { iv: '' }, { iv: Buffer.alloc(13).toString('base64') },
    { salt: Buffer.alloc(15).toString('base64') },
    { ciphertext: Buffer.alloc(16).toString('base64') },
    { ciphertext: encrypted.ciphertext + '\n' },
  ]) {
    await assert.rejects(decryptLovePayload({ ...encrypted, ...patch }, password), /Invalid/);
  }
});

test('empty passwords are rejected and whitespace is not silently trimmed', async () => {
  await assert.rejects(encryptLovePayload(payload, ''), /non-empty password/);
  await assert.rejects(decryptLovePayload(encrypted, ''), /non-empty password/);
  const spaced = await encryptLovePayload(null, ' password ');
  assert.equal(await decryptLovePayload(spaced, ' password '), null);
  await assert.rejects(decryptLovePayload(spaced, 'password'), /Unable to unlock/);
  await assert.rejects(encryptLovePayload(undefined, password), /JSON-serializable/);
});

test('8 MiB media content does not overflow base64 conversion or validation', async () => {
  const content = { photo: 'abcd'.repeat(2_097_152) };
  const envelope = await encryptLovePayload(content, password);
  assert.deepEqual(await decryptLovePayload(envelope, password), content);
});

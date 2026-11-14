// This module is shared by the local packager and the browser. Keep it free of
// Node imports so no private build-time inputs become browser dependencies.
const VERSION = 1;
const ITERATIONS = 600_000;
const encoder = new TextEncoder();
const additionalData = encoder.encode('cbz-love:v1');

function requirePassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('A non-empty password is required.');
  }
}

function toBase64(bytes) {
  // Avoid spreading a full photo archive onto the JavaScript call stack.
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value) {
  if (typeof value !== 'string' || value.length === 0
    || value.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(value)) {
    throw new Error('Invalid encrypted envelope.');
  }
  // atob validates padding placement. Avoid a repeated-group regular expression
  // and Uint8Array.from(string), which can exhaust stack/memory on large music.
  let binary;
  try { binary = atob(value); } catch { throw new Error('Invalid encrypted envelope.'); }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  if (toBase64(bytes) !== value) throw new Error('Invalid encrypted envelope.');
  return bytes;
}

async function deriveKey(password, salt, usage) {
  const material = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  );
}

/** Encrypt JSON-serializable content without retaining the password. */
export async function encryptLovePayload(value, password) {
  requirePassword(password);
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error('Content must be JSON-serializable.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, 'encrypt');
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData, tagLength: 128 },
    key,
    encoder.encode(json),
  );
  return {
    version: VERSION,
    kdf: 'PBKDF2-SHA256',
    iterations: ITERATIONS,
    cipher: 'AES-GCM',
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

/** Authenticate before exposing any content. Parameters are fixed, not trusted. */
export async function decryptLovePayload(envelope, password) {
  requirePassword(password);
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)
    || envelope.version !== VERSION || envelope.kdf !== 'PBKDF2-SHA256'
    || envelope.iterations !== ITERATIONS || envelope.cipher !== 'AES-GCM') {
    throw new Error('Unsupported encrypted envelope.');
  }
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.ciphertext);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 17) {
    throw new Error('Invalid encrypted envelope.');
  }
  try {
    const key = await deriveKey(password, salt, 'decrypt');
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData, tagLength: 128 },
      key,
      ciphertext,
    );
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext));
  } catch {
    // JSON/parser errors can include private text. Never forward their details.
    throw new Error('Unable to unlock this content.');
  }
}

import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('./', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, '.openai/hosting.json'), 'utf8'));
if (typeof manifest.project_id !== 'string' || !manifest.project_id || !manifest.r2 || manifest.static) {
  throw new Error('The Worker needs its registered project_id and R2 binding in .openai/hosting.json.');
}
await mkdir(path.join(root, 'dist/server'), { recursive: true });
await mkdir(path.join(root, 'dist/.openai'), { recursive: true });
await copyFile(path.join(root, 'worker/index.js'), path.join(root, 'dist/server/index.js'));
await writeFile(path.join(root, 'dist/.openai/hosting.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Built ciphertext storage Worker.');

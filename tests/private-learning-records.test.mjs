import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const privateMarker = Buffer.from('PRIVATE_LEARNING_RECORD_CANARY_40W_20261016_DO_NOT_PUBLISH');

test('private learning records are ignored by Git and absent from generated site artifacts', async () => {
  const ignored = execFileSync('git', ['check-ignore', '--no-index', '.private/research-foundations/records/example.md'], { encoding: 'utf8' }).trim();
  assert.equal(ignored, '.private/research-foundations/records/example.md');
  const root = path.resolve(process.env.TEST_DIST || 'dist');
  let inspected = 0;
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const filename = path.join(folder, entry.name);
      assert.notEqual(entry.name, '.private', 'Generated output must not include the private records directory');
      if (entry.isDirectory()) await visit(filename);
      else {
        const bytes = await readFile(filename);
        assert.equal(bytes.includes(privateMarker), false, 'Generated output must not contain private learning-record material');
        inspected++;
      }
    }
  }
  await visit(root);
  assert.ok(inspected > 0, 'Build the site before checking publication isolation');
});

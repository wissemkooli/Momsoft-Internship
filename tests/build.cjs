const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { build, assets } = require('../scripts/build.cjs');
const root = path.join(__dirname, '..');

test('The deployment output contains only the five unmodified frontend assets', t => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'momsoft-build-'));
  t.after(() => {
    for (const name of assets) fs.unlinkSync(path.join(output, name));
    fs.rmdirSync(output);
  });
  build(output);
  assert.deepEqual(fs.readdirSync(output).sort(), [...assets].sort());
  for (const name of assets) {
    assert.deepEqual(fs.readFileSync(path.join(output, name)), fs.readFileSync(path.join(root, name)));
  }
  const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)="([^"]+\.(?:css|js|svg))"/g)].map(match => match[1]);
  assert.ok(references.length > 0);
  for (const reference of references) assert.ok(fs.existsSync(path.join(output, reference)), reference + ' exists in the deployment');
});

test('Wrangler serves public/ and builds it before deployment', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(config.name, 'momsoft-internship');
  assert.equal(config.assets.directory, './public');
  assert.equal(config.build.command, 'npm run build');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.build, 'node scripts/build.cjs');
});

// Publish the frontend only, never the repository or installed dependencies.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const assets = ['index.html', 'style.css', 'app.js', 'data.js', 'favicon.svg'];

function build(output = path.join(root, 'public')) {
  fs.mkdirSync(output, { recursive: true });
  for (const name of assets) fs.copyFileSync(path.join(root, name), path.join(output, name));
  return assets;
}

module.exports = { build, assets };
if (require.main === module) {
  console.log('Prepared ' + build().length + ' frontend assets in public/.');
}

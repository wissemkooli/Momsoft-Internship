// Minimal local preview server. The production frontend is entirely static.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assets = {
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/style.css': ['style.css', 'text/css'],
  '/data.js': ['data.js', 'text/javascript'],
  '/app.js': ['app.js', 'text/javascript'],
  '/favicon.svg': ['favicon.svg', 'image/svg+xml']
};
function createServer() {
  return http.createServer((req, res) => {
    const asset = assets[new URL(req.url, 'http://localhost').pathname];
    if (!asset || !['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.setHeader('Content-Type', asset[1] + '; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(path.join(__dirname, '..', asset[0]));
    stream.on('error', () => { res.statusCode = 500; res.end('Unable to read asset'); });
    stream.pipe(res);
  });
}
module.exports = { createServer };
if (require.main === module) {
  const port = Number(process.env.PORT || 8000);
  createServer().listen(port, '127.0.0.1', () => console.log('MOMSOFT preview: http://127.0.0.1:' + port));
}

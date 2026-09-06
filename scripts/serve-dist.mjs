/* global process, URL */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4173);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

function sendFile(response, file, status = 200) {
  response.writeHead(status, {
    'Content-Type': types[extname(file)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(file).pipe(response);
}

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  if (['/demo', '/privacy', '/terms'].includes(url.pathname)) {
    response.writeHead(301, { Location: `${url.pathname}/` });
    response.end();
    return;
  }
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.(\/|\\|$))+/, '');
  let file = join(root, requested);
  if (url.pathname.endsWith('/')) file = join(file, 'index.html');
  if (existsSync(file) && statSync(file).isFile()) {
    sendFile(response, file);
    return;
  }
  sendFile(response, join(root, '404.html'), 404);
}).listen(port, '127.0.0.1', () => process.stdout.write(`Test server listening on http://127.0.0.1:${port}\n`));

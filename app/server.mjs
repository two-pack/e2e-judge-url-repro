// The smallest app that shows the bug: no framework, no dependencies.
import { createServer } from 'node:http';

const page = (script = '') => `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Repro</title></head>
  <body><h1>Repro</h1>${script}</body>
</html>`;

const routes = {
  '/page': page(),
  // The tree is final at once; only the address moves, three seconds later.
  '/moving': page(`<script>setTimeout(() => history.replaceState({}, '', '/moved'), 3000);</script>`),
};

createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const body = routes[pathname];
  response.writeHead(body === undefined ? 404 : 200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(body ?? page());
}).listen(4173, '127.0.0.1');

import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getNameOrigin } from './nameOrigin.js';
import { translateText } from './translate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.png': 'image/png',
};

async function serveStatic(pathname: string, res: http.ServerResponse) {
  const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, relative));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' }).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}

async function handleOrigin(url: URL, res: http.ServerResponse) {
  const name = url.searchParams.get('name')?.trim();
  if (!name) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing "name" query parameter' }));
    return;
  }

  try {
    const origin = await getNameOrigin(name);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(origin));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function handleTranslate(req: http.IncomingMessage, res: http.ServerResponse) {
  let body: { text?: string; targetLang?: string };
  try {
    body = (await readJsonBody(req)) as { text?: string; targetLang?: string };
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const text = body.text?.trim();
  const targetLang = body.targetLang?.trim();
  if (!text || !targetLang) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Both "text" and "targetLang" are required' }));
    return;
  }

  try {
    const translatedText = await translateText(text, targetLang);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ translatedText }));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
}

export const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (url.pathname === '/api/origin') {
    void handleOrigin(url, res);
    return;
  }

  if (url.pathname === '/api/translate' && req.method === 'POST') {
    void handleTranslate(req, res);
    return;
  }

  void serveStatic(url.pathname, res);
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

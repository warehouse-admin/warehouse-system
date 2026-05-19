import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mime = {'js':'text/javascript','css':'text/css','html':'text/html','png':'image/png','jpg':'image/jpeg','ico':'image/x-icon'};

const DATA_FILE = path.join(__dirname, 'wh_data.json');

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(e) { return {}; }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf8');
}

http.createServer((req, r) => {
  r.setHeader('Access-Control-Allow-Origin', '*');
  r.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { r.writeHead(204); r.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  if (p === '/api/data' && req.method === 'GET') {
    r.writeHead(200, { 'Content-Type': 'application/json' });
    r.end(JSON.stringify(readData()));
    return;
  }

  if (p === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { key, value } = JSON.parse(body);
        const data = readData();
        data[key] = value;
        writeData(data);
        r.writeHead(200, { 'Content-Type': 'application/json' });
        r.end(JSON.stringify({ ok: true }));
      } catch (e) {
        r.writeHead(400, { 'Content-Type': 'application/json' });
        r.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  let file = p === '/' ? 'index.html' : p.slice(1);
  let filePath = path.join(__dirname, file);
  try {
    let c = fs.readFileSync(filePath);
    let ext = file.split('.').pop();
    r.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain', 'Cache-Control': 'no-cache' });
    r.end(c);
  } catch (e) {
    r.writeHead(404);
    r.end('404');
  }
}).listen(process.env.PORT || 3152, () => console.log('Server running on port ' + (process.env.PORT || 3152)));

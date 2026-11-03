// Jalankan site statis + API backend sekaligus (dev)
// Pakai: npm run dev:all  atau node dev.js
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);

// Start backend API (port 3001)
const api = spawn('node', ['server/index.js'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

// Vite build sudah di dist/; serve via backend yang sudah include static
// Jadi cukup backend cukup. Tapi untuk HMR dev, jalankan vite dev di port 5173
// dengan proxy ke API. Sederhana: gunakan vite preview dari dist + backend.

// Simpan PID untuk stop
process.on('SIGINT', () => {
  api.kill();
  process.exit(0);
});

api.on('exit', (code) => {
  console.log(`API server berhenti (kode ${code})`);
  process.exit(code || 0);
});

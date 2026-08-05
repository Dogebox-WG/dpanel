import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Run both dev servers with live reload
// The main dpanel UI on 9090 and the recovery/AP-mode UI on 9091.
const viteBin = fileURLToPath(new URL('../node_modules/.bin/vite', import.meta.url));

const servers = [
  { name: 'dpanel', env: { DPANEL_PORT: '9090' } },
  { name: 'recovery', env: { DPANEL_RECOVERY: '1', DPANEL_PORT: '9091' } },
];

const children = servers.map(({ name, env }) => {
  const child = spawn(viteBin, [], {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  child.on('exit', (code, signal) => {
    console.log(`[${name}] exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
    shutdown(code ?? 0);
  });
  return child;
});

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

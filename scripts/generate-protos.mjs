import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const localBuf = fileURLToPath(
  new URL('../node_modules/.bin/buf', import.meta.url),
);
const executable = process.env.DBX_BUF_EXECUTABLE || localBuf;
const result = spawnSync(executable, ['generate'], { stdio: 'inherit' });

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;

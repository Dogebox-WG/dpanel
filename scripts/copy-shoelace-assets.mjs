import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules/@shoelace-style/shoelace/cdn');
const destination = join(root, 'dist/shoelace');

mkdirSync(dirname(destination), { recursive: true });
cpSync(source, destination, { recursive: true });

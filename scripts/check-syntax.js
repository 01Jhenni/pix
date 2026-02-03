#!/usr/bin/env node
/**
 * Verifica sintaxe: node scripts/check-syntax.js
 * No servidor, se der erro, rode: node --check server.js (mostra arquivo e linha).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, ['--check', 'server.js'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['inherit', 'pipe', 'pipe']
});
if (result.status !== 0) {
  const err = (result.stderr || '').trim();
  const out = (result.stdout || '').trim();
  if (err) console.error(err);
  if (out) console.error(out);
  if (!err && !out) console.error('Falha na verificação. Rode: node --check server.js');
  process.exit(1);
}
console.log('OK: sintaxe válida.');
process.exit(0);

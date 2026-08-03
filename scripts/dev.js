#!/usr/bin/env node
// Sobe o Postgres (Docker), a API (NestJS) e o painel (Next.js) com um único comando.
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');

function run(label, command, args, cwd) {
  const child = spawn(command, args, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = `[${label}]`;
  child.stdout.on('data', (data) => process.stdout.write(String(data).split('\n').filter(Boolean).map((l) => `${prefix} ${l}`).join('\n') + '\n'));
  child.stderr.on('data', (data) => process.stderr.write(String(data).split('\n').filter(Boolean).map((l) => `${prefix} ${l}`).join('\n') + '\n'));
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`${prefix} encerrou com código ${code}`);
  });
  return child;
}

console.log('Subindo Postgres via docker compose...');
const dockerUp = spawnSync('docker', ['compose', 'up', '-d'], { cwd: root, shell: true, stdio: 'inherit' });
if (dockerUp.status !== 0) {
  console.warn('Não foi possível subir o Postgres automaticamente (Docker indisponível?). Suba manualmente se necessário.');
}

const api = run('api', 'npm', ['run', 'dev', '--workspace', 'apps/api'], root);
const web = run('web', 'npm', ['run', 'dev', '--workspace', 'apps/web'], root);

function shutdown() {
  api.kill();
  web.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

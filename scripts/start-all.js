#!/usr/bin/env node
/**
 * Cross-platform script to start both EcomMind Backend (FastAPI) and Frontend (Vite)
 * concurrently with colored output and clean shutdown.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

// Find the appropriate python / uvicorn executable
function getUvicornCmd() {
  const isWin = process.platform === 'win32';
  const candidates = [
    path.join(backendDir, 'venv', isWin ? 'Scripts/uvicorn.exe' : 'bin/uvicorn'),
    path.join(backendDir, '.venv', isWin ? 'Scripts/uvicorn.exe' : 'bin/uvicorn'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return { cmd: c, args: ['app.main:app', '--reload', '--port', '8000'] };
    }
  }

  // Fallback to python3 / python module
  const pythonCandidates = [
    path.join(backendDir, 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(backendDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    isWin ? 'python' : 'python3',
  ];

  for (const py of pythonCandidates) {
    if (py.includes(path.sep) && fs.existsSync(py)) {
      return { cmd: py, args: ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'] };
    }
  }

  return { cmd: 'uvicorn', args: ['app.main:app', '--reload', '--port', '8000'] };
}

function getViteCmd() {
  const isWin = process.platform === 'win32';
  const viteBin = path.join(rootDir, 'node_modules', '.bin', isWin ? 'vite.cmd' : 'vite');
  if (fs.existsSync(viteBin)) {
    return { cmd: viteBin, args: ['--port', '3000'] };
  }
  return { cmd: 'npx', args: ['vite', '--port', '3000'] };
}

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[35m%s\x1b[0m', '   Starting EcomMind (Frontend + Backend) ...');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

const uvicorn = getUvicornCmd();
const vite = getViteCmd();

console.log(`\x1b[32m[backend]\x1b[0m Starting FastAPI: ${uvicorn.cmd} ${uvicorn.args.join(' ')}`);
const backendProc = spawn(uvicorn.cmd, uvicorn.args, {
  cwd: backendDir,
  env: { ...process.env, PYTHONPATH: backendDir },
  shell: process.platform === 'win32',
});

console.log(`\x1b[34m[frontend]\x1b[0m Starting Vite: ${vite.cmd} ${vite.args.join(' ')}`);
const frontendProc = spawn(vite.cmd, vite.args, {
  cwd: rootDir,
  env: process.env,
  shell: process.platform === 'win32',
});

function pipeOutput(proc, prefix, color) {
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trimEnd().split('\n');
    for (const line of lines) {
      console.log(`${color}${prefix}\x1b[0m ${line}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trimEnd().split('\n');
    for (const line of lines) {
      console.error(`${color}${prefix}\x1b[0m ${line}`);
    }
  });
}

pipeOutput(backendProc, '[backend] ', '\x1b[32m');
pipeOutput(frontendProc, '[frontend]', '\x1b[34m');

function cleanup() {
  console.log('\n\x1b[33mStopping EcomMind services...\x1b[0m');
  try { backendProc.kill('SIGINT'); } catch (_) {}
  try { frontendProc.kill('SIGINT'); } catch (_) {}
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);


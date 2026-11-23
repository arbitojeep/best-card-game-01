// Take the entry's screenshots: serves game/ on a local port, renders each
// posed ?shot= frame in headless Chromium, and converts the capture to a
// JPEG that fits the gate (long side at most 1280, short side at least 480,
// at most 256 KiB). Run: node shots.mjs
import { spawn, execFile } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const NODE = '/home/hatch/workspace/makefun/node22/bin/node';
const SHELL = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell';
const FFMPEG = '/usr/bin/ffmpeg';
const PORT = 8092;

const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = execFile(cmd, args, { ...opts }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} ${args.join(' ')}: ${stderr || err.message}`));
      else resolve(stdout);
    });
  });
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('server did not come up: ' + url);
}

async function main() {
  mkdirSync(join(here, 'screenshots'), { recursive: true });
  const server = spawn(NODE, [join(here, 'serve.ts'), '--port', String(PORT)], { stdio: 'inherit' });
  try {
    await waitForServer(`http://localhost:${PORT}/index.html`);
    for (const shot of shots) {
      const png = join(here, 'screenshots', shot.name.replace(/\.jpg$/, '.png'));
      const jpg = join(here, 'screenshots', shot.name);
      const url = `http://localhost:${PORT}/index.html${shot.query}`;
      await run(SHELL, [
        '--headless', '--disable-gpu', '--no-sandbox',
        '--window-size=1280,720', '--hide-scrollbars',
        '--virtual-time-budget=4000',
        `--screenshot=${png}`, url,
      ]);
      // JPEG, capped so the gate's 256 KiB limit holds with room to spare.
      await run(FFMPEG, ['-y', '-i', png, '-q:v', '4', '-vf', 'scale=1280:720', jpg], { stdio: 'pipe' });
      const { statSync } = await import('node:fs');
      console.log(shot.name, statSync(jpg).size, 'bytes');
      const { unlinkSync } = await import('node:fs');
      unlinkSync(png);
    }
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import puppeteer from 'puppeteer'
import ffmpegPath from 'ffmpeg-static'
import http from 'http'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = __dirname + '/../';
const OUT_DIR = path.join(ROOT, 'videos');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const SERVER_URL = process.env.DEMO_URL || 'http://localhost:5173/';
let globalFrameIndex = 0;

async function ensureDirs() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(url, (r) => { r.resume(); res(true); })
        req.on('error', rej)
      })
      return true
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('Server not responding at ' + url)
}

function step(route, durationSec = 2, fn) {
  return { route, durationSec, fn };
}

async function recordFrames(page, seconds, fps = 30) {
  const total = Math.floor(seconds * fps);
  for (let i = 0; i < total; i++) {
    const p = path.join(FRAMES_DIR, `seq-${String(globalFrameIndex).padStart(5, '0')}.png`);
    await page.screenshot({ path: p, type: 'png' });
    globalFrameIndex++;
    await new Promise(r => setTimeout(r, 1000 / fps));
  }
}

async function setupOverlay(page) {
  await page.evaluate(() => {
    const panel = document.createElement('div');
    panel.id = 'demo-overlay';
    panel.style.position = 'fixed';
    panel.style.top = '8px';
    panel.style.right = '8px';
    panel.style.maxWidth = '40vw';
    panel.style.maxHeight = '40vh';
    panel.style.overflow = 'auto';
    panel.style.background = 'rgba(0,0,0,0.6)';
    panel.style.color = '#fff';
    panel.style.padding = '8px';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    panel.style.borderRadius = '6px';
    panel.style.zIndex = '999999';
    panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    const title = document.createElement('div');
    title.textContent = 'API Responses';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    panel.appendChild(title);
    document.body.appendChild(panel);
    // Maintain a small buffer on window
    window.__demoResponses = [];
  });
}

async function hookNetworkCapture(page) {
  page.on('response', async (resp) => {
    try {
      const url = resp.url();
      const status = resp.status();
      const method = resp.request().method();
      const type = resp.request().resourceType();
      if (!['xhr', 'fetch'].includes(type)) return;
      let bodyText = '';
      try { bodyText = await resp.text(); } catch { bodyText = '<non-text body>'; }
      bodyText = (bodyText || '').slice(0, 1000);
      const time = new Date().toISOString();
      await page.evaluate(({ url, status, method, bodyText, time }) => {
        const panel = document.getElementById('demo-overlay');
        const info = `${method} ${status} ${url}`;
        if (panel) {
          const wrap = document.createElement('div');
          wrap.style.borderTop = '1px solid rgba(255,255,255,0.2)';
          wrap.style.paddingTop = '6px';
          const meta = document.createElement('div');
          meta.textContent = `[${time}] ${info}`;
          const pre = document.createElement('pre');
          pre.textContent = bodyText;
          pre.style.whiteSpace = 'pre-wrap';
          pre.style.margin = '4px 0 8px';
          wrap.appendChild(meta);
          wrap.appendChild(pre);
          panel.appendChild(wrap);
        }
        // Also store in buffer
        window.__demoResponses = window.__demoResponses || [];
        window.__demoResponses.push({ url, status, method, bodyText, time });
      }, { url, status, method, bodyText, time });
    } catch {}
  });
}

async function run() {
  await ensureDirs();
  await waitForServer(SERVER_URL);
  const browser = await launchStableBrowser();
  const page = await browser.newPage();
  await page.goto(SERVER_URL + '#/');
  await page.evaluate(() => localStorage.setItem('demo_outro', '0'));
  const id = '1';
  const steps = [
    step('/', 2),
    step('/dashboard', 2),
    step('/search', 3, async (p) => {
      await p.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        if (inputs[0]) inputs[0].value = 'React Developer';
        if (inputs[1]) inputs[1].value = 'Mumbai';
        const btn = Array.from(document.querySelectorAll('button')).find(b => /search/i.test(b.textContent||''));
        btn && btn.click();
      });
    }),
    step(`/job/${id}`, 3, async (p) => {
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        btns.slice(0,2).forEach(b => b.click());
      });
    }),
    step('/wishlist', 2),
    step('/tracker', 2),
    step('/profile', 2),
    step('/analytics', 2),
    step('/analyze-job', 2),
    step(`/resume/${id}`, 2),
    step(`/cover-letter/${id}`, 2),
    step(`/interview-prep/${id}`, 2),
    step(`/skills-gap/${id}`, 2),
    step(`/follow-up/${id}`, 2),
    step(`/company-briefing/${id}`, 2),
    step(`/mock-interview/${id}`, 2),
    step(`/video-mock-interview/${id}`, 2),
    step(`/negotiate/${id}`, 2),
    step(`/networking/${id}`, 2),
    step(`/easy-apply/${id}`, 2),
    step('/career-planner', 2),
    step('/autofill-resume', 3, async (p) => {
      await p.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        if (inputs[0]) inputs[0].value = 'https://www.indeed.com/viewjob?jk=demo123';
        const btn = Array.from(document.querySelectorAll('button')).find(b => /analy|extract|auto/i.test(b.textContent||''));
        btn && btn.click();
      });
    }),
    step('/feedback', 2),
  ];

  for (const s of steps) {
    await page.goto(SERVER_URL + '#'+ s.route, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    if (s.fn) { try { await s.fn(page); } catch (e) { console.warn('Step action failed:', s.route, e.message); } }
    await recordFrames(page, s.durationSec, 30);
  }

  // Outro flag
  await page.evaluate(() => localStorage.setItem('demo_outro', '1'));
  await recordFrames(page, 2, 30);

  await browser.close();
  const outFile = path.join(OUT_DIR, 'final_demo.mp4');

  // Build video with subtle sine music using sequential frame pattern
  const duration = steps.reduce((a, b) => a + b.durationSec, 0) + 2;
  await new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-framerate', '30',
      '-i', path.join(FRAMES_DIR, 'seq-%05d.png'),
      '-f', 'lavfi', '-t', String(duration), '-i', `sine=frequency=180:sample_rate=44100`,
      '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-filter:a', 'volume=0.03',
      outFile
    ];
    const ff = spawn(ffmpegPath, args, { stdio: 'inherit' });
    ff.on('exit', (code) => code === 0 ? resolve(null) : reject(new Error('ffmpeg failed ' + code)));
  });

  console.log('Demo video saved to', outFile);
}

run().catch(err => { console.error(err); process.exit(1); });

function createViewport() {
  return { width: 1920, height: 1080 };
}

async function launchStableBrowser() {
  const common = { headless: true, defaultViewport: createViewport(), args: ['--no-sandbox','--disable-setuid-sandbox'] };
  // Try Chrome channel
  try {
    return await puppeteer.launch({ ...common, channel: 'chrome' });
  } catch (e1) {
    // Try Edge channel
    try {
      return await puppeteer.launch({ ...common, channel: 'msedge' });
    } catch (e2) {
      // Try explicit executable paths
      const candidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        'C://Program Files//Google//Chrome//Application//chrome.exe',
        'C://Program Files (x86)//Google//Chrome//Application//chrome.exe',
        'C://Program Files//Microsoft//Edge//Application//msedge.exe',
        'C://Program Files (x86)//Microsoft//Edge//Application//msedge.exe',
      ].filter(Boolean);
      for (const exe of candidates) {
        try {
          return await puppeteer.launch({ ...common, executablePath: exe });
        } catch {}
      }
      throw new Error('Could not launch browser via Puppeteer. Please install Chrome/Edge or set PUPPETEER_EXECUTABLE_PATH.');
    }
  }
}
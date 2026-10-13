// Lab measurements on a local production build or the public deployment.
// TEST_BASE_URL=http://127.0.0.1:3107 node tests/browser-performance.mjs
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const base = process.env.TEST_BASE_URL;
if (!base) throw new Error('Set TEST_BASE_URL');
const profile = await mkdtemp(path.join(tmpdir(), 'thirst-performance-'));
const port = 19335;
const child = spawn(process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`],
  { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let target;
  for (let i = 0; i < 100; i++) {
    try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); break; }
    catch { await delay(100); }
  }
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  const requests = new Map();
  let failures = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = pending.get(message.id); pending.delete(message.id); callback?.(message); }
    if (message.method === 'Network.responseReceived') requests.set(message.params.requestId, {
      url: message.params.response.url, type: message.params.type, status: message.params.response.status, bytes: 0,
    });
    if (message.method === 'Network.loadingFinished' && requests.has(message.params.requestId)) requests.get(message.params.requestId).bytes = message.params.encodedDataLength;
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, response => response.error ? reject(new Error(response.error.message)) : resolve(response.result));
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__perf = { lcp: 0, cls: 0, shifts: [], longTasks: 0, blockingMs: 0, uncoveredMs: null };
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) { window.__perf.cls += e.value; window.__perf.shifts.push({ time: e.startTime, value: e.value, sources: e.sources.map(s => ({node: s.node?.nodeName, text: s.node?.textContent?.slice(0,80), before:s.previousRect.toJSON(), after:s.currentRect.toJSON()})) }); } }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) { window.__perf.longTasks++; window.__perf.blockingMs += Math.max(0, e.duration - 50); } }).observe({ type: 'longtask', buffered: true });
    const uncovered = setInterval(() => {
      const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      if (el && !el.closest('[style*="999999"]')) { window.__perf.uncoveredMs = performance.now(); clearInterval(uncovered); }
    }, 20);
  ` });
  const results = [];
  for (const mobile of [false, true]) {
    await send('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1365, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
    await send('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
    for (const route of (process.env.PERF_ROUTES || '/,/admin/login,/menu').split(',')) {
      requests.clear(); failures = [];
      await send('Page.navigate', { url: base + route });
      await delay(6500);
      const metrics = await evaluate(`(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return { ...window.__perf, ttfb: nav?.responseStart, domReady: nav?.domContentLoadedEventEnd,
          fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
          title: document.title, path: location.pathname,
          headingFont: document.querySelector('h1') && getComputedStyle(document.querySelector('h1')).fontFamily,
          bodyFont: getComputedStyle(document.body).fontFamily,
          images: [...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).map(i => ({alt:i.alt,width:i.clientWidth,naturalWidth:i.naturalWidth,src:i.currentSrc})),
          headings: [...document.querySelectorAll('h1')].map(el => el.textContent.trim()),
          unnamedButtons: [...document.querySelectorAll('button')].filter(el => !el.textContent.trim() && !el.getAttribute('aria-label')).length };
      })()`);
      const network = [...requests.values()];
      results.push({ base, route, mobile, cpuSlowdown: mobile ? 4 : 1, ...metrics,
        scriptBytes: network.filter(r => r.type === 'Script').reduce((sum, r) => sum + r.bytes, 0),
        imageBytes: network.filter(r => r.type === 'Image').reduce((sum, r) => sum + r.bytes, 0),
        failedResponses: network.filter(r => r.status >= 400), failures,
        requests: network });
      console.log(JSON.stringify({ ...results.at(-1), requests: undefined, images: undefined, shifts: undefined }));
      if (process.env.PERF_PUBLIC_FLOW && route === '/' && !mobile) {
        const click = async selector => {
          await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center'})`);
          await delay(800);
          const point = await evaluate(`(() => { const r=document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect(); return r&&{x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
          assert(point, `Missing public control: ${selector}`);
          await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
          await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
        };
        await click('img[alt="Instagram"]');
        await delay(500);
        assert(await evaluate('!!document.querySelector(\'img[alt="Popup"]\')'), 'Gallery did not open');
        await click('button[aria-label="Close image"]');
        await delay(600);
        assert.equal(await evaluate('!!document.querySelector(\'img[alt="Popup"]\')'), false, 'Gallery did not close');
        await click('button[aria-label="Show review 2"]');
        await delay(1200);
        assert(await evaluate('document.body.textContent.includes("Arjun Mehta")'), 'Review control did not respond');
        assert.equal(failures.length, 0, failures.join('\n'));
        console.log('PASS: homepage gallery opens/closes and isolated review controls respond.');
      }
    }
  }
  if (process.env.PERF_OUTPUT) await writeFile(process.env.PERF_OUTPUT, JSON.stringify(results, null, 2));
} finally {
  socket?.close(); child.kill(); await delay(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(resolved).startsWith('thirst-performance-')) await rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

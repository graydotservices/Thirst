// Local UI integration test. All Auth/API/database requests are fixtures; no sales
// or accounts are created. Build with the public fixture config in README first.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const base = process.env.TEST_BASE_URL;
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Set TEST_BASE_URL to a local production server');
const profile = await mkdtemp(path.join(tmpdir(), 'thirst-flow-'));
const port = 19336;
const child = spawn(process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`],
  { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const id = '10000000-0000-0000-0000-000000000001';
const productId = '20000000-0000-0000-0000-000000000001';
const user = { id, aud: 'authenticated', role: 'authenticated', email: 'fixture@test.invalid', email_confirmed_at: '2026-01-01',
  app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-01-01' };
const session = { access_token: 'fixture-access-token-123456789', refresh_token: 'fixture-refresh-token', token_type: 'bearer',
  expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
const product = { id: productId, name: 'Test Cake', price: 100, stock: 5, category: 'cakes', image: '/cake-product.png' };
const orders = Array.from({ length: 60 }, (_, index) => ({ id: `order-${index}`, bill_no: `TEST-${index}`, customer_name: `Customer ${index}`,
  customer_phone: '9876543210', subtotal: 100, discount: 0, gst: 0, total: 100, status: 'completed', payment_method: 'cash', created_at: new Date().toISOString(),
  items: [{ product_id: productId, name: 'Test Cake', qty: 1, price: 100, total: 100 }] }));
let socket;
try {
  let target;
  for (let i = 0; i < 100; i++) {
    try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); break; }
    catch { await delay(100); }
  }
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0, authReads = 0, focusStatus = 200, checkoutConfirmed = false, productReads = 0, currentRole = 'admin';
  const pending = new Map(), exceptions = [], checkoutBodies = [], databaseRequests = [], scriptRequests = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, response => response.error ? reject(new Error(response.error.message)) : resolve(response.result));
    socket.send(JSON.stringify({ id, method, params }));
  });
  const fulfill = (requestId, body, status = 200, extra = []) => send('Fetch.fulfillRequest', { requestId, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: new URL(base).origin },
      { name: 'Access-Control-Expose-Headers', value: 'content-range' }, ...extra],
    body: Buffer.from(JSON.stringify(body)).toString('base64') });
  const intercept = async ({ requestId, request }) => {
    const url = new URL(request.url);
    if (url.pathname === '/api/auth/me') {
      authReads++; await delay(120);
      return fulfill(requestId, focusStatus === 200 ? { id, auth_user_id: id, name: 'Fixture Admin', email: user.email, role: currentRole, status: 'active' } : { error: 'Access unavailable' }, focusStatus);
    }
    if (url.pathname === '/api/orders' && request.method === 'POST') {
      checkoutBodies.push(JSON.parse(request.postData));
      if (checkoutBodies.length === 1) return send('Fetch.failRequest', { requestId, errorReason: 'ConnectionReset' });
      checkoutConfirmed = true;
      return fulfill(requestId, { order: { ...orders[0], bill_no: 'CONFIRMED-1', billed_by: 'Fixture Admin' }, billNo: 'CONFIRMED-1' }, 201);
    }
    if (!url.hostname.endsWith('.supabase.co')) return send('Fetch.continueRequest', { requestId });
    if (request.method === 'OPTIONS') return fulfill(requestId, {}, 200, [
      { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' },
      { name: 'Access-Control-Allow-Headers', value: 'authorization, apikey, content-type, x-client-info, range, prefer, accept-profile, content-profile, x-supabase-api-version' },
    ]);
    databaseRequests.push({ url: url.href, method: request.method, body: request.postData });
    if (url.pathname.includes('/auth/v1/')) return fulfill(requestId, url.pathname.endsWith('/logout') ? {} : user);
    if (url.pathname.endsWith('/dashboard_summary')) return fulfill(requestId, { stats: { todayRevenue: 100, todayOrders: 1, activeCustomers: 60, monthlyRevenue: 100 },
      chartData: [{ date: 'Tue', revenue: 100 }], recentBills: [orders[0]], topProducts: [{ name: 'Test Cake', orders: 1, revenue: 100 }] });
    if (url.pathname.endsWith('/sales_summary')) {
      const range = JSON.parse(request.postData).p_range;
      return fulfill(requestId, { totalRevenue: range === 'monthly' ? 800 : 100, totalOrders: 1, uniqueCustomers: 1, avgOrderValue: 100,
        chartData: [{ date: 'Tue', revenue: 100, orders: 1 }], topProducts: [{ name: 'Test Cake', orders: 1, revenue: 100 }],
        periodStart: '2026-10-01T00:00:00+05:30', periodEnd: '2026-10-14T00:00:00+05:30' });
    }
    if (url.pathname.endsWith('/customer_summary')) return fulfill(requestId, { count: 60, loyaltyPoints: 60, revenue: 6000 });
    if (url.pathname.endsWith('/billing_customers')) return fulfill(requestId, []);
    if (url.pathname.endsWith('/products')) {
      productReads++;
      if (checkoutConfirmed) await delay(2500); // Must not keep the confirmed sale busy.
      return fulfill(requestId, [product]);
    }
    if (url.pathname.endsWith('/orders') || url.pathname.endsWith('/customers')) {
      const customers = url.pathname.endsWith('/customers');
      let rows = customers ? orders.map((order, index) => ({ id: order.id, name: order.customer_name, phone: order.customer_phone,
        email: `${index}@test.invalid`, birthday: null, loyalty_points: 1, total_purchase: 100, last_visit: order.created_at })) : orders;
      const filter = url.searchParams.get('or');
      if (filter?.includes('Customer 59')) rows = rows.filter(row => (row.name || row.customer_name) === 'Customer 59');
      const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || 25);
      return fulfill(requestId, rows.slice(offset, offset + limit), 200, [{ name: 'Content-Range', value: `${offset}-${Math.min(offset + limit, rows.length) - 1}/${rows.length}` }]);
    }
    return fulfill(requestId, []);
  };
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = pending.get(message.id); pending.delete(message.id); callback?.(message); }
    if (message.method === 'Fetch.requestPaused') void intercept(message.params).catch(error => exceptions.push(String(error)));
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Page.javascriptDialogOpening') void send('Page.handleJavaScriptDialog', { accept: true });
    if (message.method === 'Network.requestWillBeSent' && message.params.type === 'Script') scriptRequests.push(message.params.request.url);
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (expression, label) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(80); }
    throw new Error(`Timed out: ${label}`);
  };
  const click = async expression => {
    const point = await evaluate(`(() => { const el = ${expression}; if (!el) return null; el.scrollIntoView({block:'center'}); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    assert(point, `Missing click target: ${expression}`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  };
  const button = text => `[...document.querySelectorAll('button')].find(el => el.textContent.includes(${JSON.stringify(text)}))`;
  const navigate = async route => { await click(`document.querySelector('a[href="${route}"]')`); await until(`location.pathname===${JSON.stringify(route)}`, route); };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride', { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Browser.setDownloadBehavior', { behavior: 'deny' });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co/*' }, { urlPattern: base + '/api/*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('sb-placeholder-auth-token',${JSON.stringify(JSON.stringify(session))});` });
  await send('Page.navigate', { url: base + '/admin/dashboard' });
  await until(`document.body?.textContent.includes('Last 7 Days Revenue')`, 'dashboard summary');
  const initialReads = authReads;
  assert.equal(initialReads, 1);
  await navigate('/admin/billing');
  await until(`document.body.textContent.includes('Test Cake')`, 'billing products');
  assert.equal(authReads, initialReads, 'Navigation repeated blocking staff verification');
  assert.equal(productReads, 1);
  assert(await evaluate(`document.body.textContent.includes('Cashier: Fixture Admin')`));
  await click(`[...document.querySelectorAll('h4')].find(el => el.textContent==='Test Cake')`);
  await until(`${button('Generate Bill')}?.textContent.includes('100')`, 'cart');
  focusStatus = 503;
  await evaluate(`window.dispatchEvent(new Event('focus'))`); await delay(350);
  assert(await evaluate(`${button('Generate Bill')}?.textContent.includes('100')`), 'Background connection failure cleared the cart');
  focusStatus = 200;
  await click(button('Generate Bill'));
  await until(`!!${button('Retry / Confirm Bill')}`, 'uncertain checkout retry');
  await click(button('Retry / Confirm Bill'));
  await until(`document.body.textContent.includes('CONFIRMED-1')`, 'confirmed sale');
  assert.equal(checkoutBodies.length, 2);
  assert.deepEqual(checkoutBodies[0], checkoutBodies[1], 'Retry changed the idempotency key/payload');
  assert.equal(await evaluate(`${button('New Bill')}?.disabled`), false, 'Stock refresh blocks a confirmed sale');
  const beforeExport = scriptRequests.length;
  await click(button('Download A4'));
  await delay(1800);
  assert(scriptRequests.length > beforeExport, 'PDF libraries were not loaded on demand');
  await click(button('New Bill'));
  assert(await evaluate(`${button('Generate Bill')}?.disabled`));
  await navigate('/admin/orders');
  await until(`document.querySelectorAll('tbody tr').length===25`, 'bounded order list');
  await click(button('Next'));
  await until(`document.body.textContent.includes('TEST-25')`, 'second page');
  await navigate('/admin/customers');
  await until(`document.querySelectorAll('tbody tr').length===25`, 'bounded customer list');
  await click(`document.querySelector('#customer-search')`);
  await send('Input.insertText', { text: 'Customer 59' });
  await until(`document.querySelectorAll('tbody tr').length===1 && document.body.textContent.includes('Customer 59')`, 'search beyond initial page');
  await navigate('/admin/reports');
  await until(`!!document.querySelector('#btn-export-reports:not(:disabled)')`, 'report summary');
  await click(button('Monthly'));
  await until(`document.body.textContent.includes('800')`, 'selected report totals');
  const reportRequests = databaseRequests.filter(request => request.url.includes('/sales_summary'));
  assert(reportRequests.some(request => JSON.parse(request.body).p_range === 'monthly'));
  focusStatus = 403;
  await evaluate(`window.dispatchEvent(new Event('focus'))`);
  await until(`location.pathname==='/admin/login'`, 'revoked access');
  focusStatus = 200; currentRole = 'cashier';
  await send('Page.navigate', { url: base + '/admin/staff' });
  await until(`location.pathname==='/admin/billing' && document.body?.textContent.includes('Test Cake')`, 'cashier route restriction');
  assert.equal(await evaluate(`!!document.querySelector('a[href="/admin/staff"]')`), false);
  currentRole = 'manager';
  await send('Page.navigate', { url: base + '/admin/locations' });
  await until(`location.pathname==='/admin/dashboard' && document.body?.textContent.includes('Last 7 Days Revenue')`, 'manager route restriction');
  assert.equal(await evaluate(`!!document.querySelector('a[href="/admin/locations"]')`), false);
  assert.equal(exceptions.length, 0, exceptions.join('\n'));
  console.log('PASS: shared staff verification, cart preservation, idempotent checkout retry, non-blocking stock refresh, lazy PDF export, database pagination/search, report ranges, access revocation, and cashier/manager route restrictions.');
} finally {
  socket?.close(); child.kill(); await delay(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(resolved).startsWith('thirst-flow-')) await rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

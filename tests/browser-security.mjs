// Optional production smoke check: TEST_BASE_URL=http://127.0.0.1:3107 node tests/browser-security.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const base=process.env.TEST_BASE_URL;
if(!base)throw new Error('Set TEST_BASE_URL to a local running production server');
const chrome=process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile=await mkdtemp(path.join(tmpdir(),'thirst-security-'));
const port=19334;
const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`],{windowsHide:true,stdio:'ignore'});
let socket;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try {
  let target;
  for(let i=0;i<100;i++) {
    try { target=await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(base+'/admin/login')}`,{method:'PUT'})).json();break; }
    catch { await delay(100); }
  }
  assert(target?.webSocketDebuggerUrl,'Headless browser did not start');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let nextId=0;const pending=new Map();const violations=[];const exceptions=[];
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.id){const callback=pending.get(message.id);pending.delete(message.id);if(callback)callback(message);}
    if(message.method==='Log.entryAdded'&&/content security policy|refused to execute/i.test(message.params.entry.text))violations.push(message.params.entry.text);
    if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++nextId;pending.set(id,response=>response.error?reject(new Error(response.error.message)):resolve(response.result));socket.send(JSON.stringify({id,method,params}));
  });
  await send('Runtime.enable');await send('Log.enable');await send('Page.enable');await send('Page.bringToFront');
  await send('Page.navigate',{url:base+'/admin/login'});
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  // Wait for hydration instead of assuming a fixed workstation/network speed.
  for(let i=0;i<100;i++) {
    if(await evaluate('(()=>{const b=document.querySelector("button[aria-label=\\"Show password\\"]");return !!b&&Object.keys(b).some(key=>key.startsWith("__reactProps"))})()'))break;
    await delay(150);
  }
  assert.equal(await evaluate('document.querySelector("#admin-password")?.type'),'password');
  const box=await evaluate('(()=>{const b=document.querySelector("button[aria-label=\\"Show password\\"]").getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...box,button:'left',clickCount:1});await delay(1000);
  if (await evaluate('document.querySelector("#admin-password").type') !== 'text') console.log(JSON.stringify({violations,exceptions,react:await evaluate('({buttonKeys:Object.keys(document.querySelector("button[aria-label=\\"Show password\\"]")),flight:window.__next_f?.length,hidden:document.hidden,scripts:[...document.scripts].map(s=>({nonce:s.nonce,src:s.src}))})')}));
  assert.equal(await evaluate('document.querySelector("#admin-password").type'),'text','Login controls did not hydrate');
  const injection=await evaluate(`new Promise(resolve=>{window.__receiptTest=0;const node=document.createElement('img');node.setAttribute('onerror','window.__receiptTest=1');node.src='/missing-security-image';document.body.appendChild(node);setTimeout(()=>{node.remove();resolve(window.__receiptTest)},200)})`);
  assert.equal(injection,0,'CSP allowed an inline event handler');
  const unexpected=violations.filter(value=>!value.includes('window.__receiptTest=1'));
  // The intentionally injected event handler should be blocked; framework scripts must load.
  assert.equal(exceptions.length,0,exceptions.join('\n'));
  assert.equal(unexpected.filter(value=>!value.includes('inline event handler')).length,0,unexpected.join('\n'));
  await send('Page.navigate',{url:base+'/admin/staff'});await delay(4000);
  assert.equal(await evaluate('location.pathname'),'/admin/login','Unauthenticated dashboard did not redirect');
  console.log('PASS: production login hydrates, inline script injection is blocked, and unauthenticated dashboard access redirects.');
  for(const endpoint of ['orders','products','reports','franchise','auth/me']) {
    const response=await fetch(`${base}/api/${endpoint}`);assert.equal(response.status,401);assert(response.headers.get('cache-control')?.includes('no-store'));
  }
  const first=await fetch(base+'/admin/login'),second=await fetch(base+'/admin/login');
  const firstNonce=first.headers.get('content-security-policy')?.match(/nonce-([^']+)/)?.[1];
  const secondNonce=second.headers.get('content-security-policy')?.match(/nonce-([^']+)/)?.[1];
  assert(firstNonce&&secondNonce&&firstNonce!==secondNonce);assert.equal(first.headers.get('x-frame-options'),'DENY');
  console.log('PASS: private APIs reject anonymous requests, responses are not cached, and CSP nonces differ between requests.');
} finally {
  socket?.close();child.kill();
  await delay(500);
  // The profile is a unique directory created by this script under the OS temp root.
  const resolved=path.resolve(profile),tempRoot=path.resolve(tmpdir())+path.sep;
  if(resolved.startsWith(tempRoot)&&path.basename(resolved).startsWith('thirst-security-'))await rm(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}

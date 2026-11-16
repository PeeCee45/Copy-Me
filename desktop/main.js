const { app, BrowserWindow, clipboard, ipcMain } = require('electron');
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const os = require('os');
const crypto = require('crypto');

const PORT = 8787;
const PIN = String(Math.floor(1000 + Math.random() * 9000));
const HOST_ID = crypto.randomUUID();   // identifies this app instance, so it can never join itself
const NAME = os.hostname();
const peers = new Map();               // socket -> { id, name }
const seen = new Set();                // ids of clips already handled, stops loops
let last = '';
let win;

const WEB_PAGE = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Copy Me</title>
<style>
body{font:16px system-ui,sans-serif;margin:0;padding:20px;background:#f6f5f1;color:#1c1b19}
@media (prefers-color-scheme:dark){body{background:#161512;color:#f1efe9}}
h1{margin:0 0 12px}h1 span{color:#e4572e}
input,textarea{width:100%;box-sizing:border-box;padding:12px;margin:0 0 10px;border:1px solid #8886;border-radius:10px;font:inherit;background:transparent;color:inherit}
button{background:#e4572e;color:#fff;border:0;border-radius:10px;padding:12px 16px;font:inherit;font-weight:600}
.item{border-top:1px solid #8884;padding:10px 0;display:flex;gap:10px;align-items:flex-start}
.item div{flex:1;word-break:break-word;white-space:pre-wrap}
#app{display:none}
</style></head><body>
<h1>Copy<span>Me</span></h1><div id="s">Enter your name and the PIN shown on the computer</div>
<div id="login"><input id="nm" placeholder="Device name"><input id="pin" placeholder="PIN" inputmode="numeric"><button id="go">Connect</button></div>
<div id="app"><p id="dev"></p><textarea id="msg" placeholder="Paste or type here, then tap Send"></textarea>
<button id="send">Send</button><h3>Received</h3><div id="list"></div></div>
<script>
var $=function(i){return document.getElementById(i)},ws,seen={};
var myId=Math.random().toString(36).slice(2)+Date.now().toString(36);
function guess(){
  var u=navigator.userAgent;
  if(u.indexOf('Android')>-1){var p=u.split('(')[1].split(')')[0].split(';');return p[p.length-1].trim()||'Android phone'}
  if(u.indexOf('iPhone')>-1)return 'iPhone';
  if(u.indexOf('iPad')>-1)return 'iPad';
  if(u.indexOf('Windows')>-1)return 'Windows browser';
  if(u.indexOf('Macintosh')>-1)return 'Mac browser';
  return 'Browser';
}
var saved='';try{saved=localStorage.getItem('cm-name')||''}catch(e){}
$('nm').value=saved||guess();
function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function cp(t){
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).catch(function(){});return}
  var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();
  try{document.execCommand('copy')}catch(e){}a.remove();
}
function add(t){
  var d=document.createElement('div');d.className='item';
  var x=document.createElement('div');x.textContent=t;
  var b=document.createElement('button');b.textContent='Copy';
  b.onclick=function(){cp(t);b.textContent='Copied'};
  d.appendChild(x);d.appendChild(b);$('list').insertBefore(d,$('list').firstChild);
}
$('go').onclick=function(){
  try{localStorage.setItem('cm-name',$('nm').value)}catch(e){}
  ws=new WebSocket('ws://'+location.host);
  ws.onopen=function(){ws.send(JSON.stringify({type:'hello',pin:$('pin').value,id:myId,name:$('nm').value||'Browser'}))};
  ws.onmessage=function(e){
    var m=JSON.parse(e.data);
    if(m.type==='auth'){
      $('s').textContent=m.ok?'Connected to '+m.name:(m.reason||'Could not connect');
      if(m.ok){$('app').style.display='block';$('login').style.display='none'}
    }
    if(m.type==='devices')$('dev').textContent='Connected devices: '+m.list.join(', ');
    if(m.type==='clip'&&!seen[m.id]){seen[m.id]=1;add(m.text)}
  };
  ws.onclose=function(){$('s').textContent='Disconnected'};
};
$('send').onclick=function(){
  var t=$('msg').value;
  if(t&&ws&&ws.readyState===1){var id=uid();seen[id]=1;ws.send(JSON.stringify({type:'clip',text:t,id:id}));$('msg').value=''}
};
</script></body></html>`;

function lanIPs() {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
}
const send = (ch, ...a) => win && win.webContents.send(ch, ...a);

function remember(id) {
  seen.add(id);
  if (seen.size > 500) seen.delete(seen.values().next().value);
}
function hasPeer(id) { return [...peers.values()].some(p => p.id === id); }

function updateDevices() {
  const names = [...peers.values()].map(p => p.name);
  send('devices', names);
  const msg = JSON.stringify({ type: 'devices', list: [NAME, ...names] });
  peers.forEach((_, s) => s.readyState === 1 && s.send(msg));
}

function relay(text, id, except) {
  const msg = JSON.stringify({ type: 'clip', text, id });
  peers.forEach((_, s) => s !== except && s.readyState === 1 && s.send(msg));
}
function applyClip(m, from) {
  if (typeof m.text !== 'string' || !m.id || seen.has(m.id)) return; // already handled: drop it
  remember(m.id);
  last = m.text;
  clipboard.writeText(m.text);
  relay(m.text, m.id, from);
  const who = peers.get(from);
  send('log', 'From ' + (who ? who.name : 'a device') + ': ' + m.text.slice(0, 80));
}

function startServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(WEB_PAGE);
  });
  const wss = new WebSocketServer({ server });
  server.listen(PORT);
  wss.on('connection', ws => {
    ws.on('message', raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.type === 'ping') return ws.send(JSON.stringify({ type: 'pong' }));
      if (m.type === 'hello') {
        const deny = reason => { ws.send(JSON.stringify({ type: 'auth', ok: false, reason })); ws.close(); };
        if (m.id === HOST_ID) return deny('A device can’t connect to itself.');
        for (const [old, p] of peers) if (p.id === m.id) { peers.delete(old); try { old.terminate(); } catch {} } // reconnecting device replaces its stale link
        if (m.pin !== PIN) return deny('Wrong PIN');
        const name = String(m.name || 'Device').slice(0, 40);
        peers.set(ws, { id: m.id, name });
        ws.send(JSON.stringify({ type: 'auth', ok: true, id: HOST_ID, name: NAME }));
        send('log', name + ' joined');
        updateDevices();
        return;
      }
      if (peers.has(ws) && m.type === 'clip') applyClip(m, ws);
    });
    ws.on('close', () => {
      const p = peers.get(ws);
      if (p) { peers.delete(ws); send('log', p.name + ' left'); updateDevices(); }
    });
  });
}

function joinHost(host, pin) {
  const sock = new WebSocket('ws://' + host.trim());
  sock.on('open', () => sock.send(JSON.stringify({ type: 'hello', pin, id: HOST_ID, name: NAME })));
  sock.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'auth') {
      if (!m.ok) { send('log', m.reason || 'Could not join'); return sock.close(); }
      if (m.id === HOST_ID) { send('log', 'That is this computer. Skipped.'); return sock.close(); }
      if (hasPeer(m.id)) { send('log', m.name + ' is already connected.'); return sock.close(); }
      peers.set(sock, { id: m.id, name: m.name });
      send('log', 'Joined ' + m.name);
      updateDevices();
      return;
    }
    if (peers.has(sock) && m.type === 'clip') applyClip(m, sock);
  });
  sock.on('close', () => {
    const p = peers.get(sock);
    if (p) { peers.delete(sock); send('log', p.name + ' disconnected'); updateDevices(); }
  });
  sock.on('error', () => send('log', 'Could not connect to ' + host));
}

function watchClipboard() {
  setInterval(() => {
    const t = clipboard.readText();
    if (t && t !== last) {
      last = t;
      const id = crypto.randomUUID();
      remember(id);
      relay(t, id, null);
      send('log', 'Sent: ' + t.slice(0, 80));
    }
  }, 700);
}

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 440, height: 700, title: 'Copy Me',
    webPreferences: { nodeIntegration: true, contextIsolation: false } // loads local file only
  });
  win.loadFile('index.html');
  win.webContents.on('did-finish-load', () =>
    send('info', { ips: lanIPs(), port: PORT, pin: PIN, name: NAME }));
  ipcMain.on('connect', (_, { host, pin }) => joinHost(host, pin));
  startServer();
  watchClipboard();
});
app.on('window-all-closed', () => app.quit());

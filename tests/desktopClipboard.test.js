import test from 'node:test';
import assert from 'node:assert/strict';
import {desktopClipboard} from '../client/src/lib/desktopClipboard.js';

function setup() {
  const sent=[],received=[],errors=[];
  const client={createClipboardStream(mime){const stream={mime,blobs:[],sendBlob(v){this.blobs.push(v);},sendEnd(){this.ended=true;}};sent.push(stream);return stream;}};
  const bridge=desktopClipboard(client,{onText:t=>received.push(t),onError:e=>errors.push(e)});
  const input=()=>({acks:[],sendAck(message,code){this.acks.push(code);}});
  return {client,bridge,sent,received,errors,input};
}
test('clipboard round trip preserves UTF-8, emoji and line breaks across split chunks',()=>{
  const t=setup(),text='Tiếng Việt 🧪\r\nDòng thứ hai\n';
  t.bridge.sendText(text.repeat(1000));
  assert.equal(t.sent[0].mime,'text/plain');assert.equal(t.sent[0].ended,true);
  assert.equal(Buffer.concat(t.sent[0].blobs.map(b=>Buffer.from(b,'base64'))).toString('utf8'),text.repeat(1000));
  const stream=t.input();t.client.onclipboard(stream,'text/plain;charset=utf-8');
  const bytes=Buffer.from(text);for(let i=0;i<bytes.length;i++)stream.onblob(bytes.subarray(i,i+1).toString('base64'));
  stream.onend();assert.deepEqual(t.received,[text]);assert.ok(stream.acks.every(code=>code===0));
});
test('clipboard rejects oversized content, non-text MIME and late data after dispose',()=>{
  const t=setup();assert.throws(()=>t.bridge.sendText('x'.repeat(1048577)),/1 MiB/);
  assert.equal(t.sent.length,0);
  const html=t.input();t.client.onclipboard(html,'text/html');assert.deepEqual(html.acks,[0x0100]);
  const stream=t.input();t.client.onclipboard(stream,'text/plain');
  stream.onblob(Buffer.alloc(1048577).toString('base64'));stream.onend();
  assert.equal(t.errors.length,1);assert.equal(t.received.length,0);
  const late=t.input();t.client.onclipboard(late,'text/plain');const end=late.onend;t.bridge.dispose();end();
  assert.equal(t.client.onclipboard,null);assert.equal(t.received.length,0);
  assert.throws(()=>t.bridge.sendText('later'),/kết nối Desktop/);
});

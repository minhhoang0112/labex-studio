const MAX_BYTES = 1024 * 1024;

// Text only, scoped to one Guacamole connection. No polling or persistence.
export function desktopClipboard(client, {onText, onError, active = () => true}) {
  let disposed = false;
  const inputs = new Set();
  client.onclipboard = (stream, mime) => {
    if (disposed || !active() || !/^text\/plain(?:;|$)/i.test(mime) || inputs.size >= 4) {
      stream.sendAck('Text clipboard only', 0x0100);
      return;
    }
    const decoder = new TextDecoder('utf-8');
    let text = '', bytes = 0, failed = false;
    inputs.add(stream);
    stream.onblob = data => {
      if (failed || disposed) return;
      try {
        const raw = atob(data);
        bytes += raw.length;
        if (bytes > MAX_BYTES) throw new Error('Clipboard quá lớn; tối đa 1 MiB văn bản.');
        text += decoder.decode(Uint8Array.from(raw, c => c.charCodeAt(0)), {stream:true});
        stream.sendAck('OK', 0);
      } catch (error) {
        failed = true; text = ''; inputs.delete(stream);
        stream.sendAck('Clipboard rejected', 0x0100);
        if (!disposed) onError(error.message);
      }
    };
    stream.onend = () => {
      inputs.delete(stream);
      if (!failed && !disposed && active()) onText(text + decoder.decode());
      text = '';
    };
  };
  return {
    sendText(text) {
      if (disposed || !active()) throw new Error('Hãy kết nối Desktop trước khi dán.');
      const bytes = new TextEncoder().encode(text);
      if (bytes.length > MAX_BYTES) throw new Error('Clipboard quá lớn; tối đa 1 MiB văn bản.');
      const stream = client.createClipboardStream('text/plain');
      stream.onack = status => {
        if (!disposed && active() && status.code >= 0x0100) onError('Máy ảo chưa nhận clipboard. Hãy kiểm tra kết nối và thử lại.');
      };
      for (let offset = 0; offset < bytes.length; offset += 12000) {
        const chunk = bytes.subarray(offset, offset + 12000);
        stream.sendBlob(btoa(Array.from(chunk, b => String.fromCharCode(b)).join('')));
      }
      stream.sendEnd();
    },
    dispose() {
      disposed = true;
      client.onclipboard = null;
      for (const stream of inputs) {stream.onblob = null; stream.onend = null;}
      inputs.clear();
    },
  };
}

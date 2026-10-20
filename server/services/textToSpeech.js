export function createTextToSpeech({ fetchImpl=fetch, timeoutMs=5500, now=Date.now }={}) {
  const cache=new Map();
  let bytes=0;
  return async function textToSpeech(text,{signal}={}) {
    if(typeof text !== 'string' || !text.trim() || text.length>200) throw Object.assign(new Error('Giọng đọc cần đoạn văn từ 1 đến 200 ký tự.'),{status:400});
    text=text.trim();
    const cached=cache.get(text);
    if(cached && cached.expires>now()) return cached.audio;
    if(cached) {bytes-=cached.audio.length;cache.delete(text);}
    const response=await fetchImpl('https://translate.google.com/translate_tts?'+new URLSearchParams({ie:'UTF-8',tl:'vi',client:'tw-ob',q:text}),{
      signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
      headers:{'User-Agent':'Mozilla/5.0'},
    });
    if(!response.ok || !/^audio\//i.test(response.headers.get('content-type') || '')) throw Object.assign(new Error('Dịch vụ giọng đọc tạm thời không khả dụng.'),{status:502});
    const audio=Buffer.from(await response.arrayBuffer());
    if(!audio.length || audio.length>256*1024) throw Object.assign(new Error('Dữ liệu giọng đọc không hợp lệ.'),{status:502});
    while(cache.size>=64 || bytes+audio.length>4*1024*1024) {const first=cache.keys().next().value;bytes-=cache.get(first).audio.length;cache.delete(first);}
    cache.set(text,{audio,expires:now()+300000});bytes+=audio.length;
    return audio;
  };
}

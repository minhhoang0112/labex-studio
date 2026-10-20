export const VOICE_RATE_KEY = 'labex.voice.rate';
export function clampSpeechRate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0.75, Math.min(2, number)) : 1.25;
}
export function savedSpeechRate() {
  try { return clampSpeechRate(localStorage.getItem(VOICE_RATE_KEY) || 1.25); }
  catch { return 1.25; }
}
export function cleanForSpeech(text = '') {
  return String(text).replace(/```[\s\S]*?```/g, ' Đoạn mã được hiển thị trên màn hình. ')
    .replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[\s#>*-]+/gm, '').replace(/[*_~]/g, '').replace(/\s+/g, ' ').trim();
}
// Keep each TTS request below the upstream limit, without dropping the rest.
export function speechChunks(text, limit = 170) {
  const chunks = [];
  let remaining = cleanForSpeech(text);
  while (remaining.length > limit) {
    const head = remaining.slice(0, limit + 1);
    const sentence = Math.max(head.lastIndexOf('. '), head.lastIndexOf('? '), head.lastIndexOf('! '), head.lastIndexOf('; '));
    const space = head.lastIndexOf(' ');
    const cut = sentence >= 45 ? sentence + 1 : space > 0 ? space : limit;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export function createSpeechPlayer({ makeAudio = url => new Audio(url), synthesis = globalThis.speechSynthesis,
  makeUtterance = text => new SpeechSynthesisUtterance(text), rate = savedSpeechRate(), setTimer=setTimeout, clearTimer=clearTimeout } = {}) {
  let generation = 0, current = null, pending = null, utterance = null, settle = null;
  let speed = clampSpeechRate(rate);
  function disposeAudio(audio) {
    if (!audio) return;
    audio.onended = audio.onerror = audio.onplaying = null;
    audio.pause(); audio.removeAttribute('src'); audio.load();
  }
  function stop() {
    generation++;
    const speaking=utterance;
    if(speaking) speaking.onstart=speaking.onend=speaking.onerror=null;
    settle?.(); settle = null;
    disposeAudio(current); disposeAudio(pending); current = pending = null;
    utterance=null;
    if (speaking) synthesis?.cancel();
  }
  function setRate(value) {
    speed = clampSpeechRate(value);
    if (current) current.playbackRate = speed;
    if (pending) pending.playbackRate = speed;
    // Native voices take the new rate on the next sentence.
  }
  function prepare(text) {
    const audio = makeAudio('/api/ai/tts?text=' + encodeURIComponent(text));
    audio.preload = 'auto'; audio.playbackRate = speed; audio.preservesPitch = true;
    audio.load();
    return audio;
  }
  async function speak(text, { onPlaying = () => {} } = {}) {
    stop();
    const run = generation;
    const chunks = speechChunks(text);
    if (!chunks.length) return;
    pending = prepare(chunks[0]);
    for (let index = 0; index < chunks.length && run === generation; index++) {
      current = pending;
      pending = index + 1 < chunks.length ? prepare(chunks[index + 1]) : null;
      const audio = current;
      try {
        await new Promise((resolve, reject) => {
          let timer;
          let finished=false;
          const finish = error => { if(finished) return; finished=true; clearTimer(timer); settle = null; if(error) reject(error); else resolve(); };
          settle = () => finish();
          timer = setTimer(() => finish(new Error('Không tải được giọng đọc trong thời gian chờ.')), 7000);
          audio.onplaying = () => {
            clearTimer(timer);
            timer=setTimer(()=>finish(new Error('Giọng đọc bị gián đoạn.')),Math.min(45000,Math.max(15000,chunks[index].length*160/speed+6000)));
            onPlaying();
          };
          audio.onended = () => finish();
          audio.onerror = () => finish(new Error('Dịch vụ giọng đọc chưa phản hồi.'));
          Promise.resolve(audio.play()).catch(finish);
        });
      } catch (error) {
        disposeAudio(audio);
        if (run !== generation) return;
        const voice = synthesis?.getVoices().find(item => /^vi(?:-|$)/i.test(item.lang));
        if (!voice) { stop(); throw error; }
        await new Promise((resolve, reject) => {
          let finished=false;
          const timer=setTimer(()=>finish(new Error('Giọng đọc của trình duyệt bị gián đoạn.')),45000);
          const finish=error=>{
            if(finished) return; finished=true; clearTimer(timer); settle=null;
            if(utterance){utterance.onend=utterance.onerror=null;if(error)synthesis.cancel();utterance=null;}
            if(error) reject(error);else resolve();
          };
          utterance = makeUtterance(chunks[index]); utterance.lang = 'vi-VN'; utterance.voice = voice; utterance.rate = speed;
          settle = ()=>finish();
          utterance.onstart = onPlaying;
          utterance.onend = () => finish();
          utterance.onerror = () => finish(new Error('Không phát được giọng đọc.'));
          synthesis.speak(utterance);
        }).catch(error=>{stop();throw error;});
      } finally { disposeAudio(audio); if (current === audio) current = null; }
    }
  }
  return { speak, stop, pause:stop, setRate };
}

export const recognitionErrorMessage = code => ({
  'not-allowed': 'Mic đang bị chặn. Cho phép Microphone ở biểu tượng cạnh địa chỉ trang rồi bấm Thử lại mic.',
  'service-not-allowed': 'Dịch vụ nhận giọng nói bị trình duyệt chặn. Kiểm tra quyền mic hoặc thử Chrome/Edge.',
  'audio-capture': 'Không thu được mic. Kiểm tra mic mặc định và quyền Microphone trong Windows.',
  'network': 'Dịch vụ nhận giọng nói của trình duyệt mất kết nối. Kiểm tra mạng rồi thử lại mic.',
  'language-not-supported': 'Trình duyệt chưa nhận được tiếng Việt. Thử Chrome/Edge với ngôn ngữ vi-VN.',
}[code] || 'Không khởi động được nhận giọng nói. Hãy thử lại mic.');

// Mutable session owns browser callbacks; none capture an old React render.
export function createVoiceSession({ makeRecognition, chat, speaker, onChange, context = () => ({}),
  setTimer = setTimeout, clearTimer = clearTimeout, silenceMs = 650, requestMs = 22000 }) {
  let open = false, muted = false, phase = 'idle', recognition = null, timer = null, restart = null;
  let request = null, revision = 0, history = [], persona = 'tutor', networkErrors = 0;
  const emit = patch => { if (patch.phase) phase = patch.phase; if (open) onChange(patch); };
  function stopRecognition() {
    clearTimer(timer); clearTimer(restart); timer = restart = null;
    const old = recognition; recognition = null;
    if (old) { old.onresult = old.onend = old.onerror = old.onstart = null; try { old.abort(); } catch {} }
  }
  function scheduleListen(delay = 180) {
    clearTimer(restart);
    if (open && !muted && !['thinking','speaking'].includes(phase)) restart = setTimer(listen, delay);
  }
  function listen() {
    if (!open || muted || request || phase === 'speaking' || recognition) return;
    clearTimer(restart); restart = null;
    let engine;
    try { engine = makeRecognition(); }
    catch { emit({phase:'idle', error:recognitionErrorMessage('service-not-allowed')}); return; }
    recognition = engine;
    let spoken = '', submitted = false, terminalError = false;
    engine.lang = 'vi-VN'; engine.continuous = false; engine.interimResults = true;
    const current = () => open && recognition === engine && !muted;
    const submit = () => {
      if (!current() || submitted || !spoken.trim()) return;
      submitted = true;
      stopRecognition();
      void send(spoken.trim());
    };
    engine.onstart = () => { if (current()) emit({phase:'listening', transcript:''}); };
    engine.onresult = event => {
      if (!current() || submitted) return;
      spoken = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim();
      emit({transcript:spoken});
      clearTimer(timer);
      // Final result can be submitted immediately; onend and timer share a latch.
      if (event.results.length && event.results[event.results.length - 1].isFinal) submit();
      else if (spoken) timer = setTimer(submit, silenceMs);
    };
    engine.onerror = event => {
      if (!current()) return;
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      terminalError = true; stopRecognition();
      emit({phase:'idle', error:recognitionErrorMessage(event.error)});
      // Network retries are bounded; permission/device failures require a user action.
      if (event.error === 'network' && networkErrors++ < 1) scheduleListen(1200);
    };
    engine.onend = () => {
      if (!current() || terminalError || submitted) return;
      if (spoken) { submit(); return; }
      recognition = null; emit({phase:'idle'}); scheduleListen();
    };
    try { emit({phase:'connecting'}); engine.start(); }
    catch { stopRecognition(); emit({phase:'idle', error:recognitionErrorMessage('audio-capture')}); }
  }
  async function send(text) {
    if (!open || muted || request || !text) return;
    stopRecognition(); speaker.stop();
    const run = ++revision, controller = new AbortController(); request = controller;
    const previous = history.slice(-6);
    history = [...history, {role:'user',content:text}];
    emit({phase:'thinking', transcript:'', lastUserSpeech:text, aiSpeechText:'', error:'', notice:''});
    let expired = false;
    const deadline = setTimer(() => { expired = true; controller.abort(); }, requestMs);
    try {
      const data = await chat({message:text, persona, context:{...context(), isVoiceMode:true}, history:previous}, controller.signal);
      if (!open || run !== revision || controller.signal.aborted) return;
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('AI trả về câu trả lời trống.');
      networkErrors = 0;
      history = [...history, {role:'assistant',content:data.reply}].slice(-12);
      request = null; clearTimer(deadline);
      emit({phase:'speaking', aiSpeechText:data.reply, notice:data.notice || '', mode:data.mode, audioPreparing:true});
      try { await speaker.speak(data.reply, {onPlaying:()=>{ if (run === revision && open) emit({audioPreparing:false}); }}); }
      catch { if (run === revision && open) {speaker.stop();emit({error:'Không phát được âm thanh. Câu trả lời vẫn ở phụ đề; bấm Đọc lại để thử.'});} }
      if (run === revision && open) { emit({phase:'idle', audioPreparing:false}); scheduleListen(200); }
    } catch (error) {
      if (!open || run !== revision) return;
      emit({phase:'idle', error:expired ? 'AI trả lời quá thời gian chờ. Mic đã nghe được câu của bạn; hãy thử gửi lại.' : `Không lấy được câu trả lời AI: ${error.message || 'kiểm tra kết nối backend'}`});
      scheduleListen(500);
    } finally { clearTimer(deadline); if (request === controller) request = null; }
  }
  function interrupt() {
    if (!open) return;
    revision++; request?.abort(); request = null; speaker.stop(); stopRecognition();
    emit({phase:'idle', transcript:'', audioPreparing:false});
    if (!muted) listen();
  }
  function setMuted(value) {
    muted = Boolean(value); emit({muted});
    if (muted) { stopRecognition(); if (phase !== 'thinking' && phase !== 'speaking') emit({phase:'idle'}); }
    else if (!['thinking','speaking'].includes(phase)) listen();
  }
  function close() {
    open = false; revision++; request?.abort(); request = null;
    stopRecognition(); speaker.stop(); phase = 'idle';
  }
  async function replay(text) {
    if (!open || !text) return;
    revision++; request?.abort(); request=null; stopRecognition(); speaker.stop();
    const run=revision;
    emit({phase:'speaking',audioPreparing:true});
    try {await speaker.speak(text,{onPlaying:()=>{if(open && run===revision) emit({audioPreparing:false});}});}
    catch {if(open && run===revision) {speaker.stop();emit({error:'Không phát được giọng đọc. Bạn vẫn có thể đọc phụ đề.'});}}
    if(open && run===revision) {emit({phase:'idle',audioPreparing:false});scheduleListen();}
  }
  function start(nextPersona = 'tutor', previous = []) {
    close(); open = true; muted = false; persona = nextPersona; history = previous.slice(-12); networkErrors = 0;
    emit({phase:'idle', muted:false, transcript:'', lastUserSpeech:history.findLast(item=>item.role==='user')?.content || '', aiSpeechText:history.at(-1)?.role==='assistant' ? history.at(-1).content : '', error:'', notice:''}); listen();
  }
  return { start, close, interrupt, setMuted, listen, send, replay, getHistory:()=>history.slice() };
}

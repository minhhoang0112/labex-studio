import { useEffect, useRef, useState } from 'react';
import { savedSpeechRate, clampSpeechRate, VOICE_RATE_KEY } from '../lib/speechPlayer';

const initial={phase:'idle',muted:false,transcript:'',lastUserSpeech:'',aiSpeechText:'',error:'',notice:'',micLevel:0,micName:'',connected:false,textSending:false,textError:''};
export default function useVoiceCall({isOpen,persona,lab,currentStep,lastTerminalOutput}) {
  const [state,setState]=useState(initial),[rate,setRate]=useState(savedSpeechRate),[attempt,setAttempt]=useState(0);
  const session=useRef(null),latest=useRef(null),rateRef=useRef(rate);
  const lessonId=lab?.id,stepId=currentStep?.id;
  useEffect(()=>{latest.current={lab,currentStep,lastTerminalOutput};},[lab,currentStep,lastTerminalOutput]);
  useEffect(()=>{
    if(!isOpen)return;
    let disposed=false,stopped=false,stream,ctx,source,node,ws,ready=false,playing=false,complete=false,suppressed=false,responding=false;
    let input='',output='',newInput=true,newOutput=true,drainTimer,connectTimer,interruptedTurn=false;
    let pendingText;
    const update=patch=>{if(!disposed)setState(value=>({...value,...patch}));};
    const send=message=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(message));};
    function release(){
      if(stopped)return;stopped=true;ready=false;clearTimeout(connectTimer);clearTimeout(drainTimer);
      if(pendingText){clearTimeout(pendingText.timer);pendingText.resolve(false);pendingText=null;}
      if(node){node.port.onmessage=null;node.onprocessorerror=null;node.disconnect();}source?.disconnect();
      stream?.getTracks().forEach(track=>{track.onended=null;track.stop();});
      void ctx?.close().catch(()=>{});ws?.close();
    }
    function fail(message){if(stopped || disposed)return;update({phase:'idle',error:message,micLevel:0,micName:'',notice:'',connected:false,textSending:false});release();}
    function clearPlayback(){node?.port.postMessage({type:'clear'});playing=false;clearTimeout(drainTimer);}
    const control={
      setRate:value=>node?.port.postMessage({type:'rate',rate:value}),
      setMuted:muted=>{stream?.getAudioTracks().forEach(track=>{track.enabled=!muted;});node?.port.postMessage({type:'mute',muted});if(muted)send({type:'pause'});update({muted,micLevel:0});},
      interrupt:()=>{if(!ready || stopped || disposed)return;suppressed=responding;clearPlayback();update({phase:'listening'});},
      sendText:value=>{
        const text=typeof value==='string' ? value.trim() : '';
        if(!text || text.length>4000){update({textError:'Nhập tin nhắn từ 1 đến 4000 ký tự.'});return Promise.resolve(false);}
        if(!ready || stopped || disposed || ws?.readyState!==WebSocket.OPEN){update({textError:'Cuộc gọi chưa kết nối. Hãy chờ hoặc kết nối lại.'});return Promise.resolve(false);}
        if(pendingText)return Promise.resolve(false);
        if(ws.bufferedAmount>64000){update({textError:'Đường truyền đang nghẽn. Tin nhắn chưa được gửi.'});return Promise.resolve(false);}
        const id=crypto.randomUUID();
        return new Promise(resolve=>{
          pendingText={id,text,resolve,timer:setTimeout(()=>{
            if(pendingText?.id!==id)return;
            pendingText=null;update({textSending:false,textError:'Chưa nhận được xác nhận gửi. Nội dung vẫn được giữ để bạn kiểm tra trước khi gửi lại.'});resolve(false);
          },8000)};
          clearPlayback();newOutput=true;newInput=true;complete=false;input='';output='';
          update({textSending:true,textError:'',phase:'thinking'});
          try{send({type:'text',id,text});}catch{
            clearTimeout(pendingText.timer);pendingText=null;update({textSending:false,textError:'Không gửi được tin nhắn. Hãy kết nối lại.'});resolve(false);
          }
        });
      },
    };
    session.current=control;
    async function begin(){
      setState({...initial,phase:'connecting'});
      if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)return fail('Microphone cần localhost hoặc HTTPS. Mở http://localhost:5000.');
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
        if(disposed){stream.getTracks().forEach(track=>track.stop());return;}
        const track=stream.getAudioTracks()[0];update({micName:track?.label || 'Microphone mặc định'});
        if(track)track.onended=()=>fail('Microphone đã ngắt kết nối. Kiểm tra thiết bị rồi kết nối lại.');
        ctx=new AudioContext();await ctx.resume();if(disposed || stopped)return;
        await ctx.audioWorklet.addModule('/audio/live-voice-worklet.js');if(disposed || stopped)return;
        node=new AudioWorkletNode(ctx,'live-voice',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
        node.onprocessorerror=()=>fail('Bộ xử lý âm thanh đã dừng. Hãy kết nối lại cuộc gọi.');
        node.port.postMessage({type:'rate',rate:rateRef.current});
        source=ctx.createMediaStreamSource(stream);source.connect(node);node.connect(ctx.destination);
        node.port.onmessage=({data})=>{
          if(disposed || stopped)return;
          if(data.type==='capture'){
            update({micLevel:Math.min(1,data.level*5)});
            // Always send mic while playing/thinking, so the model hears interruptions.
            if(ready && ws.bufferedAmount<64000){
              const bytes=new Uint8Array(data.pcm);let text='';for(const byte of bytes)text+=String.fromCharCode(byte);
              send({type:'audio',data:btoa(text)});
            }else if(ready)fail('Đường truyền mic quá chậm. Hãy kết nối lại.');
          }
          if(data.type==='playing'){playing=true;clearTimeout(drainTimer);update({phase:'speaking'});}
          if(data.type==='drained'){playing=false;clearTimeout(drainTimer);drainTimer=setTimeout(()=>{if(!playing)update({phase:complete?'listening':'thinking'});},150);}
          if(data.type==='overflow')fail('Âm thanh bị dồn quá nhiều. Hãy kết nối lại.');
        };
        ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws/ai/live`);
        connectTimer=setTimeout(()=>fail('Kết nối AI quá thời gian chờ. Hãy thử lại.'),17000);
        ws.onopen=()=>{
          const {lab:lesson={},currentStep:step={},lastTerminalOutput:terminal=''}=latest.current || {};
          send({type:'start',persona,context:{labId:lesson?.id,labTitle:lesson?.title_vi || lesson?.title,stepTitle:step?.title_vi || step?.title,
            task:step?.task_vi || step?.task,content:String(step?.content_vi || step?.content || '').slice(0,2500),terminalOutput:String(terminal).slice(-1200)}});
        };
        ws.onmessage=({data})=>{
          if(stopped || disposed)return;
          let msg;try{msg=JSON.parse(data);}catch{return fail('Dữ liệu âm thanh không hợp lệ.');}
          if(msg.type==='ready'){ready=true;clearTimeout(connectTimer);update({phase:'listening',connected:true,notice:'Thoại trực tiếp · mic luôn nghe, có thể nói chen vào.'});}
          if((msg.type==='text-sent' || msg.type==='text-error') && pendingText?.id===msg.id){
            const pending=pendingText;pendingText=null;clearTimeout(pending.timer);
            const sent=msg.type==='text-sent';
            if(sent){update({lastUserSpeech:pending.text,transcript:'',textSending:false,textError:''});}
            else update({textSending:false,textError:msg.message || 'Tin nhắn chưa được gửi.',phase:'listening'});
            pending.resolve(sent);
          }
          if(msg.type==='error')return fail(msg.message);
          if(msg.type==='notice')update({notice:msg.message});
          const content=msg.content;if(!content)return;
          // The last transcription can share a packet with interrupted: append it
          // to the old answer before opening the next answer's caption window.
          if(content.outputTranscription?.text && !suppressed){if(newOutput){output='';newOutput=false;}output+=content.outputTranscription.text;update({aiSpeechText:output,transcript:''});}
          if(content.interrupted){clearPlayback();suppressed=false;responding=false;interruptedTurn=true;newOutput=true;complete=true;update({phase:'listening',aiSpeechText:output ? `${output} …` : ''});}
          if(content.inputTranscription?.text){if(newInput){input='';newInput=false;}input+=content.inputTranscription.text;update({transcript:input,lastUserSpeech:input});}
          if(!content.interrupted && !suppressed){
            for(const part of content.modelTurn?.parts || []){
              if(part.inlineData?.data && /^audio\/pcm/.test(part.inlineData.mimeType || '')){
                const rateMatch=/rate=(\d+)/.exec(part.inlineData.mimeType);
                if(rateMatch && Number(rateMatch[1])!==24000)return fail('Dịch vụ trả tốc độ âm thanh chưa được hỗ trợ.');
                if(!responding)newInput=true;
                complete=false;responding=true;const binary=atob(part.inlineData.data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
                node.port.postMessage({type:'audio',pcm:bytes.buffer},[bytes.buffer]);
              }
            }
          }
          if(content.turnComplete){complete=true;responding=false;if(!interruptedTurn){newInput=true;update({transcript:''});}interruptedTurn=false;newOutput=true;suppressed=false;if(!playing)update({phase:'listening'});}
        };
        ws.onerror=()=>fail('Không kết nối được AI thoại trực tiếp. Kiểm tra backend và mạng.');
        ws.onclose=()=>{if(!stopped && !disposed)fail('Cuộc gọi đã ngắt. Bấm Kết nối lại để tiếp tục.');};
      }catch(error){if(disposed)return;fail(error.name==='NotAllowedError'?'Chưa được cấp quyền mic. Cho phép Microphone ở cạnh địa chỉ trang rồi kết nối lại.':error.name==='NotFoundError'?'Không tìm thấy microphone. Kiểm tra thiết bị trong Windows.':'Không mở được âm thanh. Kiểm tra microphone, loa và tải lại trang.');}
    }
    void begin();
    return()=>{disposed=true;release();if(session.current===control)session.current=null;};
  },[isOpen,persona,attempt,lessonId,stepId]);
  function changeRate(value){const speed=clampSpeechRate(value);rateRef.current=speed;setRate(speed);session.current?.setRate(speed);try{localStorage.setItem(VOICE_RATE_KEY,String(speed));}catch{}}
  return {...state,rate,setRate:changeRate,setMuted:value=>session.current?.setMuted(value),interrupt:()=>session.current?.interrupt(),
    sendText:value=>session.current?.sendText(value) || Promise.resolve(false),retry:()=>setAttempt(value=>value+1)};
}

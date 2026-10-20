// Capture and render on the audio thread: mic continues while the model speaks.
class LiveVoiceProcessor extends AudioWorkletProcessor {
  constructor() {
    super(); this.queue=[];this.offset=0;this.buffered=0;this.rate=1.25;
    this.capture=new Int16Array(512);this.captured=0;this.sum=0;this.samples=0;this.clock=0;
    this.muted=false;this.playing=false;this.energy=0;
    this.port.onmessage=({data})=>{
      if(data.type==='audio'){
        const pcm=new Int16Array(data.pcm);
        if(this.buffered+pcm.length>24000*60){this.port.postMessage({type:'overflow'});return;}
        this.queue.push(pcm);this.buffered+=pcm.length;
      }
      if(data.type==='clear'){this.queue=[];this.buffered=0;this.offset=0;this.playing=false;}
      if(data.type==='rate')this.rate=data.rate;
      if(data.type==='mute'){this.muted=data.muted;this.captured=0;this.energy=0;this.sum=0;this.samples=0;this.clock=0;}
    };
  }
  process(inputs,outputs) {
    const input=inputs[0]?.[0],out=outputs[0][0];
    for(let i=0;i<out.length;i++){
      // Averaging resampler supports native 44.1/48 kHz devices, 16 kHz transport.
      if(input && !this.muted){
        this.sum+=input[i] || 0;this.samples++;this.clock+=16000;
        if(this.clock>=sampleRate){
          this.clock-=sampleRate;const value=Math.max(-1,Math.min(1,this.sum/this.samples));
          this.capture[this.captured++]=Math.round(value*32767);this.energy+=value*value;
          this.sum=0;this.samples=0;
          if(this.captured===512){
            const pcm=this.capture;this.port.postMessage({type:'capture',pcm:pcm.buffer,level:Math.sqrt(this.energy/512)},[pcm.buffer]);
            this.capture=new Int16Array(512);this.captured=0;this.energy=0;
          }
        }
      }
      if(this.queue.length){
        if(!this.playing){this.playing=true;this.port.postMessage({type:'playing'});}
        const front=this.queue[0];const index=Math.floor(this.offset);
        out[i]=(front[index] || 0)/32768;
        this.offset+=24000/sampleRate*this.rate;
        while(this.queue.length && this.offset>=this.queue[0].length){
          const consumed=this.queue.shift().length;this.offset-=consumed;this.buffered-=consumed;
        }
      }else{
        out[i]=0;
        if(this.playing){this.playing=false;this.offset=0;this.port.postMessage({type:'drained'});}
      }
    }
    return true;
  }
}
registerProcessor('live-voice',LiveVoiceProcessor);

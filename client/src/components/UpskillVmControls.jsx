import {useEffect,useRef,useState} from 'react';
import {api} from '../lib/api';
export default function UpskillVmControls({onChange,connected=false,checking=false}) {
  const [status,setStatus]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const latest=useRef({onChange,connected,checking});latest.current={onChange,connected,checking};
  const retryUntil=useRef(0),wasRunning=useRef(false);
  useEffect(()=>{
    let alive=true,pending=false;
    const refresh=async()=>{
      if(pending)return;pending=true;
      try {
        const s=await api('/api/upskill/vm/status');if(!alive)return;
        setStatus(s);
        if(s.running&&!wasRunning.current)retryUntil.current=Date.now()+120000;
        wasRunning.current=s.running;
        if(s.running&&!latest.current.connected&&!latest.current.checking&&Date.now()<retryUntil.current)latest.current.onChange();
      }catch{}finally{pending=false;}
    };
    refresh();const timer=setInterval(refresh,5000);
    return()=>{alive=false;clearInterval(timer);};
  },[]);
  async function power(action){
    if(action==='stop'&&!window.confirm('Tắt Ubuntu lab riêng? Terminal sẽ ngắt, dữ liệu đĩa được giữ. Lưu công việc trong VM trước khi tắt.'))return;
    setBusy(true);setError('');
    try{setStatus(await api('/api/upskill/vm/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm:true})}));retryUntil.current=action==='start'?Date.now()+120000:0;onChange();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <div className="flex flex-wrap items-center gap-2 text-xs" data-upskill-controls>
    <span>{status?.running?connected?'Ubuntu lab · SSH đã sẵn sàng':'Ubuntu lab đang bật · đang chờ SSH':'Ubuntu lab đang tắt/chưa sẵn sàng'}</span>
    <button disabled={!status?.configured||busy||status?.busy} onClick={()=>power(status?.running?'stop':'start')} className="rounded border border-slate-600 px-2 py-1 disabled:opacity-40">{busy?'Đang xử lý…':status?.running?'Tắt Ubuntu lab':'Bật Ubuntu lab'}</button>
    <button onClick={onChange} className="rounded border border-slate-600 px-2 py-1">Kiểm tra kết nối</button>
    {status?.running&&!connected&&<span className="text-amber-200">Web tự thử kết nối trong 2 phút. Không cần mở VMware.</span>}
    {error&&<span role="alert" className="text-red-300">{error}</span>}
  </div>;
}

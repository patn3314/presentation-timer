(() =>{
  /* ---------------- 便利関数 ---------------- */
  const $ = id => document.getElementById(id);
  const fmt = s => String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  const buildSelect = (sel,max) =>{
    for(let i=0;i<=max;i++){
      const opt=document.createElement('option');
      opt.value=i;opt.textContent=String(i).padStart(2,'0');
      sel.appendChild(opt);
    }
  };

  /* ---------------- DOM取得 ---------------- */
  const timerEl   = $('timer');
  const selMode   = $('sel-mode');
  const initMin   = $('init-min'), initSec = $('init-sec');
  const b1m=$('b1-min'), b1s=$('b1-sec');
  const b2m=$('b2-min'), b2s=$('b2-sec');
  const b3m=$('b3-min'), b3s=$('b3-sec');

  const btnStart=$('btn-start'), btnPause=$('btn-pause'), btnReset=$('btn-reset');
  const btnTheme=$('btn-theme'), btnFull=$('btn-full'), btnFloat=$('btn-float');
  const audioBell=$('audio-bell');

  /* ---------------- セレクト初期化 ---------------- */
  [initMin,initSec,b1m,b1s,b2m,b2s,b3m,b3s].forEach(sel=>{
    buildSelect(sel,59);
  });

  /* ---------------- 状態 ---------------- */
  let cur=0, timerID=null;
  const events=[];          // {time, count, fired}
  const ch = new BroadcastChannel('timer_channel'); // 他ウインドウと同期用

  /* ---------------- イベント登録 ---------------- */
  function setEvents(){
    events.length=0;                      // clear
    [[b1m,b1s,1],[b2m,b2s,2],[b3m,b3s,3]].forEach(([mSel,sSel,count])=>{
      const t=Number(mSel.value)*60+Number(sSel.value);
      if(t>0) events.push({time:t,count,fired:false});
    });
    events.sort((a,b)=>a.time-b.time);
  }

  /* ---------------- ベル処理 ---------------- */
  function ring(count){
    for(let i=0;i<count;i++){
      setTimeout(()=>{audioBell.currentTime=0;audioBell.play();},i*900);
    }
    timerEl.classList.add('bell'+count);
    setTimeout(()=>timerEl.classList.remove('bell1','bell2','bell3'),2500);
  }

  /* ---------------- 1秒タスク ---------------- */
  function tick(){
    if(selMode.value==='down'){
      if(cur<=0){stop();return;}
      cur--;
    }else{cur++;}
    timerEl.textContent=fmt(cur);

    events.forEach(ev=>{
      if(!ev.fired && cur>=ev.time){
        ev.fired=true; ring(ev.count);
      }
    });
    ch.postMessage({type:'update',cur});
  }

  /* ---------------- 操作関数 ---------------- */
  const start = () =>{
    if(timerID) return;
    setEvents();
    cur = (selMode.value==='down')
          ? Number(initMin.value)*60+Number(initSec.value)
          : 0;
    timerEl.textContent=fmt(cur);
    events.forEach(e=>e.fired=false);
    timerID=setInterval(tick,1000);
    ch.postMessage({type:'start',cur,mode:selMode.value,events});
  };
  const stop = () =>{
    clearInterval(timerID);timerID=null;
    ch.postMessage({type:'pause'});
  };
  const reset=()=>{
    stop();
    cur = (selMode.value==='down')
          ? Number(initMin.value)*60+Number(initSec.value):0;
    timerEl.textContent=fmt(cur);
    timerEl.classList.remove('bell1','bell2','bell3');
    events.forEach(e=>e.fired=false);
    ch.postMessage({type:'reset',cur});
  };

  /* ---------------- ボタン ---------------- */
  btnStart.onclick=start;
  btnPause.onclick=stop;
  btnReset.onclick=reset;

  btnTheme.onclick=()=>{
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
  };
  btnFull.onclick=()=>{
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen();
    }else{document.exitFullscreen();}
  };
  btnFloat.onclick=()=>{
    // すでにフローティング画面なら元に戻す
    if(document.body.classList.contains('floating')){
      document.body.classList.remove('floating');
      return;
    }
    // 新しい小窓を開く
    window.open(location.pathname+'?floating=1','timerFloat',
      'width=400,height=200,menubar=no,toolbar=no');
  };

  /* ---------------- BroadcastChannel 受信 ---------------- */
  ch.onmessage = e=>{
    const msg=e.data;
    if(location.search.includes('floating')){ // 浮遊窓は受信専用
      if(msg.type==='update'){timerEl.textContent=fmt(msg.cur);}
      else if(msg.type==='reset'){timerEl.textContent=fmt(msg.cur);}
    }
  };

  /* ---------------- 初期描画 ---------------- */
  if(location.search.includes('floating')) document.body.classList.add('floating');
  reset();
})();
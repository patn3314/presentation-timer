(() => {
  // 要素
  const timerEl     = document.getElementById('timer');
  const inSec       = document.getElementById('input-seconds');
  const modeSel     = document.getElementById('mode-select');
  const evtTimeIn   = document.getElementById('event-time');
  const evtBellSel  = document.getElementById('event-bell-count');
  const btnAddEvt   = document.getElementById('btn-add-event');
  const evtListEl   = document.getElementById('event-list');
  const btnStart    = document.getElementById('btn-start');
  const btnPause    = document.getElementById('btn-pause');
  const btnReset    = document.getElementById('btn-reset');
  const btnFs       = document.getElementById('btn-fullscreen');
  const btnTheme    = document.getElementById('btn-theme');
  const btnFloat    = document.getElementById('btn-floating');
  const audioBell   = document.getElementById('audio-bell');

  let originSec   = 0;
  let currentSec  = 0;
  let timerId     = null;
  let events      = []; // {time, count, fired}

  // mm:ss → 秒
  function parseTime(str) {
    const [m, s] = str.split(':').map(v=>parseInt(v,10));
    if (isNaN(m)||isNaN(s)) return null;
    return m*60 + s;
  }
  // 秒 → mm:ss
  function fmtTime(s) {
    const m = Math.floor(s/60);
    const ss= s%60;
    return String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
  }

  // イベントリスト再描画
  function renderEvents() {
    events.sort((a,b)=>a.time-b.time);
    evtListEl.innerHTML = '';
    events.forEach((ev,i)=>{
      const li = document.createElement('li');
      li.textContent = `${fmtTime(ev.time)} → ${ev.count}ベル`;
      const btn = document.createElement('button');
      btn.textContent = '×';
      btn.onclick = ()=>{
        events.splice(i,1);
        renderEvents();
      };
      li.appendChild(btn);
      evtListEl.appendChild(li);
    });
  }

  // ベル再生
  function playBell(count) {
    for (let i=0; i<count; i++){
      setTimeout(()=>{
        audioBell.currentTime = 0;
        audioBell.play();
      }, i*1000);
    }
  }
  // 色変化
  function changeColor(count) {
    const cls = 'timer-bell'+count;
    timerEl.classList.add(cls);
    const dur = (count-1)*1000 + 2000;
    setTimeout(()=>{
      timerEl.classList.remove('timer-bell1','timer-bell2','timer-bell3');
    }, dur);
  }

  // 毎秒処理
  function tick() {
    if (modeSel.value === 'countdown') {
      if (currentSec<=0) {
        clearInterval(timerId);
        timerId=null;
        return;
      }
      currentSec--;
    } else {
      currentSec++;
    }
    timerEl.textContent = fmtTime(currentSec);

    // 実行済みフラグのないイベントをチェック
    events.forEach(ev=>{
      if (!ev.fired && currentSec >= ev.time) {
        ev.fired = true;
        playBell(ev.count);
        changeColor(ev.count);
      }
    });
  }

  // ボタンクリック群
  btnAddEvt.addEventListener('click', ()=>{
    const t = parseTime(evtTimeIn.value);
    const c = parseInt(evtBellSel.value,10);
    if (t===null) { alert('時刻をMM:SSの形式で入力してください'); return; }
    events.push({time:t,count:c,fired:false});
    renderEvents();
    evtTimeIn.value='';
  });

  btnStart.addEventListener('click', ()=>{
    if (timerId) return;
    originSec  = parseInt(inSec.value,10);
    currentSec = modeSel.value==='countdown'? originSec : 0;
    events.forEach(ev=>ev.fired=false);
    timerEl.textContent = fmtTime(currentSec);
    timerId = setInterval(tick,1000);
  });

  btnPause.addEventListener('click', ()=>{
    if (timerId) clearInterval(timerId);
    timerId = null;
  });

  btnReset.addEventListener('click', ()=>{
    if (timerId) clearInterval(timerId);
    timerId = null;
    originSec  = parseInt(inSec.value,10);
    currentSec = modeSel.value==='countdown'? originSec : 0;
    events.forEach(ev=>ev.fired=false);
    timerEl.textContent = fmtTime(currentSec);
    timerEl.classList.remove('timer-bell1','timer-bell2','timer-bell3');
  });

  btnFs.addEventListener('click', ()=>{
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  btnTheme.addEventListener('click', ()=>{
    document.body.classList.toggle('light');
    document.body.classList.toggle('dark');
  });

  btnFloat.addEventListener('click', ()=>{
    document.body.classList.toggle('floating');
  });

  // 初期表示
  originSec  = parseInt(inSec.value,10);
  currentSec = originSec;
  timerEl.textContent = fmtTime(currentSec);
})();
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

  // タブ関連の要素
  const tabTimer = $('tab-timer');
  const tabSettings = $('tab-settings');
  const timerTabContent = $('timer-tab');
  const settingsTabContent = $('settings-tab');

  /* ---------------- セレクト初期化 ---------------- */
  [initMin,initSec,b1m,b1s,b2m,b2s,b3m,b3s].forEach(sel=>{
    buildSelect(sel,59);
  });

  /* ---------------- 状態 ---------------- */
  let cur=0, timerID=null;
  const events=[];          // {time, count, fired}
  const ch = new BroadcastChannel('timer_channel'); // 他ウインドウと同期用
  let lastTriggeredBell = 0; // 最後に鳴らしたベルの種類を記録

  /* ---------------- イベント登録 ---------------- */
  function setEvents(){
    events.length=0;                      // clear
    [[b1m,b1s,1],[b2m,b2s,2],[b3m,b3s,3]].forEach(([mSel,sSel,count])=>{
      const t=Number(mSel.value)*60+Number(sSel.value);
      if(t>0) events.push({time:t,count,fired:false});
    });
    events.sort((a,b)=>a.time-b.time);
  }

  /* ---------------- ベル設定文字列生成 ---------------- */
  function getBellSettingsText() {
    const bellSettings = [];
    [[b1m,b1s,1],[b2m,b2s,2],[b3m,b3s,3]].forEach(([mSel,sSel,count])=>{
      const min = Number(mSel.value);
      const sec = Number(sSel.value);
      if(min > 0 || sec > 0) {
        bellSettings.push(`\${count}回目: \${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`);
      }
    });
    return bellSettings.length > 0 ? bellSettings.join(' / ') : "ベル設定なし";
  }

  /* ---------------- ベル処理 ---------------- */
  function ring(count){
    // 前回のベルの色を削除
    timerEl.classList.remove('bell1','bell2','bell3');
    
    // 現在のベル色を設定
    timerEl.classList.add('bell'+count);
    lastTriggeredBell = count;
    
    // 音を鳴らす (確実に再生されるよう修正)
    for(let i=0;i<count;i++){
      setTimeout(() => {
        const bellSound = new Audio('audio/bell.mp3');
        bellSound.play().catch(e => console.error('Bell sound failed:', e));
      }, i*900);
    }
  }

  /* ---------------- 1秒タスク ---------------- */
  function tick(){
    if(selMode.value==='down'){
      if(cur<=0){stop();return;}
      cur--;
    }else{cur++;}
    timerEl.textContent=fmt(cur);

    events.forEach(ev=>{
      if(!ev.fired && 
         ((selMode.value==='down' && cur<=ev.time) || 
          (selMode.value==='up' && cur>=ev.time))){
        ev.fired=true; 
        ring(ev.count);
      }
    });
    ch.postMessage({
      type:'update',
      cur,
      lastBell:lastTriggeredBell,
      bellSettings: getBellSettingsText()
    });
  }

  /* ---------------- 操作関数 ---------------- */
  const start = () =>{
    if(timerID) return;
    setEvents();
    cur = (selMode.value==='down')
          ? Number(initMin.value)*60+Number(initSec.value)
          : 0;
    timerEl.textContent=fmt(cur);
    timerEl.classList.remove('bell1','bell2','bell3');
    lastTriggeredBell = 0;
    events.forEach(e=>e.fired=false);
    timerID=setInterval(tick,1000);
    ch.postMessage({
      type:'start',
      cur,
      mode:selMode.value,
      events,
      bellSettings: getBellSettingsText()
    });
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
    lastTriggeredBell = 0;
    events.forEach(e=>e.fired=false);
    ch.postMessage({
      type:'reset',
      cur,
      bellSettings: getBellSettingsText()
    });
  };

  /* ---------------- タブ切り替え ---------------- */
  function switchTab(tab) {
    // 全てのタブとコンテンツから active クラスを削除
    tabTimer.classList.remove('active');
    tabSettings.classList.remove('active');
    timerTabContent.classList.remove('active');
    settingsTabContent.classList.remove('active');
    
    // 選択されたタブと対応するコンテンツに active クラスを追加
    if (tab === 'timer') {
      tabTimer.classList.add('active');
      timerTabContent.classList.add('active');
    } else if (tab === 'settings') {
      tabSettings.classList.add('active');
      settingsTabContent.classList.add('active');
    }
  }

  /* ---------------- フローティングウィンドウへベル設定を表示 ---------------- */
  function updateBellInfoDisplay(bellSettingsText) {
    if (location.search.includes('floating')) {
      let bellInfo = document.querySelector('.bell-info');
      
      if (!bellInfo) {
        bellInfo = document.createElement('div');
        bellInfo.className = 'bell-info';
        document.querySelector('main').appendChild(bellInfo);
      }
      
      bellInfo.textContent = bellSettingsText;
    }
  }

  /* ---------------- ボタン ---------------- */
  btnStart.onclick=start;
  btnPause.onclick=stop;
  btnReset.onclick=reset;

  // タブ切替ボタン
  tabTimer.onclick = () => switchTab('timer');
  tabSettings.onclick = () => switchTab('settings');

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
    const floatWindow = window.open(location.pathname+'?floating=1','timerFloat',
      'width=600,height=300,menubar=no,toolbar=no');
    
    // フローティングウィンドウが開いたら、ベル設定情報を送信
    if (floatWindow) {
      floatWindow.addEventListener('load', () => {
        ch.postMessage({
          type: 'init-float',
          bellSettings: getBellSettingsText()
        });
      });
    }
  };

  /* ---------------- BroadcastChannel 受信 ---------------- */
  ch.onmessage = e => {
    const msg = e.data;
    
    if (location.search.includes('floating')) { // 浮遊窓は受信専用
      if (msg.type === 'update' || msg.type === 'start' || msg.type === 'init-float' || msg.type === 'reset') {
        // タイマー時間を更新
        if (msg.cur !== undefined) {
          timerEl.textContent = fmt(msg.cur);
        }
        
        // ベル色を同期
        timerEl.classList.remove('bell1', 'bell2', 'bell3');
        if (msg.lastBell > 0) {
          timerEl.classList.add('bell' + msg.lastBell);
        }
        
        // ベル設定情報を表示
        if (msg.bellSettings) {
          updateBellInfoDisplay(msg.bellSettings);
        }
      }
    }
  };

  /* ---------------- 初期描画 ---------------- */
  // 初期描画部分に追加
if (location.search.includes('floating')) {
  document.body.classList.add('floating');
  document.body.classList.add('font-normal'); // デフォルトのフォントサイズクラス
  
  // タブナビゲーションを隠す
  const tabNav = document.querySelector('.tab-nav');
  if (tabNav) tabNav.style.display = 'none';
  
  // フォントサイズ変更ボタンを表示
  const fontControls = document.querySelector('.font-size-controls');
  if (fontControls) {
    fontControls.style.display = 'flex';
    
    // フォントサイズボタンにイベントリスナーを設定
    const fontBtns = document.querySelectorAll('.font-size-btn');
    fontBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const size = this.getAttribute('data-size');
        // 既存のフォントサイズクラスを削除
        document.body.classList.remove('font-small', 'font-normal', 'font-large');
        // 選択されたサイズクラスを追加
        document.body.classList.add('font-' + size);
        
        // 設定を保存（セッションストレージ）
        sessionStorage.setItem('preferred-font-size', size);
      });
    });
    
    // 保存された設定があれば復元
    const savedSize = sessionStorage.getItem('preferred-font-size');
    if (savedSize) {
      document.body.classList.remove('font-small', 'font-normal', 'font-large');
      document.body.classList.add('font-' + savedSize);
    }
  }
}
  
  reset();
})();
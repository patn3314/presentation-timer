(() =>{
  /* ---------------- 便利関数 ---------------- */
  const $ = id => document.getElementById(id);
  const fmt = s => String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  const buildSelect = (sel,max) =>{
    for(let i=0;i<=max;i++){
      const opt=document.createElement("option");
      opt.value=i;opt.textContent=String(i).padStart(2,"0");
      sel.appendChild(opt);
    }
  };

  /* ---------------- DOM取得 ---------------- */
  const timerEl   = $("timer");
  const selMode   = $("sel-mode");
  const initMin   = $("init-min"), initSec = $("init-sec");
  const b1m=$("b1-min"), b1s=$("b1-sec");
  const b2m=$("b2-min"), b2s=$("b2-sec");
  const b3m=$("b3-min"), b3s=$("b3-sec");

  const btnStart=$("btn-start"), btnPause=$("btn-pause"), btnReset=$("btn-reset");
  const btnTheme=$("btn-theme"), btnFull=$("btn-full"), btnFloat=$("btn-float");
  const audioBell=$("audio-bell"); // Ensure this element exists in HTML if used directly for playback control

  const tabTimer = $("tab-timer");
  const tabSettings = $("tab-settings");
  const timerTabContent = $("timer-tab");
  const settingsTabContent = $("settings-tab");

  /* ---------------- セレクト初期化 ---------------- */
  [initMin,initSec,b1m,b1s,b2m,b2s,b3m,b3s].forEach(sel=>{
    buildSelect(sel,59);
  });

  /* ---------------- 状態 ---------------- */
  let cur=0, timerID=null;
  const events=[];
  const ch = new BroadcastChannel("timer_channel");
  let lastTriggeredBell = 0;

  /* ---------------- イベント登録 ---------------- */
  function setEvents(){
    events.length=0;
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
        bellSettings.push(`${count}回目: ${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`);
      }
    });
    return bellSettings.length > 0 ? bellSettings.join(" / ") : "ベル設定なし";
  }

  /* ---------------- ベル処理 ---------------- */
  function ring(count){
    timerEl.classList.remove("bell1","bell2","bell3");
    timerEl.classList.add("bell"+count);
    lastTriggeredBell = count;
    
    // AudioContextを使用して再生の信頼性を向上
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // ユーザーインタラクション後にAudioContextを再開
    const resumeAudio = () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("touchstart", resumeAudio);
    };
    document.addEventListener("click", resumeAudio);
    document.addEventListener("touchstart", resumeAudio);

    for(let i=0;i<count;i++){
      setTimeout(() => {
        // 新しいAudioインスタンスを作成する代わりに、既存のaudioBell要素を再利用するか、
        // またはAudioBufferSourceNodeを使用してより制御された再生を行う
        const source = audioCtx.createBufferSource();
        fetch("assets/bell.mp3") // HTML内のaudio要素のsrcと一致させる
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
          .then(audioBuffer => {
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start();
          })
          .catch(e => console.error("Bell sound failed:", e));
      }, i * 1000); // 間隔を1秒に調整
    }
  }

  /* ---------------- 1秒タスク ---------------- */
  function tick(){
    if(selMode.value==="down"){
      if(cur<=0){stop();timerEl.textContent=fmt(0); return;}
      cur--;
    }else{cur++;}
    timerEl.textContent=fmt(cur);

    events.forEach(ev=>{
      if(!ev.fired && 
         ((selMode.value==="down" && cur===ev.time) || // 等価比較に変更
          (selMode.value==="up" && cur===ev.time))){
        ev.fired=true; 
        ring(ev.count);
      }
    });
    ch.postMessage({
      type:"update",
      cur,
      mode: selMode.value, // モードも送信
      lastBell:lastTriggeredBell,
      bellSettings: getBellSettingsText(),
      events: events // eventsも送信してフローティングウィンドウで利用
    });
  }

  /* ---------------- 操作関数 ---------------- */
  const start = () =>{
    if(timerID) return;
    setEvents(); // スタート時にイベントを再設定
    if(selMode.value==="down"){
        cur = Number(initMin.value)*60+Number(initSec.value);
        if (cur === 0 && events.length > 0 && events[0].time === 0) { // 0秒開始のダウンカウントで0秒ベル
            // 0秒のベルを即座に鳴らす
            const zeroSecBell = events.find(ev => ev.time === 0);
            if(zeroSecBell && !zeroSecBell.fired){
                ring(zeroSecBell.count);
                zeroSecBell.fired = true;
            }
        }
    } else {
        cur = 0;
        if (events.length > 0 && events[0].time === 0) { // 0秒開始のアップカウントで0秒ベル
             const zeroSecBell = events.find(ev => ev.time === 0);
            if(zeroSecBell && !zeroSecBell.fired){
                ring(zeroSecBell.count);
                zeroSecBell.fired = true;
            }
        }
    }

    timerEl.textContent=fmt(cur);
    timerEl.classList.remove("bell1","bell2","bell3");
    lastTriggeredBell = 0;
    // events.forEach(e=>e.fired=false); // スタート時にfiredをリセットするのはsetEvents内で行うか、ここで行うか一貫性を持つ
    timerID=setInterval(tick,1000);
    btnStart.disabled = true;
    btnPause.disabled = false;
    ch.postMessage({
      type:"start",
      cur,
      mode:selMode.value,
      events,
      bellSettings: getBellSettingsText()
    });
  };
  const stop = () =>{
    clearInterval(timerID);timerID=null;
    btnStart.disabled = false;
    btnPause.disabled = true;
    ch.postMessage({type:"pause"});
  };
  const reset=()=>{
    stop();
    // デフォルトモードをカウントアップに設定
    // selMode.value = "up"; // この行は初期化時に移動
    cur = (selMode.value==="down")
          ? Number(initMin.value)*60+Number(initSec.value):0;
    timerEl.textContent=fmt(cur);
    timerEl.classList.remove("bell1","bell2","bell3");
    lastTriggeredBell = 0;
    setEvents(); // リセット時にもイベントをクリアし再設定
    events.forEach(e=>e.fired=false); // リセット時にfiredをfalseに
    btnStart.disabled = false;
    btnPause.disabled = true;
    updateBellInfoDisplay(getBellSettingsText()); // メインウィンドウのベル情報も更新
    ch.postMessage({
      type:"reset",
      cur,
      mode: selMode.value,
      events,
      bellSettings: getBellSettingsText()
    });
  };

  /* ---------------- タブ切り替え ---------------- */
  function switchTab(tab) {
    tabTimer.classList.remove("active");
    tabSettings.classList.remove("active");
    timerTabContent.classList.remove("active");
    settingsTabContent.classList.remove("active");
    
    if (tab === "timer") {
      tabTimer.classList.add("active");
      timerTabContent.classList.add("active");
    } else if (tab === "settings") {
      tabSettings.classList.add("active");
      settingsTabContent.classList.add("active");
    }
  }

  /* ---------------- フローティングウィンドウへベル設定を表示 ---------------- */
  function updateBellInfoDisplay(bellSettingsText) {
    let bellInfo = document.querySelector(".bell-info");
    if (location.search.includes("floating")) {
      if (!bellInfo) {
        bellInfo = document.createElement("div");
        bellInfo.className = "bell-info";
        // タイマー表示要素の後にベル情報を挿入
        timerEl.parentNode.insertBefore(bellInfo, timerEl.nextSibling);
      }
      bellInfo.textContent = bellSettingsText;
    } else {
        // メインウィンドウにもベル情報表示用の要素があれば更新 (なければ作成)
        let mainBellInfo = $("main-bell-info"); // 仮のID
        if (!mainBellInfo) {
            mainBellInfo = document.createElement("div");
            mainBellInfo.id = "main-bell-info";
            mainBellInfo.className = "bell-info"; // スタイルを共用
            // 設定タブ内など、適切な場所に挿入
            const controlsSection = document.querySelector(".controls");
            if(controlsSection) controlsSection.appendChild(mainBellInfo);
        }
        mainBellInfo.textContent = bellSettingsText;
    }
  }
  
  // 設定変更時にもベル情報を更新
  [selMode, initMin, initSec, b1m, b1s, b2m, b2s, b3m, b3s].forEach(el => {
      el.addEventListener("change", () => {
          setEvents(); // イベントも更新
          updateBellInfoDisplay(getBellSettingsText());
          // ブロードキャストしてフローティングウィンドウも更新
          ch.postMessage({
              type: "settings_change",
              bellSettings: getBellSettingsText(),
              events: events,
              mode: selMode.value,
              initTime: Number(initMin.value)*60+Number(initSec.value)
          });
      });
  });

  /* ---------------- ボタン ---------------- */
  btnStart.onclick=start;
  btnPause.onclick=stop;
  btnReset.onclick=reset;
  btnPause.disabled = true; // 初期状態ではPauseを無効化

  tabTimer.onclick = () => switchTab("timer");
  tabSettings.onclick = () => switchTab("settings");

  btnTheme.onclick=()=>{
    document.body.classList.toggle("dark");
    // bodyにlightクラスがなければ追加、あれば削除（darkとlightは排他的にしたい場合）
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("light");
    } else {
        document.body.classList.add("light");
    }
  };
  btnFull.onclick=()=>{
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }else{document.exitFullscreen();}
  };
  btnFloat.onclick=()=>{
    if(document.body.classList.contains("floating")){
      // メインウィンドウに戻る動作は通常ユーザーがウィンドウを閉じることで行う
      // window.close(); // フローティングウィンドウ自身を閉じる場合
      return;
    }
    const floatWindow = window.open(location.pathname+"?floating=1", "timerFloat",
      "width=450,height=250,menubar=no,toolbar=no,resizable=yes,scrollbars=no"); // サイズ調整、リサイズ可能に
    
    // フローティングウィンドウに初期値を渡す
    if (floatWindow) {
      floatWindow.onload = () => { // onloadを使用
        ch.postMessage({
          type: "init-float",
          cur: cur, // 現在のタイマー時間も渡す
          mode: selMode.value,
          events: events,
          lastBell: lastTriggeredBell,
          bellSettings: getBellSettingsText()
        });
      };
    }
  };

  /* ---------------- BroadcastChannel 受信 ---------------- */
  ch.onmessage = e => {
    const msg = e.data;
    if (location.search.includes("floating")) { 
      if (msg.type === "update" || msg.type === "start" || msg.type === "reset" || msg.type === "init-float" || msg.type === "settings_change") {
        if (msg.cur !== undefined) timerEl.textContent = fmt(msg.cur);
        if (msg.mode !== undefined) selMode.value = msg.mode; // モードも同期
        
        timerEl.classList.remove("bell1", "bell2", "bell3");
        if (msg.lastBell > 0) timerEl.classList.add("bell" + msg.lastBell);
        
        if (msg.bellSettings) updateBellInfoDisplay(msg.bellSettings);
        
        // eventsも同期 (フローティングウィンドウ側では主に表示に使う)
        if (msg.events) {
            // eventsの内容をフローティングウィンドウ側のevents変数にコピーするか、
            // 直接利用する。ここでは表示更新のみなので、getBellSettingsTextが
            // メインウィンドウのDOMに依存している場合、msg.bellSettingsを使うのが安全。
        }
      }
    } else { // メインウィンドウ側の処理 (フローティングからのメッセージなど)
        if (msg.type === "float_closed") {
            // フローティングウィンドウが閉じたことを検知した場合の処理など
        }
    }
  };

  /* ---------------- 初期描画・設定 ---------------- */
  function initializeTimer() {
    selMode.value = "up"; // デフォルトをカウントアップに設定
    document.body.classList.add("dark"); // デフォルトテーマをダークに
    // document.body.classList.remove("light"); // lightクラスがあれば削除

    if (location.search.includes("floating")) {
      document.body.classList.add("floating");
      const tabNav = document.querySelector(".tab-nav");
      if (tabNav) tabNav.style.display = "none";
      const headerButtons = document.querySelector(".header-buttons");
      if(headerButtons) {
          // フローティングウィンドウでは不要なボタンを隠す (例: 再度フローティングボタン)
          const floatBtnInFloat = headerButtons.querySelector("#btn-float");
          if(floatBtnInFloat) floatBtnInFloat.style.display = "none";
          const helpBtnInFloat = headerButtons.querySelector("#btn-help");
          if(helpBtnInFloat) helpBtnInFloat.style.display = "none";
      }
      // フローティングウィンドウが開いたときにメインウィンドウに通知して初期値をもらう
      // ch.postMessage({ type: "request_init_data_for_float" });
      // → init-floatで対応するので上記は不要
    } else {
        // メインウィンドウの初期化
        switchTab("timer"); // 初期タブをタイマーに
    }
    reset(); // selMode.valueの変更を反映させるためにresetを呼ぶ
    updateBellInfoDisplay(getBellSettingsText()); // 初期ベル情報表示
  }

  // DOMContentLoadedを待って初期化
  document.addEventListener("DOMContentLoaded", initializeTimer);

})();

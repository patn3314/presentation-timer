(() => {
  // 要素取得
  const timerEl   = document.getElementById('timer');
  const inSec     = document.getElementById('input-seconds');
  const modeSel   = document.getElementById('mode-select');
  const bellSel   = document.getElementById('bell-count');
  const btnStart  = document.getElementById('btn-start');
  const btnPause  = document.getElementById('btn-pause');
  const btnReset  = document.getElementById('btn-reset');
  const btnFs     = document.getElementById('btn-fullscreen');
  const btnTheme  = document.getElementById('btn-theme');
  const audioBell = document.getElementById('audio-bell');

  let timerId   = null;
  let originSec = 0;
  let currentSec= 0;

  // 時刻フォーマット mm:ss
  function formatTime(s) {
    const m = Math.floor(s/60);
    const ss= s%60;
    return String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
  }

  // 表示更新
  function updateDisplay() {
    timerEl.textContent = formatTime(currentSec);
  }

  // ベル再生（t=0,1s,2s… のタイミングで再生）
  function playBell(count) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        audioBell.currentTime = 0;
        audioBell.play();
      }, i * 1000);
    }
  }

  // 色変化（チャイム終了タイミングで戻す）
  function changeColor(count) {
    const cls = 'timer-bell' + count;
    timerEl.classList.add(cls);
    // 最終再生終了 = (count-1)*1000ms + 2000ms
    const dur = (count - 1) * 1000 + 2000;
    setTimeout(() => {
      timerEl.classList.remove('timer-bell1','timer-bell2','timer-bell3');
    }, dur);
  }

  // 1秒ごとの処理
  function tick() {
    if (modeSel.value === 'countdown') {
      if (currentSec <= 0) {
        clearInterval(timerId);
        timerId = null;
        playBell(+bellSel.value);
        changeColor(+bellSel.value);
        return;
      }
      currentSec--;
    } else {
      currentSec++;
      if (currentSec === originSec) {
        playBell(+bellSel.value);
        changeColor(+bellSel.value);
      }
    }
    updateDisplay();
  }

  // ボタンイベント
  btnStart.addEventListener('click', () => {
    if (timerId) return;
    originSec  = parseInt(inSec.value,10);
    currentSec = modeSel.value === 'countdown' ? originSec : 0;
    updateDisplay();
    timerId = setInterval(tick, 1000);
  });

  btnPause.addEventListener('click', () => {
    if (timerId) clearInterval(timerId);
    timerId = null;
  });

  btnReset.addEventListener('click', () => {
    if (timerId) clearInterval(timerId);
    timerId   = null;
    originSec = parseInt(inSec.value,10);
    currentSec= modeSel.value === 'countdown' ? originSec : 0;
    updateDisplay();
    timerEl.classList.remove('timer-bell1','timer-bell2','timer-bell3');
  });

  // 全画面切替
  btnFs.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // テーマ切替
  btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('light');
    document.body.classList.toggle('dark');
  });

  // 初期表示
  originSec  = parseInt(inSec.value,10);
  currentSec = originSec;
  updateDisplay();

})();
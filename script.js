document.addEventListener('DOMContentLoaded', function() {
    // 要素の取得
    const timeDisplay = document.getElementById('time');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const countdownBtn = document.getElementById('countdown-btn');
    const countupBtn = document.getElementById('countup-btn');
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const bell1Input = document.getElementById('bell1');
    const bell2Input = document.getElementById('bell2');
    const bell3Input = document.getElementById('bell3');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // 音声ファイル
    const bellSound = new Audio('https://soundbible.com/mp3/service-bell_daniel_simion.mp3');
    
    // タイマー変数
    let timer = null;
    let isRunning = false;
    let isCountdown = true;
    let totalSeconds = 0;
    let initialTotalSeconds = 0;
    let bell1Time = 0;
    let bell2Time = 0;
    let bell3Time = 0;
    
    // 時間表示の更新
    function updateDisplay(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        timeDisplay.textContent = [
            h.toString().padStart(2, '0'),
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].join(':');
        
        // 時間に応じて色を変更
        updateTimerColor(seconds);
    }
    
    // 時間表示の色を更新
    function updateTimerColor(seconds) {
        if (isCountdown) {
            // カウントダウン時の色変更
            if (seconds <= bell1Time && seconds > 0) {
                timeDisplay.style.color = 'var(--timer-danger)';
            } else if (seconds <= bell2Time) {
                timeDisplay.style.color = 'var(--timer-warning)';
            } else {
                timeDisplay.style.color = 'var(--timer-normal)';
            }
        } else {
            // カウントアップ時の色変更
            if (seconds >= bell3Time && bell3Time > 0) {
                timeDisplay.style.color = 'var(--timer-danger)';
            } else if (seconds >= bell2Time && bell2Time > 0) {
                timeDisplay.style.color = 'var(--timer-warning)';
            } else {
                timeDisplay.style.color = 'var(--timer-normal)';
            }
        }
    }
    
    // ベル通知の設定更新
    function updateBellSettings() {
        // 分を秒に変換
        bell1Time = parseInt(bell1Input.value) * 60;
        bell2Time = parseInt(bell2Input.value) * 60;
        bell3Time = parseInt(bell3Input.value) * 60;
    }
    
    // タイマーの初期化
    function initializeTimer() {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        totalSeconds = hours * 3600 + minutes * 60 + seconds;
        initialTotalSeconds = totalSeconds;
        
        updateDisplay(totalSeconds);
        updateBellSettings();
    }
    
    // タイマーの開始
    function startTimer() {
        if (isRunning) return;
        
        if (!timer) {
            updateBellSettings();
            
            // カウントダウン時は入力値から開始、カウントアップ時は0から開始
            if (isCountdown) {
                totalSeconds = initialTotalSeconds;
            } else {
                totalSeconds = 0;
            }
        }
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timer = setInterval(function() {
            if (isCountdown) {
                // ベルの通知チェック（カウントダウン）
                checkBellsCountdown();
                
                // 時間を減らす
                totalSeconds--;
                
                // 時間切れの場合
                if (totalSeconds < 0) {
                    playBell(3);  // 3ベルを鳴らす
                    clearInterval(timer);
                    timer = null;
                    isRunning = false;
                    totalSeconds = 0;
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                }
            } else {
                // 時間を増やす
                totalSeconds++;
                
                // ベルの通知チェック（カウントアップ）
                checkBellsCountup();
            }
            
            updateDisplay(totalSeconds);
        }, 1000);
    }
    
    // ベルの通知（カウントダウン）
    function checkBellsCountdown() {
        if (totalSeconds === bell1Time) {
            playBell(1);
        } else if (totalSeconds === bell2Time) {
            playBell(2);
        } else if (totalSeconds === bell3Time) {
            playBell(3);
        }
    }
    
    // ベルの通知（カウントアップ）
    function checkBellsCountup() {
        if (totalSeconds === bell1Time) {
            playBell(1);
        } else if (totalSeconds === bell2Time) {
            playBell(2);
        } else if (totalSeconds === bell3Time) {
            playBell(3);
        }
    }
    
    // ベルを鳴らす
    function playBell(count) {
        // ベルの回数分鳴らす
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                bellSound.currentTime = 0;
                bellSound.play();
            }, i * 500);
        }
    }
    
    // タイマーの一時停止
    function pauseTimer() {
        if (timer) {
            clearInterval(timer);
            isRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }
    
    // タイマーのリセット
    function resetTimer() {
        pauseTimer();
        timer = null;
        initializeTimer();
    }
    
    // 全画面表示の切替
    function toggleFullscreen() {
        const container = document.querySelector('.container');
        
        if (!document.fullscreenElement) {
            // 全画面表示に切り替え
            container.requestFullscreen().then(() => {
                container.classList.add('fullscreen');
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> ウィンドウモード';
            }).catch(err => {
                console.error(`全画面表示エラー: ${err.message}`);
            });
        } else {
            // 全画面表示を解除
            document.exitFullscreen().then(() => {
                container.classList.remove('fullscreen');
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> 全画面表示';
            }).catch(err => {
                console.error(`全画面解除エラー: ${err.message}`);
            });
        }
    }
    
    // テーマの切替
    function toggleTheme() {
        const body = document.body;
        const icon = themeToggleBtn.querySelector('i');
        
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            icon.className = 'fas fa-moon';
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            icon.className = 'fas fa-sun';
        }
    }
    
    // タイマーモードの切替
    function setTimerMode(isDown) {
        isCountdown = isDown;
        
        if (isDown) {
            countdownBtn.classList.add('active');
            countupBtn.classList.remove('active');
        } else {
            countdownBtn.classList.remove('active');
            countupBtn.classList.add('active');
        }
        
        resetTimer();
    }
    
    // イベントリスナーの設定
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    themeToggleBtn.addEventListener('click', toggleTheme);
    countdownBtn.addEventListener('click', () => setTimerMode(true));
    countupBtn.addEventListener('click', () => setTimerMode(false));
    
    // ダークモードの初期設定
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        toggleTheme();
    }
    
    // タイマーの初期化
    initializeTimer();
});

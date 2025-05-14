import { useState } from 'react';
import Timer from './components/Timer';
import Settings from './components/Settings';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

export default function App() {
  const [settings, setSettings] = useState(defaultSettings);
  const [running, setRunning]   = useState(false);
  const [key, setKey]           = useState(0); // reset 用 key

  const handleStart = () => setRunning(true);
  const handleStop  = () => setRunning(false);
  const handleReset = () => { setKey(k => k + 1); setRunning(false); };

  return (
    <div className="app">
      <header>
        <h1>Presentation Timer</h1>
        <ThemeToggle />
      </header>

      <Timer
        key={key}          // reset 時に再マウント
        settings={settings}
        running={running}
      />

      <div className="controls">
        {running
          ? <button onClick={handleStop}>Pause</button>
          : <button onClick={handleStart}>Start</button>}
        <button onClick={handleReset}>Reset</button>
      </div>

      <Settings
        settings={settings}
        setSettings={setSettings}
        disabled={running}
      />
    </div>
  );
}

// --------------- 初期設定 ------------------
export interface SettingsType {
  mode: 'countup' | 'countdown';
  totalSec: number;      // カウントダウン時の総時間
  bell1: number;         // 秒
  bell2: number;
  bell3: number;
}

export const defaultSettings: SettingsType = {
  mode: 'countup',
  totalSec: 300, // 5 分
  bell1: 180,    // 3 分
  bell2: 240,    // 4 分
  bell3: 300,    // 5 分
};
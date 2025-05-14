import { useEffect, useRef, useState } from 'react';
import { SettingsType } from '../App';
import bellMp3 from '../assets/bell.mp3';
import './Timer.css';

interface Props {
  settings: SettingsType;
  running: boolean;
}

export default function Timer({ settings, running }: Props) {
  const { mode, totalSec, bell1, bell2, bell3 } = settings;
  const [sec, setSec]           = useState(0);
  const [colorStage, setColorStage] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio(bellMp3));

  // 実際に表示する秒数
  const displaySec =
    mode === 'countdown' ? Math.max(totalSec - sec, 0) : sec;

  // ---------------- tick logic ------------------
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSec(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // ---------------- bell / color ----------------
  useEffect(() => {
    const t = mode === 'countdown' ? totalSec - sec : sec;

    if (t === bell1 || t === bell2 || t === bell3) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    // 色変更
    if      (t >= bell2) setColorStage(0);
    else if (t >= bell3) setColorStage(1);
    else                 setColorStage(2);
  }, [sec, mode, totalSec, bell1, bell2, bell3]);

  // ---------------- format ----------------------
  const mm = String(Math.floor(displaySec / 60)).padStart(2, '0');
  const ss = String(displaySec % 60).padStart(2, '0');

  return (
    <div className={`timer stage-${colorStage}`}>
      {mm}:{ss}
    </div>
  );
}
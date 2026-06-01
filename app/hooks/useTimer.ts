import { useEffect, useRef, useState } from 'react';

interface UseTimerResult {
  seconds: number;
  running: boolean;
  done: boolean;
  started: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  format: () => string;
}

export function useTimer(initialSeconds: number): UseTimerResult {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSeconds(initialSeconds);
    setRunning(false);
    setStarted(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (seconds === 0 && running) setRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  const start = () => { setStarted(true); setRunning(true); };
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setStarted(false); setSeconds(initialSeconds); };
  const format = (): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return { seconds, running, done: started && seconds === 0 && initialSeconds > 0, started, start, pause, reset, format };
}

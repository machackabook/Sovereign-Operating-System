import React, { useState, useEffect } from 'react';

export function AtomicClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    let animationFrameId: number;

    const updateClock = () => {
      // performance.now() gives sub-millisecond precision
      const now = performance.now();
      const date = new Date();
      const seconds = date.getSeconds();
      const milliseconds = date.getMilliseconds();
      const microseconds = Math.floor((now % 1) * 1000);
      const nanoseconds = Math.floor((now % 0.001) * 1000000); // This is just an approximation

      const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}${microseconds.toString().padStart(3, '0')}${nanoseconds.toString().padStart(3, '0')}`;
      
      setTime(timeString);
      animationFrameId = requestAnimationFrame(updateClock);
    };

    updateClock();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="text-xs font-mono text-cyan-400/80">
      {time} ns
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";

export function useTimer(active: boolean) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active]);

  const formatted = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return { secs, formatted };
}

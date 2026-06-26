"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Counts elapsed whole seconds while `active`.
 *
 * By default the value lives in a ref and does NOT re-render on each tick —
 * callers that only need the final time (the play board, which no longer shows
 * a live timer since MOB-UX-1 / WEB-UX-1) read `secsRef.current` / `getFormatted()`
 * at solve time. Previously the per-second setState re-rendered the whole board
 * (all 36 cells) once a second for the entire session.
 *
 * Pass `live: true` to also force a re-render each tick — for the rare consumer
 * that displays the running time (the tutorial), where calling `getFormatted()`
 * in render needs to reflect the latest second.
 */
export function useTimer(active: boolean, live = false) {
  const secsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        secsRef.current += 1;
        if (live) forceTick((t) => t + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, live]);

  const getFormatted = () =>
    `${Math.floor(secsRef.current / 60)}:${String(secsRef.current % 60).padStart(2, "0")}`;

  return { secsRef, getFormatted };
}

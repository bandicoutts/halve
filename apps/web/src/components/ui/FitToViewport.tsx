"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect on the client, useEffect on the server (avoids SSR warning).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface FitToViewportProps {
  children: React.ReactNode;
  /** Lower bound on the scale factor. Below this, content scrolls rather than
   *  shrinking into illegibility. Default 0.6 (≈ a 600px floor for ~800px content). */
  minScale?: number;
  /** Extra vertical space (px) to subtract from the measured available height. */
  reserve?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Scales its content down — never up — so a stacked-content screen fits the
 * available height without scrolling. Mirrors the browser's zoom-to-fit
 * behaviour, but only kicks in when content would actually overflow.
 *
 * Structure: an outer flex frame absorbs the exact available height handed to
 * it by the parent flex column (no hard-coded TopBar math). A sizer collapses
 * its flow height to the *scaled* height so the frame doesn't think content
 * overflows; the inner box keeps its natural layout (so `scrollHeight` is
 * transform-independent) and receives the `transform: scale()`.
 */
export function FitToViewport({
  children,
  minScale = 0.6,
  reserve = 0,
  className,
  style,
}: FitToViewportProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Start at 1 to match the server render (the common tall-viewport case) — no
  // hydration flash. `measured` gates the transition so the first fit doesn't animate.
  const [scale, setScale] = useState(1);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const [measured, setMeasured] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    // Compute synchronously in the observer callback. Our setState only mutates
    // the sizer's height and the inner box's transform — neither resizes an
    // *observed* element (frame / content) — so there's no ResizeObserver loop.
    // (Avoids requestAnimationFrame, which headless browsers throttle when the
    //  page isn't actively painting, leaving resize updates undelivered.)
    const recompute = () => {
      const available = frame.clientHeight - reserve;
      // scrollHeight is the untransformed layout height → no feedback loop.
      const natural = content.scrollHeight;
      if (available <= 0 || natural <= 0) return;
      const next = Math.min(1, Math.max(minScale, available / natural));
      setScale((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
      setNaturalHeight((prev) => (prev !== natural ? natural : prev));
      setMeasured(true);
    };

    const ro = new ResizeObserver(recompute);
    ro.observe(frame);
    ro.observe(content);
    window.addEventListener("resize", recompute);
    recompute();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [minScale, reserve]);

  const scaled = scale < 1;

  return (
    <div
      ref={frameRef}
      className={className}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // If content still overflows at minScale, allow it to scroll rather than clip.
        overflowY: "auto",
        ...style,
      }}
    >
      {/* Sizer: collapses flow height to the scaled height so the frame above
          doesn't see leftover (unscaled) height and offer a scrollbar. */}
      <div
        style={{
          width: "100%",
          height:
            scaled && naturalHeight !== null
              ? naturalHeight * scale
              : undefined,
        }}
      >
        <div
          ref={contentRef}
          style={{
            width: "100%",
            transform: scaled ? `scale(${scale})` : undefined,
            transformOrigin: "top center",
            transition: measured ? "transform 0.15s ease-out" : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

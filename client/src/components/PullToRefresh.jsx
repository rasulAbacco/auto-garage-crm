// client/src/components/PullToRefresh.jsx
// Pull the page down from the very top (touch screens) to reload it – MotorDesk navy theme.
//
//   <PullToRefresh>{page}</PullToRefresh>                 → reloads the page
//   <PullToRefresh onRefresh={async () => load()}>…        → runs your own refresh instead
//
// It stays out of the way when:
//   • the page isn't scrolled to the top
//   • the finger starts inside a popup / dialog, an input, or a box that is itself scrolled
//   • a popup has locked the page scroll
//   • the device has no touch screen (desktop mouse users are unaffected)
// Add data-no-pull-refresh to any element that should never start a pull.
import React, { useEffect, useRef, useState } from "react";
import { RefreshCw, ArrowDown } from "lucide-react";

const MAX_PULL = 130;

export default function PullToRefresh({
  children,
  onRefresh,
  threshold = 72,
  disabled = false,
}) {
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | pulling | ready | refreshing
  const startRef = useRef(null);
  const pullRef = useRef(0);
  const busyRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (disabled || typeof window === "undefined") return undefined;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return undefined;

    // turn off the browser's own pull-to-refresh / bounce so they don't fight ours
    const html = document.documentElement;
    const prevOverscroll = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "contain";

    const setP = (p, ph) => {
      pullRef.current = p;
      setPull(p);
      setPhase(ph);
    };

    const reset = () => {
      busyRef.current = false;
      startRef.current = null;
      setP(0, "idle");
    };

    const blocked = (el) => {
      if (document.body.style.overflow === "hidden") return true; // a popup locked scrolling
      for (
        let n = el;
        n && n !== document.body && n !== html;
        n = n.parentElement
      ) {
        if (
          n.matches?.(
            '[role="dialog"],[role="alertdialog"],[data-no-pull-refresh],input,textarea,select,[contenteditable="true"]',
          )
        )
          return true;
        const s = window.getComputedStyle(n);
        if (s.position === "fixed") return true;
        if (
          (s.overflowY === "auto" || s.overflowY === "scroll") &&
          n.scrollTop > 0
        )
          return true;
      }
      return false;
    };

    const onStart = (e) => {
      if (
        busyRef.current ||
        e.touches.length !== 1 ||
        window.scrollY > 0 ||
        blocked(e.target)
      ) {
        startRef.current = null;
        return;
      }
      startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onMove = (e) => {
      if (!startRef.current || busyRef.current) return;
      const dy = e.touches[0].clientY - startRef.current.y;
      const dx = e.touches[0].clientX - startRef.current.x;

      if (dy <= 0 || window.scrollY > 0) {
        if (pullRef.current) setP(0, "idle");
        return;
      }
      // sideways swipe (e.g. scrolling a table) – let it go
      if (pullRef.current === 0 && Math.abs(dx) > dy) {
        startRef.current = null;
        return;
      }
      if (e.cancelable) e.preventDefault();
      const p = Math.min(MAX_PULL, dy * 0.5); // rubber-band feel
      setP(p, p >= threshold ? "ready" : "pulling");
    };

    const onEnd = async () => {
      if (!startRef.current) return;
      startRef.current = null;
      if (pullRef.current < threshold) {
        setP(0, "idle");
        return;
      }
      busyRef.current = true;
      setP(56, "refreshing");
      if (navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch {
          /* ignore */
        }
      }
      if (!onRefreshRef.current) {
        // small delay so the spinner is seen, then a full reload
        setTimeout(() => window.location.reload(), 250);
        return;
      }
      try {
        await onRefreshRef.current();
      } finally {
        reset();
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", reset);
    return () => {
      html.style.overscrollBehaviorY = prevOverscroll;
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [disabled, threshold]);

  const dragging = phase === "pulling" || phase === "ready";
  const label =
    phase === "refreshing"
      ? "Refreshing…"
      : phase === "ready"
        ? "Release to refresh"
        : "Pull to refresh";
  const progress = Math.min(1, pull / threshold);

  return (
    <>
      {/* indicator under the top bar */}
      <div
        aria-hidden={phase === "idle"}
        role="status"
        className="pointer-events-none fixed inset-x-0 top-14 z-40 flex justify-center lg:top-16"
        style={{
          transform: `translateY(${pull - 52}px)`,
          opacity: phase === "idle" ? 0 : Math.max(0.2, progress),
          transition: dragging
            ? "none"
            : "transform 0.25s ease, opacity 0.25s ease",
        }}
      >
        <div className="flex items-center gap-2 rounded-xl border-2 border-white/10 bg-[#001F3F] px-3 py-2 text-white shadow-2xl shadow-black/30">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[#001F3F]">
            {phase === "refreshing" ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : phase === "ready" ? (
              <RefreshCw
                size={14}
                style={{ transform: `rotate(${pull * 3}deg)` }}
              />
            ) : (
              <ArrowDown
                size={14}
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                  transition: "transform 0.1s",
                }}
              />
            )}
          </span>
          <span className="text-[12px] font-black uppercase tracking-[0.15em]">
            {label}
          </span>
        </div>
      </div>

      {/* page content follows the finger a little */}
      <div
        style={{
          transform: pull ? `translateY(${pull * 0.5}px)` : "none",
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}

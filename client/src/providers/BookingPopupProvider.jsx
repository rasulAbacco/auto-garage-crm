// client/src/providers/BookingPopupProvider.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Capacitor } from "@capacitor/core";
import { useSocket } from "./SocketProvider";

const BookingPopupContext = createContext();
export const useBookingPopup = () => useContext(BookingPopupContext);

// Must match RESPONSE_WINDOW_MS on the server (30s)
const RESPONSE_WINDOW_MS = 30 * 1000;
// Tolerance for small differences between server and phone clocks
const CLOCK_SKEW_MS = 15 * 1000;

const IS_NATIVE = Capacitor.isNativePlatform();
const SEEN_KEY = "md_seen_booking_ids";

// 1-frame silent WAV — used ONLY to unlock audio in desktop/mobile browsers.
// The real alert file is never played until a real booking arrives.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/* ---------- remember which bookings already rang ---------- */
function loadSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function saveSeen(set) {
  try {
    // keep only the last 100 ids
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set].slice(-100)));
  } catch {
    /* ignore */
  }
}

/** Is this booking still inside its 30s response window? */
function isFresh(data) {
  const now = Date.now();
  if (data?.expiresAt) {
    return now < new Date(data.expiresAt).getTime() + CLOCK_SKEW_MS;
  }
  if (data?.createdAt) {
    return (
      now - new Date(data.createdAt).getTime() <
      RESPONSE_WINDOW_MS + CLOCK_SKEW_MS
    );
  }
  // Old server without timestamps → trust live events only
  return true;
}

export default function BookingPopupProvider({ children }) {
  const socket = useSocket();
  const [booking, setBooking] = useState(null);

  const alertAudioRef = useRef(null);
  const stopTimerRef = useRef(null);
  const seenRef = useRef(loadSeen());
  // Native apps (Capacitor) allow playback without a gesture → no unlock needed
  const unlockedRef = useRef(IS_NATIVE);

  const actionListenersRef = useRef([]);

  const onBookingAction = useCallback((fn) => {
    actionListenersRef.current.push(fn);
    return () => {
      actionListenersRef.current = actionListenersRef.current.filter(
        (l) => l !== fn,
      );
    };
  }, []);

  const notifyListeners = useCallback(() => {
    actionListenersRef.current.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.error("BookingPopup listener error:", error);
      }
    });
  }, []);

  /* ---------- audio helpers ---------- */
  const stopAlert = useCallback(() => {
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const audio = alertAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const playAlert = useCallback(
    (durationMs) => {
      const audio = alertAudioRef.current;
      if (!audio || !unlockedRef.current) return;

      stopAlert();
      audio
        .play()
        .catch((e) => console.warn("🔇 Alert playback failed:", e.message));

      // Never ring longer than the booking's response window
      stopTimerRef.current = setTimeout(stopAlert, Math.max(1000, durationMs));
    },
    [stopAlert],
  );

  /* ---------- create audio (never plays here) ---------- */
  useEffect(() => {
    const audio = new Audio("/alert.mp3");
    audio.loop = true;
    audio.preload = "auto";
    alertAudioRef.current = audio;

    return () => {
      clearTimeout(stopTimerRef.current);
      audio.pause();
      alertAudioRef.current = null;
    };
  }, []);

  /* ---------- browser only: unlock with a SILENT clip ---------- */
  useEffect(() => {
    if (IS_NATIVE) return;

    const unlock = () => {
      if (unlockedRef.current) return;
      const silent = new Audio(SILENT_WAV);
      silent
        .play()
        .then(() => {
          unlockedRef.current = true;
          remove();
        })
        .catch(() => {
          /* try again on next tap */
        });
    };
    const remove = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return remove;
  }, []);

  /* ---------- stop ringing when app goes to background ---------- */
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stopAlert();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stopAlert]);

  /* ---------- socket: ring ONLY for a new, still-open booking ---------- */
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (data) => {
      const id = data?.id != null ? String(data.id) : null;

      // Already rang for this one (reconnect / duplicate emit / app reopen)
      if (id && seenRef.current.has(id)) return;

      // Stale event delivered late (e.g. queued while app was in background)
      if (!isFresh(data)) {
        console.log("⏭️ Ignoring expired booking event:", id);
        if (id) {
          seenRef.current.add(id);
          saveSeen(seenRef.current);
        }
        return;
      }

      if (id) {
        seenRef.current.add(id);
        saveSeen(seenRef.current);
      }

      console.log("🔥 NEW BOOKING RECEIVED:", data);
      setBooking(data);

      const remaining = data?.expiresAt
        ? new Date(data.expiresAt).getTime() - Date.now()
        : RESPONSE_WINDOW_MS;
      playAlert(Math.min(remaining, RESPONSE_WINDOW_MS));
    };

    socket.on("new_booking", handleNewBooking);
    return () => socket.off("new_booking", handleNewBooking);
  }, [socket, playAlert]);

  /* ---------- clear (accept / reject / timeout / close) ---------- */
  const clearBooking = useCallback(() => {
    stopAlert();
    setBooking(null);
    notifyListeners();
  }, [stopAlert, notifyListeners]);

  return (
    <BookingPopupContext.Provider
      value={{ booking, clearBooking, onBookingAction, stopAlert }}
    >
      {children}
    </BookingPopupContext.Provider>
  );
}

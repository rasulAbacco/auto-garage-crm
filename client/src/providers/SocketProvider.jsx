// client/src/providers/SocketProvider.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:5001";

/** Only garage owners receive marketplace bookings */
function readGarageId(propId) {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.type && user.type !== "owner") return null; // staff → no booking room
    return propId || localStorage.getItem("userId") || user?.id || null;
  } catch {
    return propId || localStorage.getItem("userId") || null;
  }
}

export default function SocketProvider({ children, garageId }) {
  const [socket, setSocket] = useState(null);
  const joinedRef = useRef(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity, // keep trying (phone sleeps, network changes)
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    // Reads the id at call time → works right after login without an app reload
    const joinGarageRoom = () => {
      const id = readGarageId(garageId);
      if (!id || !s.connected) return;
      s.emit("join_garage", String(id));
      joinedRef.current = String(id);
      console.log("🏠 Joined garage:", id);
    };

    // "connect" fires on first connect AND every reconnect
    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      joinGarageRoom();
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connect error:", err.message);
    });

    s.on("disconnect", (reason) => {
      console.log("⚠️ Socket disconnected:", reason);
      // Server kicked us → reconnect manually (auto-reconnect doesn't cover this)
      if (reason === "io server disconnect") s.connect();
    });

    // App comes back to foreground → make sure we're connected and in the room
    const onVisibility = () => {
      if (document.hidden) return;
      if (!s.connected) s.connect();
      else joinGarageRoom();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Login / logout happened → join the new garage room
    const onLoginChange = () => {
      const id = readGarageId(garageId);
      if (id && String(id) !== joinedRef.current) joinGarageRoom();
    };
    window.addEventListener("storage", onLoginChange);
    const poll = setInterval(onLoginChange, 3000); // same-tab login (no storage event)

    setSocket(s);

    return () => {
      console.log("🧹 Disconnecting socket");
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onLoginChange);
      clearInterval(poll);
      s.disconnect();
    };
  }, [garageId]);

  // Render children immediately; consumers already handle socket === null
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

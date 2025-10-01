// useSocket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function useSocket(onMessageDeleted) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken"); // Use same key as api.js
    if (!token) {
      console.error("❌ No access token found in localStorage");
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    s.on("connect", () => console.log("✅ Socket connected:", s.id));
    s.on("connect_error", (err) => console.error("❌ Socket connect_error:", err.message));
    s.on("disconnect", (reason) => console.warn("⚡ Socket disconnected:", reason));
    s.onAny((event, payload) => {
      console.log("🔹 Socket event received:", event, payload);
    });

    s.on("messageDeleted", ({ messageId }) => {
      console.log("🗑️ Message deleted:", messageId);
      if (typeof onMessageDeleted === "function") onMessageDeleted(messageId);
    });

    // Add errorMessage listener for global errors
    s.on("errorMessage", ({ error }) => {
      console.error("❌ Socket error:", error);
    });

    const originalEmit = s.emit;
    s.emit = function (event, ...args) {
      console.log("🔸 Socket emit:", event, ...args);
      originalEmit.apply(s, [event, ...args]);
    };

    setSocket(s);

    return () => {
      console.log("🛑 Disconnecting socket");
      s.disconnect();
      setSocket(null);
    };
  }, [onMessageDeleted]);

  return socket;
}
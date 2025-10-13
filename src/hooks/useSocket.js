import { useEffect, useState } from "react";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function useSocket(onMessageDeleted, onGroupCreated) {
  const [socket, setSocket] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("useSocket: ❌ No access token available, cannot initialize socket");
      setConnectionError("No access token available");
      return;
    }

    console.log("useSocket: Initializing socket connection to", SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("useSocket: ✅ Socket connected, id:", newSocket.id);
      setConnectionError(null);
    });

    newSocket.on("connect_error", (err) => {
      console.error("useSocket: ❌ Socket connect_error:", err.message);
      setConnectionError(err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("useSocket: ⚡ Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        setConnectionError("Server closed connection");
      }
    });

    newSocket.onAny((event, payload) => {
      console.log("useSocket: 🔹 Socket event received:", event, payload);
    });

    newSocket.on("messageDeleted", ({ messageId }) => {
      console.log("useSocket: 🗑️ Message deleted:", messageId);
      if (typeof onMessageDeleted === "function") onMessageDeleted(messageId);
    });

    newSocket.on("groupCreated", (group) => {
      console.log("useSocket: 🏠 Group created:", group);
      if (typeof onGroupCreated === "function") onGroupCreated(group);
    });

    newSocket.on("errorMessage", ({ error }) => {
      console.error("useSocket: ❌ Socket error:", error);
      setConnectionError(error);
    });

    setSocket(newSocket);

    return () => {
      console.log("useSocket: 🛑 Cleaning up socket listeners");
      newSocket.off("connect");
      newSocket.off("connect_error");
      newSocket.off("disconnect");
      newSocket.off("messageDeleted");
      newSocket.off("errorMessage");
      newSocket.off("groupCreated");
      newSocket.offAny();
      newSocket.disconnect();
      setSocket(null);
    };
  }, [onMessageDeleted, onGroupCreated]);

  return { socket, connectionError };
}
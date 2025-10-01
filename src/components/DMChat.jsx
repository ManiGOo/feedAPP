import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import api from "../utils/api.js";
import MessageItem from "./MessageItem.jsx";

export default function DMChat({ user, otherUser, socket, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState("");

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch conversation
  useEffect(() => {
    if (!otherUser?.id) return;
    setLoading(true);
    api
      .getOrCreateDMConversation(otherUser.id)
      .then(setMessages)
      .catch(() => setError("Failed to load conversation"))
      .finally(() => setLoading(false));
  }, [otherUser]);

  // Socket: join & listen
  useEffect(() => {
    if (!socket || !otherUser?.id) return;

    socket.emit("joinDM", Number(otherUser.id));

    const handleDM = (msg) => {
      if (msg.sender_id === Number(otherUser.id) || msg.sender_id === Number(user.id)) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.tempId === msg.tempId);
          const updatedMsg = { ...msg, isOwn: msg.sender_id === Number(user.id) };
          if (exists) return prev.map((m) => (m.tempId === msg.tempId ? updatedMsg : m));
          return [...prev, updatedMsg];
        });
        if (onNewMessage) onNewMessage(msg);
      }
    };

    socket.on("dmMessage", handleDM);
    return () => socket.off("dmMessage", handleDM);
  }, [socket, otherUser, user.id, onNewMessage]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!content.trim() || !socket) return;

    const tempId = uuidv4();
    const msgData = { to: Number(otherUser.id), content, tempId };
    socket.emit("sendDM", msgData);

    const optimisticMsg = {
      id: tempId,
      tempId,
      sender_id: Number(user.id),
      recipient_id: Number(otherUser.id),
      content,
      created_at: new Date().toISOString(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (onNewMessage) onNewMessage(optimisticMsg);
    setContent("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading chat...
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b dark:border-gray-700 font-semibold text-center text-gray-900 dark:text-gray-100">
        {otherUser.username}
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
      >
        {/* Wrap messages in a div */}
        <div className="flex flex-col">
          {messages.map((msg) => (
            <MessageItem key={msg.tempId || msg.id} message={msg} currentUser={user} />
          ))}
          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <button
          onClick={sendMessage}
          className="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}

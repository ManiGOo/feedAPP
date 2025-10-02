import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import api from "../utils/api.js";
import MessageItem from "./MessageItem.jsx";

export default function DMChat({ user, otherUser, socket, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const BOTTOM_NAV_HEIGHT = 72; // height of BottomNav in px
  const INPUT_HEIGHT = 56; // approximate input area height

  // Fetch conversation
  useEffect(() => {
    if (!otherUser?.id) return;
    setLoading(true);
    api
      .getOrCreateDMConversation(otherUser.id)
      .then(setMessages)
      .catch(() => console.error("Failed to load conversation"))
      .finally(() => setLoading(false));
  }, [otherUser]);

  // Socket listener
  useEffect(() => {
    if (!socket || !otherUser?.id) return;

    socket.emit("joinDM", Number(otherUser.id));

    const handleDM = (msg) => {
      if (msg.sender_id === Number(otherUser.id) || msg.sender_id === Number(user.id)) {
        setMessages((prev) => [...prev, { ...msg, isOwn: msg.sender_id === Number(user.id) }]);
        if (onNewMessage) onNewMessage(msg);
      }
    };

    socket.on("dmMessage", handleDM);
    return () => socket.off("dmMessage", handleDM);
  }, [socket, otherUser, user.id, onNewMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="relative flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b dark:border-gray-700 font-semibold text-center">
        {otherUser.username}
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ paddingBottom: INPUT_HEIGHT + BOTTOM_NAV_HEIGHT + 16 }} // extra spacing
      >
        {messages.map((msg) => (
          <MessageItem key={msg.tempId || msg.id} message={msg} currentUser={user} />
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input - fixed above BottomNav */}
      <div
        className="absolute left-0 w-full flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        style={{ bottom: BOTTOM_NAV_HEIGHT }}
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}

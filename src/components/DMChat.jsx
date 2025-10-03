import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import api from "../utils/api.js";
import MessageItem from "./MessageItem.jsx";
import MessageInput from "./MessageInput.jsx";

export default function DMChat({ user, otherUser, socket, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content) => {
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

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ marginBottom: "5%" }} // ensures messages aren't hidden under BottomNav
      >
        {messages.map((msg) => (
          <MessageItem key={msg.tempId || msg.id} message={msg} currentUser={user} />
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* MessageInput */}
      <MessageInput sendMessage={sendMessage} />
    </div>
  );
}

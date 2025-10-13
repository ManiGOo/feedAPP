import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import api from "../utils/api.js";
import { useMessageContext } from "../context/MessageContext.jsx";
import MessageItem from "./MessageItem.jsx";
import MessageInput from "./MessageInput.jsx";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function DMChat() {
  const { user, activeChat, socket, connectionError, isMobile, setSidebarOpen, onNewMessage, setActiveChat } = useMessageContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const otherUser = { id: activeChat?.id, username: activeChat?.username };

  useEffect(() => {
    if (!otherUser?.id) {
      console.log("DMChat: No otherUser.id, skipping fetch");
      setLoading(false);
      return;
    }
    console.log("DMChat: Fetching messages for user:", otherUser.id);
    setLoading(true);
    api
      .getOrCreateDMConversation(otherUser.id)
      .then((data) => {
        console.log("DMChat: Messages loaded:", data);
        setMessages(data);
      })
      .catch((err) => console.error("DMChat: Failed to load conversation:", err))
      .finally(() => {
        console.log("DMChat: Loading complete");
        setLoading(false);
      });
  }, [otherUser?.id]);

  useEffect(() => {
    if (!socket || !otherUser?.id) {
      console.log("DMChat: Socket or otherUser.id missing, socket:", socket, "otherUser.id:", otherUser?.id);
      return;
    }
    console.log("DMChat: Joining DM room for user:", otherUser.id);
    socket.emit("joinDM", Number(otherUser.id));

    const handleDM = (msg) => {
      if (msg.sender_id === Number(otherUser.id) || msg.sender_id === Number(user.id)) {
        console.log("DMChat: Received DM message:", msg);
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (m) => (m.tempId && m.tempId === msg.tempId) || (m.id && m.id === msg.id)
          );
          if (existingIndex !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[existingIndex] = { ...msg, isOwn: msg.sender_id === Number(user.id) };
            console.log("DMChat: Replaced message with tempId/id:", msg.tempId || msg.id);
            return updatedMessages;
          }
          return [...prev, { ...msg, isOwn: msg.sender_id === Number(user.id) }];
        });
        onNewMessage(msg);
      }
    };

    socket.on("dmMessage", handleDM);
    return () => {
      console.log("DMChat: Cleaning up dmMessage listener");
      socket.off("dmMessage", handleDM);
    };
  }, [socket, otherUser?.id, user.id, onNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content) => {
    if (!content.trim()) {
      console.log("DMChat: Empty message, not sending");
      return;
    }
    if (!socket) {
      console.error("DMChat: Socket is null, cannot send message");
      return;
    }

    const tempId = uuidv4();
    const msgData = { to: Number(otherUser.id), content, tempId, from: Number(user.id) };
    console.log("DMChat: Sending message:", msgData);
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

    setMessages((prev) => {
      console.log("DMChat: Adding optimistic message, tempId:", tempId);
      return [...prev, optimisticMsg];
    });
    onNewMessage(optimisticMsg);
  };

  const handleBackToSidebar = () => {
    console.log("DMChat: Back to sidebar, clearing activeChat");
    setActiveChat(null);
    if (isMobile) setSidebarOpen(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading chat...
      </div>
    );

  if (connectionError)
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        {connectionError}
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative flex-1 flex flex-col h-full"
    >
      <div className="flex-shrink-0 p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-950 sticky top-0 z-10 flex items-center justify-between">
        {isMobile && (
          <button
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
            onClick={handleBackToSidebar}
          >
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <span className="font-semibold text-center flex-1">{otherUser.username || "Chat"}</span>
        {isMobile && <div className="w-10"></div>} {/* Spacer for alignment */}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-[60px]">
        {messages.map((msg) => (
          <MessageItem key={msg.tempId || msg.id} message={msg} currentUser={user} />
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 z-20">
        <MessageInput sendMessage={sendMessage} />
      </div>
    </motion.div>
  );
}
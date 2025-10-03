import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import api from "../utils/api.js";
import MessageItem from "./MessageItem.jsx";
import MessageInput from "./MessageInput.jsx";

export default function GroupChat({ user, groupId, socket }) {
  const [messages, setMessages] = useState([]);
  const [groupName, setGroupName] = useState("Group");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // ---------------- Fetch group messages ----------------
  useEffect(() => {
    if (!groupId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const msgs = await api.getGroupMessages(groupId);
        setMessages(msgs);
        if (msgs.length > 0 && msgs[0].group_name) setGroupName(msgs[0].group_name);
      } catch (err) {
        console.error("Failed to fetch group messages:", err);
        setError("Failed to load group messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [groupId]);

  // ---------------- Socket: join group & listen ----------------
  useEffect(() => {
    if (!socket || !groupId) return;

    socket.emit("joinGroup", Number(groupId));

    const handleGroupMessage = (msg) => {
      if (msg.group_id === Number(groupId)) {
        setMessages((prev) => {
          const existing = prev.find((m) => m.tempId === msg.tempId);
          if (existing) {
            return prev.map((m) => (m.tempId === msg.tempId ? { ...msg, isOwn: msg.sender_id === Number(user.id) } : m));
          }
          return [...prev, { ...msg, isOwn: msg.sender_id === Number(user.id) }];
        });
      }
    };

    const handleDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleError = ({ error }) => {
      console.error("Socket error:", error);
      setError(error);
    };

    socket.on("groupMessage", handleGroupMessage);
    socket.on("messageDeleted", handleDeleted);
    socket.on("errorMessage", handleError);

    return () => {
      socket.off("groupMessage", handleGroupMessage);
      socket.off("messageDeleted", handleDeleted);
      socket.off("errorMessage", handleError);
    };
  }, [socket, groupId, user.id]);

  // ---------------- Scroll to bottom ----------------
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- Send message ----------------
  const sendMessage = (content) => {
    if (!content?.trim() || !socket) return;

    const tempId = uuidv4();
    const msgData = { group_id: Number(groupId), content, tempId };
    socket.emit("sendGroupMessage", msgData);

    const optimisticMsg = {
      id: tempId,
      tempId,
      sender_id: Number(user.id),
      group_id: Number(groupId),
      content,
      created_at: new Date().toISOString(),
      isOwn: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
  };

  // ---------------- Delete message ----------------
  const handleDelete = async (msg) => {
    if (!socket || msg.sender_id !== Number(user.id)) return;
    try {
      await api.deleteMessage(msg.id);
      socket.emit("deleteMessage", { messageId: msg.id });
    } catch (err) {
      console.error("Failed to delete group message:", err);
      setError("Failed to delete message");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full text-gray-500">Loading group messages...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Header */}
      <div className="p-3 border-b dark:border-gray-700 font-medium text-gray-700 dark:text-gray-200">
        {groupName}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ marginBottom: "5%" }} // prevent messages hiding under input/BottomNav
      >
        {messages.map((msg) => (
          <MessageItem
            key={msg.tempId || msg.id}
            message={msg}
            currentUser={user}
            onDelete={msg.sender_id === Number(user.id) ? handleDelete : null}
          />
        ))}
        <div ref={scrollRef}></div>
      </div>

      {/* Input */}
      <MessageInput sendMessage={sendMessage} />
    </div>
  );
}

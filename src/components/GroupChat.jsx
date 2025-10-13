import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import api from "../utils/api.js";
import { useMessageContext } from "../context/MessageContext.jsx";
import MessageItem from "./MessageItem.jsx";
import MessageInput from "./MessageInput.jsx";
import { ArrowLeft, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GroupChat() {
  const { user, activeChat, socket, connectionError, isMobile, setSidebarOpen, onNewMessage, setActiveChat } = useMessageContext();
  const [messages, setMessages] = useState([]);
  const [groupName, setGroupName] = useState(activeChat?.groupName || "Group");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef(null);

  const groupId = activeChat?.id;

  // Fetch group messages
  useEffect(() => {
    if (!groupId) {
      console.log("GroupChat: No groupId, skipping fetch");
      setLoading(false);
      return;
    }
    console.log("GroupChat: Fetching messages for group:", groupId);
    setLoading(true);
    api
      .getGroupMessages(groupId)
      .then((data) => {
        console.log("GroupChat: Messages loaded:", data);
        data.forEach((msg, index) => {
          console.log(`GroupChat: Message ${index + 1} (id: ${msg.id}) - sender_id: ${msg.sender_id}, sender_username: ${msg.sender_username || 'missing'}, sender_avatar_url: ${msg.sender_avatar_url || 'missing'}`);
        });
        setMessages(data);
      })
      .catch((err) => {
        console.error("GroupChat: Failed to load messages:", err);
        setError("Failed to load messages");
      })
      .finally(() => {
        console.log("GroupChat: Loading complete");
        setLoading(false);
      });
  }, [groupId]);

  // Fetch group members
  useEffect(() => {
    if (!groupId) {
      console.log("GroupChat: No groupId, skipping members fetch");
      return;
    }
    console.log("GroupChat: Fetching members for group:", groupId);
    api
      .get(`/groups/${groupId}/members`)
      .then((res) => {
        console.log("GroupChat: Members loaded:", res.data);
        setMembers(res.data);
      })
      .catch((err) => {
        console.error("GroupChat: Failed to load members:", err);
        setError("Failed to load group members");
      });
  }, [groupId]);

  // Handle socket for group messages
  useEffect(() => {
    if (!socket || !groupId) {
      console.log("GroupChat: Socket or groupId missing, socket:", socket, "groupId:", groupId);
      return;
    }
    console.log("GroupChat: Joining group room:", groupId);
    socket.emit("joinGroup", Number(groupId));

    const handleGroupMessage = (msg) => {
      if (msg.group_id === Number(groupId)) {
        console.log("GroupChat: Received group message:", msg);
        console.log(`GroupChat: Message (id: ${msg.id || msg.tempId}) - sender_id: ${msg.sender_id}, sender_username: ${msg.sender_username || 'missing'}, sender_avatar_url: ${msg.sender_avatar_url || 'missing'}`);
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (m) => (m.tempId && m.tempId === msg.tempId) || (m.id && m.id === msg.id)
          );
          if (existingIndex !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[existingIndex] = { ...msg, isOwn: msg.sender_id === Number(user.id) };
            console.log("GroupChat: Replaced message with tempId/id:", msg.tempId || msg.id);
            return updatedMessages;
          }
          return [...prev, { ...msg, isOwn: msg.sender_id === Number(user.id) }];
        });
        onNewMessage(msg);
      }
    };

    socket.on("groupMessage", handleGroupMessage);
    return () => {
      console.log("GroupChat: Cleaning up groupMessage listener");
      socket.off("groupMessage", handleGroupMessage);
    };
  }, [socket, groupId, user.id, onNewMessage]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content) => {
    if (!content.trim()) {
      console.log("GroupChat: Empty message, not sending");
      return;
    }
    if (!socket) {
      console.error("GroupChat: Socket is null, cannot send message");
      return;
    }

    const tempId = uuidv4();
    const msgData = { group_id: Number(groupId), content, tempId, from: Number(user.id) };
    console.log("GroupChat: Sending message:", msgData);
    socket.emit("sendGroupMessage", msgData);

    const optimisticMsg = {
      id: tempId,
      tempId,
      sender_id: Number(user.id),
      group_id: Number(groupId),
      content,
      created_at: new Date().toISOString(),
      isOwn: true,
      sender_username: user.username || "You",
      sender_avatar_url: user.avatar_url || null,
    };

    setMessages((prev) => {
      console.log("GroupChat: Adding optimistic message, tempId:", tempId);
      return [...prev, optimisticMsg];
    });
    onNewMessage(optimisticMsg);
  };

  const handleBackToSidebar = () => {
    console.log("GroupChat: Back to sidebar, clearing activeChat");
    setActiveChat(null);
    if (isMobile) setSidebarOpen(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading chat...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        {error}
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
        <span className="font-semibold text-center flex-1">{groupName}</span>
        <button
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          onClick={() => setShowMembers(true)}
        >
          <Info size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-[60px]">
        {messages.map((msg) => (
          <MessageItem key={msg.tempId || msg.id} message={msg} currentUser={user} />
        ))}
        <div ref={scrollRef}></div>
      </div>
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 z-20">
        <MessageInput sendMessage={sendMessage} />
      </div>

      {/* Members Pop-up */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-lg relative max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                onClick={() => setShowMembers(false)}
              >
                <X size={18} className="text-gray-700 dark:text-gray-300" />
              </button>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Group Members
              </h2>
              {members.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No members found</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {member.author_avatar ? (
                          <img
                            src={member.author_avatar}
                            alt={member.username || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 font-semibold">
                            {member.username?.[0]?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {member.username || "Unknown"} {member.role !== 'member' ? `(${member.role})` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
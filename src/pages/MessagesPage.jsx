import React from "react";
import { ArrowLeft, Search } from "lucide-react";
import { MessageProvider, useMessageContext } from "../context/MessageContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import DMChat from "../components/DMChat.jsx";
import GroupChat from "../components/GroupChat.jsx";
import Loader from "../components/Loader.jsx";
import { motion, AnimatePresence } from "framer-motion"; // Corrected import typo

export default function MessagesPage({ user }) {
  return (
    <MessageProvider user={user}>
      <MessagesPageContent />
    </MessageProvider>
  );
}

function MessagesPageContent() {
  const {
    activeChat,
    setActiveChat,
    loadingChats,
    chatError,
    connectionError,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    user,
  } = useMessageContext();

  // Debug logs
  console.log("MessagesPageContent: isMobile:", isMobile);
  console.log("MessagesPageContent: activeChat:", activeChat);
  console.log("MessagesPageContent: sidebarOpen:", sidebarOpen);

  const handleBackToSidebar = () => {
    console.log("MessagesPageContent: Back to sidebar, clearing activeChat");
    setActiveChat(null);
    if (isMobile) setSidebarOpen(true);
  };

  if (!user || loadingChats) {
    console.log("MessagesPageContent: Showing loader (no user or loadingChats)");
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  if (chatError || connectionError) {
    console.log("MessagesPageContent: Showing error:", chatError || connectionError);
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-500">
          <p>{chatError || connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const showSidebar = isMobile ? (!activeChat || sidebarOpen) : true;
  const showChat = !isMobile || (activeChat && !sidebarOpen);

  console.log("MessagesPageContent: showSidebar:", showSidebar, "showChat:", showChat);

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden gap-0">
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: isMobile ? "-100%" : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? "-100%" : 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full md:w-80 md:min-w-[20rem] flex flex-col h-full bg-white dark:bg-gray-950 relative"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: isMobile ? "100%" : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? "100%" : 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 relative z-10"
          >
            {activeChat ? (
              activeChat.type === "dm" ? (
                <DMChat />
              ) : (
                <GroupChat />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-center px-4">
                <div className="max-w-sm">
                  <h3 className="text-xl font-medium mb-2">Select a chat</h3>
                  <p className="text-sm">Choose from your direct messages, groups, or start a new conversation.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
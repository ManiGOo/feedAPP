import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useSocket from "../hooks/useSocket.js";
import api from "../utils/api.js";

import Sidebar from "../components/Sidebar.jsx";
import DMChat from "../components/DMChat.jsx";
import GroupChat from "../components/GroupChat.jsx";
import Loader from "../components/Loader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { Menu, ArrowLeft, Search } from "lucide-react";

export default function MessagesPage({ user }) {
  const [activeChat, setActiveChat] = useState(null);
  const [dms, setDMs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [followingError, setFollowingError] = useState(null);

  const socket = useSocket(localStorage.getItem("token"));

  // 🔹 Track mobile resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-adjust view on resize
      if (!mobile && activeChat) {
        setSidebarOpen(true); // Ensure sidebar visible on desktop
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeChat]);

  // 🔹 Initial view: On mobile, show sidebar by default if no chat selected
  useEffect(() => {
    if (isMobile && !activeChat) {
      setSidebarOpen(true);
    }
  }, [isMobile, activeChat]);

  // Fetch following
  useEffect(() => {
    const fetchFollowing = async () => {
      setLoadingFollowing(true);
      setFollowingError(null);
      try {
        const data = await api.getUserFollowing(user.id);
        setFollowingUsers(data || []);
      } catch (err) {
        console.error("Fetch following error:", err);
        setFollowingError(err.response?.data?.error || "Failed to load following");
      } finally {
        setLoadingFollowing(false);
      }
    };

    if (user?.id) fetchFollowing();
  }, [user.id]);

  // 🔹 Fetch existing DMs & group chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const [dmList, groupList] = await Promise.all([api.getDMs(), api.getGroups()]);
        setDMs(dmList);
        setGroups(groupList);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  // 🔹 Socket: live DM updates
  useEffect(() => {
    if (!socket) return;

    const handleIncomingDM = (msg) => {
      setDMs((prev) => {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const existing = prev.find((d) => d.otherUserId === otherUserId);

        const newDM = {
          otherUserId,
          username: msg.sender_username || "User",
          lastMessage: msg.content,
        };

        if (existing) {
          return [newDM, ...prev.filter((d) => d.otherUserId !== existing.otherUserId)];
        }
        return [newDM, ...prev];
      });
    };

    socket.on("dmMessage", handleIncomingDM);
    return () => socket.off("dmMessage", handleIncomingDM);
  }, [socket, user.id]);

  // 🔹 Search following users
  useEffect(() => {
    if (!userSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await api.searchFollowingByUsername(userSearchTerm);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  // 🔹 Start or open a DM
  const startDM = (otherUser) => {
    let dm = dms.find((d) => d.otherUserId === otherUser.id);
    if (!dm) {
      dm = { otherUserId: otherUser.id, username: otherUser.username };
      setDMs([dm, ...dms]);
    }

    setActiveChat({
      type: "dm",
      id: dm.otherUserId,
      username: dm.username,
      key: uuidv4(),
    });

    setUserSearchTerm("");
    if (isMobile) setSidebarOpen(false); // Switch to chat view on mobile
  };

  // 🔹 Open group chat
  const openGroup = (group) => {
    setActiveChat({
      type: "group",
      id: group.id,
      groupName: group.name,
      key: uuidv4(),
    });
    if (isMobile) setSidebarOpen(false);
  };

  // 🔹 Back to sidebar on mobile
  const handleBackToSidebar = () => {
    setActiveChat(null);
    if (isMobile) setSidebarOpen(true);
  };

  // 🔹 Loader for initial state
  if (!user || loadingChats) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  // Mobile: Conditional full-screen views
  const showSidebar = isMobile ? (!activeChat || sidebarOpen) : true;
  const showChat = isMobile ? (activeChat && !sidebarOpen) : true;

  return (
    <div className="flex h-screen max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* Mobile toggle for sidebar (if chat active) */}
      {isMobile && activeChat && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
          onClick={handleBackToSidebar}
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Sidebar - Full screen on mobile if no chat or open */}
      <div
        className={`${
          showSidebar
            ? "fixed inset-0 z-40 bg-white dark:bg-gray-950 md:relative md:inset-auto"
            : "hidden"
        } flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Modern Header for Sidebar */}
        <div className="p-4 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-10 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Messages</h2>
          <div className="relative">
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <Sidebar
          dms={dms}
          groups={groups}
          userSearchTerm={userSearchTerm}
          setUserSearchTerm={setUserSearchTerm}
          searchResults={searchResults}
          searchLoading={searchLoading}
          startDM={startDM}
          openGroup={openGroup}
          user={user}
          setActiveChat={setActiveChat}
          closeSidebar={() => setSidebarOpen(false)}
          followingUsers={followingUsers}
          loadingFollowing={loadingFollowing}
          followingError={followingError}
          isMobile={isMobile} // Pass for internal mobile tweaks if needed
        />
      </div>

      {/* Chat Area - Full screen on mobile if active */}
      <div
        className={`${
          showChat ? "flex-1 flex flex-col" : "hidden md:flex"
        } bg-white dark:bg-gray-950 relative transition-all duration-300 ease-in-out`}
      >
        {activeChat ? (
          activeChat.type === "dm" ? (
            <DMChat
              key={activeChat.key}
              user={user}
              otherUser={{
                id: activeChat.id,
                username: activeChat.username,
              }}
              socket={socket}
              onBack={isMobile ? handleBackToSidebar : null} // Assume DMChat accepts onBack prop for header
            />
          ) : (
            <GroupChat
              key={activeChat.key}
              user={user}
              groupId={activeChat.id}
              socket={socket}
              onBack={isMobile ? handleBackToSidebar : null}
            />
          )
        ) : (
          !isMobile && (
            <div className="flex items-center justify-center h-full text-gray-500 text-center px-4">
              <div className="max-w-sm">
                <h3 className="text-xl font-medium mb-2">Select a chat</h3>
                <p className="text-sm">Choose from your direct messages, groups, or start a new conversation.</p>
              </div>
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
}
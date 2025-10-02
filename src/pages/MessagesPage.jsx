// MessagesPage.jsx
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useSocket from "../hooks/useSocket.js";
import api from "../utils/api.js";

import Sidebar from "../components/Sidebar.jsx";
import DMChat from "../components/DMChat.jsx";
import GroupChat from "../components/GroupChat.jsx";
import Loader from "../components/Loader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { Menu } from "lucide-react";

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

  const socket = useSocket(localStorage.getItem("token"));

  // Track mobile resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch DM & Group lists
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

  // Socket: update DMs dynamically
  useEffect(() => {
    if (!socket) return;

    const handleIncomingDM = (msg) => {
      setDMs((prev) => {
        const existing = prev.find(
          (d) => d.otherUserId === msg.sender_id || d.otherUserId === msg.recipient_id
        );
        const newDM = {
          otherUserId: msg.sender_id === user.id ? msg.recipient_id : msg.sender_id,
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

  // Search users
  useEffect(() => {
    if (!userSearchTerm.trim()) return setSearchResults([]);
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const users = await api.getFollowableUsers();
        setSearchResults(
          users.filter(
            (u) =>
              u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) &&
              u.id !== user.id
          )
        );
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm, user.id]);

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
    if (isMobile) setSidebarOpen(false);
  };

  const openGroup = (group) => {
    setActiveChat({
      type: "group",
      id: group.id,
      groupName: group.name,
      key: uuidv4(),
    });
    if (isMobile) setSidebarOpen(false);
  };

  if (!user || loadingChats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] max-w-6xl mx-auto border dark:border-gray-700 rounded-xl overflow-hidden relative">
      <div className="flex flex-1 relative">
        {/* Mobile toggle */}
        {isMobile && !sidebarOpen && (
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded bg-gray-200 dark:bg-gray-700 shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-950 z-40 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:relative`}
        >
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
          />
        </div>

        {/* Overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Chat area */}
        <div
          className={`flex-1 bg-white dark:bg-gray-950 relative flex flex-col transition-all duration-300 ${
            !isMobile && sidebarOpen ? "md:ml-64" : ""
          }`}
        >
          {activeChat ? (
            activeChat.type === "dm" ? (
              <DMChat
                key={activeChat.key}
                user={user}
                otherUser={{ id: activeChat.id, username: activeChat.username }}
                socket={socket}
              />
            ) : (
              <GroupChat
                key={activeChat.key}
                user={user}
                groupId={activeChat.id}
                socket={socket}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-center px-4">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}

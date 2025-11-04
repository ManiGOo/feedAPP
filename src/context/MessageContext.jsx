// context/MessageContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import useSocket from "../hooks/useSocket.js";
import api, { onDMMessage, onGroupMessage } from "../utils/api.js";

const MessageContext = createContext();

export const MessageProvider = ({ children, user }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [dms, setDMs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [chatError, setChatError] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [followingError, setFollowingError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth < 768);

  // Unread tracking
  const [unreadCounts, setUnreadCounts] = useState({}); // { "dm_123": 2, "group_456": 1 }

  const { socket, connectionError } = useSocket(
    useCallback((messageId) => {
      setDMs((prev) => prev.map((dm) => ({
        ...dm,
        lastMessage: dm.lastMessageId === messageId ? "" : dm.lastMessage,
      })));
      setGroups((prev) => prev.map((group) => ({
        ...group,
        lastMessage: group.lastMessageId === messageId ? "" : group.lastMessage,
      })));
    }, []),
    useCallback((group) => {
      if (group.members.includes(user.id)) {
        setGroups((prev) => [group, ...prev]);
      }
    }, [user.id])
  );

  const withRetry = useCallback(async (fn, maxRetries = 3, delay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (err.code === "ERR_INSUFFICIENT_RESOURCES" && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw err;
      }
    }
  }, []);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && activeChat) setSidebarOpen(true);
      else if (mobile && !activeChat) setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [activeChat]);

  useEffect(() => {
    if (isMobile && !activeChat) setSidebarOpen(true);
    else if (isMobile && activeChat) setSidebarOpen(false);
  }, [isMobile, activeChat]);

  // Fetch following
  useEffect(() => {
    if (!user?.id) return;
    const fetchFollowing = async () => {
      setLoadingFollowing(true);
      setFollowingError(null);
      try {
        const data = await withRetry(() => api.getUserFollowing(user.id));
        setFollowingUsers(data || []);
      } catch (err) {
        setFollowingError(err.response?.data?.error || "Failed to load following");
      } finally {
        setLoadingFollowing(false);
      }
    };
    fetchFollowing();
  }, [user.id, withRetry]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      setChatError(null);
      try {
        const [dmList, groupList] = await Promise.all([
          withRetry(() => api.getDMs()),
          withRetry(() => api.getGroups()),
        ]);
        setDMs(dmList);
        setGroups(groupList);
      } catch (err) {
        setChatError("Failed to load chats. Please try again.");
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, [withRetry]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingDM = (msg) => {
      const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      setDMs((prev) => {
        const existing = prev.find((d) => d.otherUserId === otherUserId);
        const newDM = {
          otherUserId,
          username: msg.sender_username || "User",
          lastMessage: msg.content,
          lastMessageId: msg.id,
        };
        if (existing) {
          return [newDM, ...prev.filter((d) => d.otherUserId !== otherUserId)];
        }
        return [newDM, ...prev];
      });

      // Increment unread
      if (!activeChat || activeChat.type !== "dm" || activeChat.id !== otherUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [`dm_${otherUserId}`]: (prev[`dm_${otherUserId}`] || 0) + 1,
        }));
      }
    };

    const handleGroupMessage = (msg) => {
      setGroups((prev) => {
        const group = prev.find((g) => g.id === msg.group_id);
        if (group) {
          return [
            { ...group, lastMessage: msg.content, lastMessageId: msg.id },
            ...prev.filter((g) => g.id !== msg.group_id),
          ];
        }
        return prev;
      });

      if (!activeChat || activeChat.type !== "group" || activeChat.id !== msg.group_id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [`group_${msg.group_id}`]: (prev[`group_${msg.group_id}`] || 0) + 1,
        }));
      }
    };

    onDMMessage(handleIncomingDM, socket);
    onGroupMessage(handleGroupMessage, socket);

    return () => {
      socket.off("dmMessage", handleIncomingDM);
      socket.off("groupMessage", handleGroupMessage);
    };
  }, [socket, user.id, activeChat]);

  // Search
  useEffect(() => {
    if (!userSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await withRetry(() => api.searchFollowingByUsername(userSearchTerm));
        setSearchResults(results);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm, withRetry]);

  // Reset unread when opening chat
  useEffect(() => {
    if (!activeChat) return;
    const key = activeChat.type === "dm" ? `dm_${activeChat.id}` : `group_${activeChat.id}`;
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[key];
      return newCounts;
    });
  }, [activeChat]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const startDM = useCallback((otherUser) => {
    let dm = dms.find((d) => d.otherUserId === otherUser.id);
    if (!dm) {
      dm = { otherUserId: otherUser.id, username: otherUser.username, lastMessage: "" };
      setDMs((prev) => [dm, ...prev]);
    }
    setActiveChat({
      type: "dm",
      id: dm.otherUserId,
      username: dm.username,
      key: uuidv4(),
    });
    setUserSearchTerm("");
    if (isMobile) setSidebarOpen(false);
  }, [dms, isMobile]);

  const openGroup = useCallback((group) => {
    setActiveChat({
      type: "group",
      id: group.id,
      groupName: group.name,
      key: uuidv4(),
    });
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const onNewMessage = useCallback((msg) => {
    // Already handled in socket listeners
  }, []);

  const value = {
    activeChat,
    setActiveChat,
    dms,
    setDMs,
    groups,
    setGroups,
    loadingChats,
    chatError,
    userSearchTerm,
    setUserSearchTerm,
    searchResults,
    searchLoading,
    followingUsers,
    loadingFollowing,
    followingError,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    startDM,
    openGroup,
    connectionError,
    user,
    onNewMessage,
    socket,
    unreadCounts,
    totalUnread,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export const useMessageContext = () => useContext(MessageContext);
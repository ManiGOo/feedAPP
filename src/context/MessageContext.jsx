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

  const { socket, connectionError } = useSocket(
    useCallback((messageId) => {
      console.log("MessageContext: Handling messageDeleted:", messageId);
      setDMs((prev) =>
        prev.map((dm) => ({
          ...dm,
          lastMessage: dm.lastMessageId === messageId ? "" : dm.lastMessage,
        }))
      );
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          lastMessage: group.lastMessageId === messageId ? "" : group.lastMessage,
        }))
      );
    }, []),
    useCallback((group) => {
      console.log("MessageContext: Handling groupCreated:", group);
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
          console.log(`MessageContext: Retry attempt ${attempt} after ${delay * attempt}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw err;
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      console.log("MessageContext: Window resized, isMobile:", mobile, "activeChat:", activeChat);
      if (!mobile && activeChat) {
        setSidebarOpen(true);
      } else if (mobile && !activeChat) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [activeChat]);

  useEffect(() => {
    console.log("MessageContext: sidebarOpen updated:", sidebarOpen, "isMobile:", isMobile, "activeChat:", activeChat);
    if (isMobile && !activeChat) {
      setSidebarOpen(true);
    } else if (isMobile && activeChat) {
      setSidebarOpen(false);
    }
  }, [isMobile, activeChat]);

  useEffect(() => {
    const fetchFollowing = async () => {
      setLoadingFollowing(true);
      setFollowingError(null);
      try {
        const data = await withRetry(() => api.getUserFollowing(user.id));
        setFollowingUsers(data || []);
      } catch (err) {
        console.error("MessageContext: Fetch following error:", err);
        setFollowingError(err.response?.data?.error || "Failed to load following");
      } finally {
        setLoadingFollowing(false);
      }
    };

    if (user?.id) fetchFollowing();
  }, [user.id, withRetry]);

  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      setChatError(null);
      try {
        const [dmList, groupList] = await Promise.all([
          withRetry(() => api.getDMs()),
          withRetry(() => api.getGroups()),
        ]);
        console.log("MessageContext: Fetched DMs:", dmList, "Groups:", groupList);
        setDMs(dmList);
        setGroups(groupList);
      } catch (err) {
        console.error("MessageContext: Failed to fetch chats:", err);
        setChatError("Failed to load chats. Please try again.");
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, [withRetry]);

  useEffect(() => {
    if (!socket) {
      console.log("MessageContext: No socket, skipping message listeners");
      return;
    }

    const handleIncomingDM = (msg) => {
      console.log("MessageContext: Received dmMessage:", msg);
      setDMs((prev) => {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const existing = prev.find((d) => d.otherUserId === otherUserId);

        const newDM = {
          otherUserId,
          username: msg.sender_username || "User",
          lastMessage: msg.content,
          lastMessageId: msg.id,
        };

        if (existing) {
          return [newDM, ...prev.filter((d) => d.otherUserId !== existing.otherUserId)];
        }
        return [newDM, ...prev];
      });
    };

    const handleGroupMessage = (msg) => {
      console.log("MessageContext: Received groupMessage:", msg);
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
    };

    onDMMessage(handleIncomingDM, socket);
    onGroupMessage(handleGroupMessage, socket);

    return () => {
      console.log("MessageContext: Cleaning up socket listeners");
      socket.off("dmMessage", handleIncomingDM);
      socket.off("groupMessage", handleGroupMessage);
    };
  }, [socket, user.id]);

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
        console.error("MessageContext: Search failed:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchTerm, withRetry]);

  const startDM = useCallback((otherUser) => {
    console.log("MessageContext: Starting DM with user:", otherUser);
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
    console.log("MessageContext: Opening group:", group);
    setActiveChat({
      type: "group",
      id: group.id,
      groupName: group.name,
      key: uuidv4(),
    });
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const onNewMessage = useCallback((msg) => {
    console.log("MessageContext: onNewMessage called:", msg);
    if (msg.recipient_id) {
      setDMs((prev) => {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const existing = prev.find((d) => d.otherUserId === otherUserId);
        if (existing) {
          return [
            { ...existing, lastMessage: msg.content, lastMessageId: msg.id },
            ...prev.filter((d) => d.otherUserId !== otherUserId),
          ];
        }
        return prev;
      });
    } else if (msg.group_id) {
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
    }
  }, [user.id]);

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
  };

  console.log("MessageContext value:", value);

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export const useMessageContext = () => useContext(MessageContext);
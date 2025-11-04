// components/Sidebar.jsx
import React, { useMemo, useState } from "react";
import {
  Search,
  Users,
  MessageCircle,
  Users as UsersIcon,
  Plus,
} from "lucide-react";
import { useMessageContext } from "../context/MessageContext.jsx";
import CreateGroupPopup from "./CreateGroupPopup.jsx";
import ChatItem from "./ChatItem.jsx";
import SearchResults from "./SearchResults.jsx";
import ChatSection from "./ChatSection.jsx";
import Avatar from "./Avatar.jsx";
import BottomNav from "./BottomNav.jsx";

function Sidebar() {
  const {
    dms,
    groups,
    followingUsers,
    searchResults,
    searchLoading,
    startDM,
    openGroup,
    setActiveChat,
    loadingFollowing,
    followingError,
    isMobile,
    setSidebarOpen,
    user,
    setGroups,
    unreadCounts,          // ← NEW
  } = useMessageContext();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  /* ------------------------------------------------------------------ *
   *  GROUP CREATED → add to top & open it
   * ------------------------------------------------------------------ */
  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    setActiveChat({
      type: "group",
      id: newGroup.id,
      groupName: newGroup.name,
      key: crypto.randomUUID(),
    });
    setShowCreateGroup(false);
    if (isMobile) setSidebarOpen(false);
  };

  /* ------------------------------------------------------------------ *
   *  Memoized DM list – adds unread badge
   * ------------------------------------------------------------------ */
  const memoizedDMs = useMemo(
    () =>
      dms.map((dm) => (
        <ChatItem
          key={dm.otherUserId}
          name={dm.username}
          avatar={dm.avatar_url}
          lastMessage={dm.lastMessage}
          unread={unreadCounts[`dm_${dm.otherUserId}`] || 0}
          onClick={() => {
            setActiveChat({
              type: "dm",
              id: dm.otherUserId,
              username: dm.username,
              key: crypto.randomUUID(),
            });
            if (isMobile) setSidebarOpen(false);
          }}
        />
      )),
    [dms, setActiveChat, isMobile, setSidebarOpen, unreadCounts]
  );

  /* ------------------------------------------------------------------ *
   *  Memoized GROUP list – **identical behaviour to DMs**
   * ------------------------------------------------------------------ */
  const memoizedGroups = useMemo(
    () =>
      groups.map((g) => (
        <ChatItem
          key={g.id}
          name={g.name}
          avatar={g.avatar_url}
          lastMessage={g.lastMessage}
          unread={unreadCounts[`group_${g.id}`] || 0}
          onClick={() => {
            setActiveChat({
              type: "group",
              id: g.id,
              groupName: g.name,
              key: crypto.randomUUID(),
            });
            if (isMobile) setSidebarOpen(false);
          }}
        />
      )),
    [groups, setActiveChat, isMobile, setSidebarOpen, unreadCounts]
  );

  /* ------------------------------------------------------------------ *
   *  Following users (quick-start DM)
   * ------------------------------------------------------------------ */
  const memoizedFollowing = useMemo(
    () =>
      followingUsers.map((u) => (
        <button
          key={u.id}
          onClick={() => {
            startDM(u);
            if (isMobile) setSidebarOpen(false);
          }}
          className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
        >
          <Avatar user={u} />
          <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 truncate">
            {u.username}
          </span>
        </button>
      )),
    [followingUsers, startDM, isMobile, setSidebarOpen]
  );

  /* ------------------------------------------------------------------ *
   *  Render
   * ------------------------------------------------------------------ */
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-y-auto relative">
      {/* Search results dropdown */}
      <SearchResults
        results={searchResults}
        loading={searchLoading}
        startDM={startDM}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {/* ----- Following ----- */}
        <ChatSection
          title="Following"
          icon={<Users size={16} className="text-gray-500 dark:text-gray-400" />}
        >
          {loadingFollowing ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
            </div>
          ) : followingError ? (
            <p className="text-red-500 text-sm">{followingError}</p>
          ) : followingUsers.length ? (
            <div className="space-y-1">{memoizedFollowing}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Start following users to message them
            </p>
          )}
        </ChatSection>

        {/* ----- Direct Messages ----- */}
        <ChatSection
          title="Direct Messages"
          icon={<MessageCircle size={16} className="text-gray-500 dark:text-gray-400" />}
        >
          {memoizedDMs.length ? (
            <div className="space-y-1">{memoizedDMs}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              No direct messages yet
            </p>
          )}
        </ChatSection>

        {/* ----- Groups ----- */}
        <ChatSection
          title="Groups"
          icon={<UsersIcon size={16} className="text-gray-500 dark:text-gray-400" />}
          action={
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Create Group"
            >
              <Plus size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          }
        >
          {memoizedGroups.length ? (
            <div className="space-y-1">{memoizedGroups}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Join or create groups
            </p>
          )}
        </ChatSection>
      </div>

      {/* Bottom navigation */}
      <div className="flex-shrink-0 border-t dark:border-gray-800 pb-10">
        <BottomNav />
      </div>

      {/* Create-group modal */}
      {showCreateGroup && (
        <CreateGroupPopup
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
          availableMembers={followingUsers.filter((u) => u.id !== user?.id)}
        />
      )}
    </div>
  );
}

export default React.memo(Sidebar);
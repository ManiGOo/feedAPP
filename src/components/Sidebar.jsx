import React, { useMemo, useState } from "react";
import { Search, Users, MessageCircle, Users as UsersIcon, Plus } from "lucide-react";
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
  } = useMessageContext();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

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

  const memoizedDMs = useMemo(
    () =>
      dms.map((dm) => (
        <ChatItem
          key={dm.otherUserId}
          name={dm.username}
          avatar={dm.avatar_url}
          lastMessage={dm.lastMessage}
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
    [dms, setActiveChat, isMobile, setSidebarOpen]
  );

  const memoizedGroups = useMemo(
    () =>
      groups.map((g) => (
        <ChatItem
          key={g.id}
          name={g.name}
          avatar={g.avatar_url}
          lastMessage={g.lastMessage}
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
    [groups, setActiveChat, isMobile, setSidebarOpen]
  );

  const memoizedFollowing = useMemo(
    () =>
      followingUsers.map((u) => (
        <UserItem
          key={u.id}
          user={u}
          onClick={() => {
            startDM(u);
            if (isMobile) setSidebarOpen(false);
          }}
        />
      )),
    [followingUsers, startDM, isMobile, setSidebarOpen]
  );

  function UserItem({ user, onClick }) {
    return (
      <button
        onClick={onClick}
        className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
      >
        <Avatar user={user} />
        <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 truncate">
          {user.username}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-y-auto relative">
      <SearchResults
        results={searchResults}
        loading={searchLoading}
        startDM={startDM}
      />
      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        <ChatSection title="Following" icon={<Users size={16} className="text-gray-500 dark:text-gray-400" />}>
          {loadingFollowing ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
            </div>
          ) : followingError ? (
            <p className="text-red-500 text-sm animate-fade-in">{followingError}</p>
          ) : followingUsers.length ? (
            <div className="space-y-1 animate-fade-in">{memoizedFollowing}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">Start following users to message them</p>
          )}
        </ChatSection>
        <ChatSection title="Direct Messages" icon={<MessageCircle size={16} className="text-gray-500 dark:text-gray-400" />}>
          {memoizedDMs.length ? (
            <div className="space-y-1 animate-fade-in">{memoizedDMs}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">No direct messages yet</p>
          )}
        </ChatSection>
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
            <div className="space-y-1 animate-fade-in">{memoizedGroups}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">Join or create groups</p>
          )}
        </ChatSection>
      </div>
      <div className="flex-shrink-0 border-t dark:border-gray-800">
        <BottomNav />
      </div>
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
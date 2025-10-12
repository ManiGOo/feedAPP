import React, { useMemo } from "react";
import { Search, Users, MessageCircle, Users as UsersIcon } from "lucide-react";

export default function Sidebar({
  dms,
  groups,
  followingUsers = [],
  searchResults,
  searchLoading,
  startDM,
  openGroup,
  setActiveChat,
  closeSidebar,
  loadingFollowing = false,
  followingError = null,
  isMobile = false, // For potential mobile-specific tweaks
}) {
  const handleSelectChat = (chatObj) => {
    setActiveChat(chatObj);
    if (closeSidebar) closeSidebar();
  };

  // Memoize DM and Group lists
  const memoizedDMs = useMemo(
    () =>
      dms.map((dm) => (
        <ChatItem
          key={dm.otherUserId}
          name={dm.username}
          avatar={dm.avatar_url}
          lastMessage={dm.lastMessage}
          onClick={() =>
            handleSelectChat({
              type: "dm",
              id: dm.otherUserId,
              username: dm.username,
              key: crypto.randomUUID(),
            })
          }
        />
      )),
    [dms]
  );

  const memoizedGroups = useMemo(
    () =>
      groups.map((g) => (
        <ChatItem
          key={g.id}
          name={g.name}
          avatar={g.avatar_url}
          lastMessage={g.lastMessage}
          onClick={() =>
            handleSelectChat({
              type: "group",
              id: g.id,
              groupName: g.name,
              key: crypto.randomUUID(),
            })
          }
        />
      )),
    [groups]
  );

  const memoizedFollowing = useMemo(
    () =>
      followingUsers.map((u) => (
        <UserItem
          key={u.id}
          user={u}
          onClick={() => {
            startDM(u);
            if (closeSidebar) closeSidebar();
          }}
        />
      )),
    [followingUsers, startDM, closeSidebar]
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-y-auto">
      {/* Search results - Integrated as overlay-like section */}
      <SearchResults
        results={searchResults}
        loading={searchLoading}
        startDM={(u) => {
          startDM(u);
          if (closeSidebar) closeSidebar();
        }}
      />

      {/* Chat lists - Enhanced padding, spacing */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-20"> {/* Extra bottom padding for mobile scroll */}
        {/* Following Users */}
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

        {/* DMs */}
        <ChatSection title="Direct Messages" icon={<MessageCircle size={16} className="text-gray-500 dark:text-gray-400" />}>
          {memoizedDMs.length ? (
            <div className="space-y-1 animate-fade-in">{memoizedDMs}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">No direct messages yet</p>
          )}
        </ChatSection>

        {/* Groups */}
        <ChatSection title="Groups" icon={<UsersIcon size={16} className="text-gray-500 dark:text-gray-400" />}>
          {memoizedGroups.length ? (
            <div className="space-y-1 animate-fade-in">{memoizedGroups}</div>
          ) : (
            <p className="text-gray-500 text-sm italic">Join or create groups</p>
          )}
        </ChatSection>
      </div>
    </div>
  );
}

// ---------------- Components ----------------
function ChatSection({ title, children, icon }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
        {icon}
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

// ---------------- Search Results ----------------
const SearchResults = React.memo(({ results, loading, startDM }) => {
  if (loading) {
    return (
      <div className="px-5 py-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900 animate-pulse">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500"></div>
          Searching...
        </div>
      </div>
    );
  }
  if (!results.length) return null;

  return (
    <div className="px-5 py-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900 space-y-1 animate-fade-in">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Search Results</p>
      {results.map((u) => (
        <UserItem key={u.id} user={u} onClick={() => startDM(u)} />
      ))}
    </div>
  );
});

function UserItem({ user, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm hover:shadow-md text-sm"
    >
      <Avatar user={user} />
      <span className="text-gray-800 dark:text-gray-100 truncate font-medium">
        {user.username}
      </span>
    </button>
  );
}

function ChatItem({ name, avatar, lastMessage, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition=all duration-200 ease-in-out transform hover:scale-105 shadow-sm hover:shadow-md"
    >
      <Avatar avatar={avatar} name={name} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
          {name}
        </div>
        {lastMessage && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {lastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ user, avatar, name }) {
  const src = avatar || user?.avatar_url;
  const displayName = user?.username || name || "User";

  return (
    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden text-lg font-bold text-white flex-shrink-0 shadow-md transition-transform duration-200 hover:scale-110">
      {src ? (
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        displayName[0].toUpperCase()
      )}
    </div>
  );
}

// Optional: Add these to your global CSS for animations (or use tailwind-animate plugin)
 /*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
*/
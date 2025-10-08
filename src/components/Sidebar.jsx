import React from "react";

export default function Sidebar({
  dms,
  groups,
  userSearchTerm,
  setUserSearchTerm,
  searchResults,
  searchLoading,
  startDM,
  openGroup,
  user,
  setActiveChat,
  closeSidebar,
  socket, // pass socket from parent
}) {
  const handleSelectChat = (chatObj) => {
    setActiveChat(chatObj);
    if (closeSidebar) closeSidebar(); // close sidebar on mobile

    // Auto-join socket room for DM or group
    if (socket) {
      if (chatObj.type === "dm") socket.emit("joinDM", chatObj.id);
      if (chatObj.type === "group") socket.emit("joinGroup", chatObj.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 w-64 md:w-64 overflow-y-auto">
      {/* Search */}
      <div className="p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-950 z-10">
        <input
          type="text"
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          placeholder="Search users..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-sm md:text-base"
        />
      </div>

      {/* Search results */}
      <div className="px-4 mt-2">
        {searchLoading && <div className="p-2 text-gray-500 text-sm">Searching...</div>}
        {!searchLoading &&
          searchResults.map((u) => (
            <UserItem
              key={u.id}
              user={u}
              onClick={() => startDM(u, socket, closeSidebar)}
            />
          ))}
      </div>

      {/* Chat lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ChatSection title="Direct Messages">
          {dms.map((dm) => (
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
          ))}
        </ChatSection>

        <ChatSection title="Groups">
          {groups.map((g) => (
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
          ))}
        </ChatSection>
      </div>
    </div>
  );
}

// ---------------- Components ----------------
function ChatSection({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function UserItem({ user, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm md:text-base"
    >
      <Avatar user={user} />
      <span className="text-gray-800 dark:text-gray-100 truncate">{user.username}</span>
    </button>
  );
}

function ChatItem({ name, avatar, lastMessage, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
    >
      <Avatar avatar={avatar} name={name} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm md:text-base">{name}</div>
        {lastMessage && (
          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{lastMessage}</div>
        )}
      </div>
    </div>
  );
}

function Avatar({ user, avatar, name }) {
  const src = avatar || user?.avatar_url;
  const displayName = user?.username || name || "User";

  return (
    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden text-sm md:text-base font-bold text-white flex-shrink-0">
      {src ? <img src={src} alt="avatar" className="w-full h-full object-cover" /> : displayName[0].toUpperCase()}
    </div>
  );
}

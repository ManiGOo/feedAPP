import React from "react";

function ChatItem({ name, avatar, lastMessage, onClick }) {
  return (
    <div
      className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {avatar ? (
          <img
            src={avatar}
            alt={`${name}'s avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/40"; // Fallback image
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
            {name ? name[0].toUpperCase() : "?"}
          </div>
        )}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {name || "Unknown"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {lastMessage || "No messages yet"}
        </p>
      </div>
    </div>
  );
}

export default React.memo(ChatItem);
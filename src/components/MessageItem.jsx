import React from "react";

export default function MessageItem({ message, currentUser }) {
  const isMine = message.sender_id === currentUser.id;

  return (
    <div className={`flex w-full ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`relative px-4 py-2 rounded-2xl max-w-[70%] break-words text-sm ${
          isMine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
        }`}
      >
        <span className="whitespace-pre-wrap">{message.content}</span>

        <span className="absolute bottom-1 right-2 text-[10px] text-gray-300 dark:text-gray-400">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

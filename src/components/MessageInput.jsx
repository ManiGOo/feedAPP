import React, { useState } from "react";

export default function MessageInput({ sendMessage }) {
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(content.trim());
    setContent("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
      />
      <button
        onClick={handleSend}
        className="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
      >
        Send
      </button>
    </div>
  );
}

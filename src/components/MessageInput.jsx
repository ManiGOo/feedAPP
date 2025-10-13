import React, { useState } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

function MessageInput({ sendMessage }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage(content);
    setContent("");
  };

  return (
    <motion.form
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="flex items-center p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-950 sticky bottom-0 z-10"
    >
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="ml-2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
        disabled={!content.trim()}
      >
        <Send size={20} />
      </button>
    </motion.form>
  );
}

export default React.memo(MessageInput);
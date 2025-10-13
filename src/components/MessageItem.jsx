import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import Avatar from "./Avatar.jsx";

export default function MessageItem({ message, currentUser, onDelete }) {
  console.log("MessageItem: Rendering message:", {
    id: message.id || message.tempId,
    sender_id: message.sender_id,
    sender_username: message.sender_username || "missing",
    sender_avatar_url: message.sender_avatar_url || "missing",
    group_id: message.group_id,
    content: message.content,
    isOwn: message.sender_id === currentUser.id,
  });
  const isMine = message.sender_id === currentUser.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: isMine ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMine ? 50 : -50 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col w-full mb-3 ${isMine ? "items-end" : "items-start"}`}
    >
      <div className={`flex items-end gap-2 max-w-[70%] ${isMine ? "flex-row-reverse" : ""}`}>
        {message.group_id && !isMine && (
          <div className="flex flex-col items-start">
            <Avatar
              user={{
                username: message.sender_username || "Unknown",
                avatar_url: message.sender_avatar_url || null,
              }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {message.sender_username || "Unknown"}
            </span>
          </div>
        )}
        <div
          className={`px-4 py-2 rounded-2xl break-words text-sm ${
            isMine
              ? "bg-blue-500 text-white rounded-br-none"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
          }`}
        >
          <span className="whitespace-pre-wrap">{message.content}</span>
        </div>
        {isMine && onDelete && (
          <button
            onClick={() => onDelete(message)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Trash2 size={16} className="text-gray-500" />
          </button>
        )}
      </div>
      <span className={`text-[10px] mt-1 ${isMine ? "text-gray-200 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>
        {new Date(message.created_at).toLocaleString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </motion.div>
  );
}
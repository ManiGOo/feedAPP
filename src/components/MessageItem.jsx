import { motion } from "framer-motion";

export default function MessageItem({ message, currentUser }) {
  const isMine = message.sender_id === currentUser.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: isMine ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMine ? 50 : -50 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col w-full mb-3 ${isMine ? "items-end" : "items-start"}`}
    >
      <div
        className={`px-4 py-2 rounded-2xl max-w-[70%] break-words text-sm ${
          isMine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
        }`}
      >
        <span className="whitespace-pre-wrap">{message.content}</span>
      </div>
      <span className={`text-[10px] mt-1 ${isMine ? "text-gray-200 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </motion.div>
  );
}

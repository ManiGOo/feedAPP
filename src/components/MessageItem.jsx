export default function MessageItem({ message, currentUser }) {
  const isMine = message.sender_id === currentUser.id;

  return (
    <div className={`flex flex-col w-full mb-3 ${isMine ? "items-end" : "items-start"}`}>
      <div
        className={`px-4 py-2 rounded-2xl max-w-[70%] break-words text-sm ${
          isMine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
        }`}
      >
        <span className="whitespace-pre-wrap">{message.content}</span>
      </div>

      {/* Timestamp outside the bubble */}
      <span className={`text-[10px] mt-1 ${
        isMine
          ? "text-gray-200 dark:text-gray-300"
          : "text-gray-600 dark:text-gray-400"
      }`}>
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

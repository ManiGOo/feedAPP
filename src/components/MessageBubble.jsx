//src/components/MessageBubble.jsx

function MessageBubble({ text, sender }) {
  const isMe = sender === "Me";

  return (
    <div className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-xs ${
          isMe ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default MessageBubble;

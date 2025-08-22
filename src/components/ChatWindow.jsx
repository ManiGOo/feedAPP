//src/components/ChatWindow.js

import { useState } from "react";
import MessageBubble from "./MessageBubble.jsx";

function ChatWindow() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey there!", sender: "Alice" },
    { id: 2, text: "Hello 👋", sender: "Me" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input, sender: "Me" }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} text={msg.text} sender={msg.sender} />
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;

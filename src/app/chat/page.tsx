"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Bot } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  image?: string;
  timestamp: Date;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    const extractedText = sessionStorage.getItem("extractedText");
    const imageUrl = sessionStorage.getItem("imageUrl");

    if (imageUrl && extractedText) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: "Uploaded medical report",
        image: imageUrl,
        timestamp: new Date(),
      };

      setMessages([userMessage]);

      sendToAPI(extractedText);
    }
  }, [searchParams]);

  const sendToAPI = async (text: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "Sorry, I encountered an error processing your report.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending to API:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Sorry, I encountered an error processing your report.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "GPTTTTTTT",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      <div className="flex items-center justify-center p-4 border-b border-slate-700">
        <Bot className="w-6 h-6 mr-2 text-blue-400" />
        <h1 className="text-xl font-semibold">Medic AI Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-white"
              }`}
            >
              {message.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.image}
                  alt="Medical report"
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-white px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask about your medical report..."
            className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}

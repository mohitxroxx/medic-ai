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

const SYSTEM_PROMPT = {
  role: "system",
  content: `
    You are a medical assistant.  
Your core role is to **analyze full medical reports** and **highlight only the concerning, abnormal, or attention-worthy findings**.  
However, if the user asks a **follow-up question or general health-related query**, you are allowed to answer helpfully based on your medical knowledge or the previously shared report content.

---

### When Given a Full Medical Report:
If the user provides a complete medical report and asks for analysis, ONLY show abnormal values or findings.

Format strictly as:

**Concerning Findings:**  
• <Finding>: <Value> (<Status>)  
• ...

**Suggestions:**  
• <Actionable recommendation per finding>  

If all values are normal, simply return:

No concerning findings. Your report looks good.


Important Rules:
- Never mention or summarize normal findings unless directly asked.
- Do not attempt a full diagnosis.
- Always provide clear, practical, and concise information.
- Default to user safety—recommend seeing a healthcare provider for serious or unclear issues.

`,
};
const CHAT_PROMPT = {
  role: "system",
  content: `
    You are a medical assistant.  
Your core role is to **analyze full medical reports** and **answer the user's question**.  


### When the User Asks a Follow-Up or General Question:
You **can and should** respond to user follow-up questions related to the report, abnormal values, or general health topics.

Format strictly as:

**Heading:**  
• <Finding>: <Value> (<Status>)  
• ...

**Suggestions:**  
• <Actionable recommendation per finding> 

Important Rules:
- Never mention or summarize normal findings unless directly asked.
- Do not attempt a full diagnosis.
- Always provide clear, practical, and concise information.
- Default to user safety—recommend seeing a healthcare provider for serious or unclear issues.

`,
};

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

      const history = [SYSTEM_PROMPT, { role: "user", content: extractedText }];
      sendToAPI(history);
    }
  }, [searchParams]);

  const sendToAPI = async (history: { role: string; content: string }[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ history }),
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
    } catch {
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

    const history = [
      CHAT_PROMPT,
      { role: "user", content: sessionStorage.getItem("extractedText") || "" },
      ...[...messages, userMessage].map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

    console.log("prompt", history);
    sendToAPI(history);
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
              className={`max-w-xs lg:max-w-lg px-4 py-3 rounded-lg ${
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
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content.split("\n").map((line, index) => {
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return (
                      <div
                        key={index}
                        className="font-bold text-blue-300 mb-2 mt-3 first:mt-0"
                      >
                        {line.replace(/\*\*/g, "")}
                      </div>
                    );
                  } else if (line.trim().startsWith("•")) {
                    const parts = line.substring(1).split(/(\*\*.*?\*\*)/g);
                    return (
                      <div key={index} className="ml-2 mb-1">
                        <span className="text-blue-300">•</span>{" "}
                        {parts.map((part, i) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={i}>{part.replace(/\*\*/g, "")}</strong>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </div>
                    );
                  } else if (line.trim()) {
                    return (
                      <div key={index} className="mb-2">
                        {line}
                      </div>
                    );
                  } else {
                    return <div key={index} className="mb-1"></div>;
                  }
                })}
              </div>
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

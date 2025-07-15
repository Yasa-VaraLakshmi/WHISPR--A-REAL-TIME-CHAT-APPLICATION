import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ClipboardCopy, Check } from "lucide-react"; // <-- import icons

function ChatBot() {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  async function generateAnswer(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setGeneratingAnswer(true);
    const currentQuestion = question;
    setQuestion("");
    setChatHistory((prev) => [...prev, { type: "question", content: currentQuestion }]);

    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCcp0wL-i7Ca-jFflpyh8-ii-acWRg2Dko",
        {
          contents: [{ role: "user", parts: [{ text: currentQuestion }] }],
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const aiResponse =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      setChatHistory((prev) => [...prev, { type: "answer", content: aiResponse }]);
    } catch (error) {
      console.error("Error generating answer:", error.response?.data || error.message);
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: "Sorry - Something went wrong. Please try again!" },
      ]);
    } finally {
      setGeneratingAnswer(false);
    }
  }

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-base-200 pt-16">
      <div className="h-full max-w-4xl mx-auto flex flex-col p-4">
        <header className="text-center py-6">
          <h1 className="text-4xl font-bold text-primary">WHISPR Chat AI</h1>
        </header>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto mb-4 rounded-xl bg-base-100 shadow-md p-6 space-y-4"
        >
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`chat ${
                chat.type === "question" ? "chat-end" : "chat-start"
              }`}
            >
              <div
                className={`chat-bubble relative ${
                  chat.type === "question"
                    ? "chat-bubble-primary text-white"
                    : "bg-base-300 text-base-content"
                }`}
              >
                {chat.content}
                {chat.type === "answer" && (
                  <button
                    onClick={() => handleCopy(chat.content, index)}
                    className="absolute bottom-1 right-2 text-sm text-blue-500 hover:text-blue-700"
                    title="Copy"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ClipboardCopy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {generatingAnswer && (
            <div className="chat chat-start">
              <div className="chat-bubble bg-base-300 animate-pulse">Thinking...</div>
            </div>
          )}
        </div>

        <form
          onSubmit={generateAnswer}
          className="bg-base-100 p-4 rounded-xl shadow-md"
        >
          <div className="form-control">
            <div className="flex gap-2">
              <textarea
                className="textarea textarea-bordered resize-none flex-1"
                placeholder="Ask anything..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows="2"
                required
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generateAnswer(e);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary self-end"
                disabled={generatingAnswer}
              >
                {generatingAnswer ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatBot;

import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [highlightedWords, setHighlightedWords] = useState({}); // {messageId: word}

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Start listening to incoming messages
    useChatStore.getState().subscribeToMessages();
  
    // Cleanup when component unmounts
    return () => useChatStore.getState().unsubscribeFromMessages();
  }, []);
  

  // Function to check Wikipedia and Google
  const checkWikipediaAndOpen = (term) => {
    const searchTerm = term.trim();
    const wikiApi = `https://en.wikipedia.org/w/api.php?action=query&origin=*&titles=${encodeURIComponent(
      searchTerm
    )}&format=json`;
    const wikiPage = `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`;
    const googleURL = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;

    fetch(wikiApi)
      .then((res) => res.json())
      .then((data) => {
        const pages = data.query.pages;
        const exists = Object.keys(pages)[0] !== "-1";
        const url = exists ? wikiPage : googleURL;
        window.open(url, "_blank");
      })
      .catch(() => {
        window.open(googleURL, "_blank"); // fallback
      });
  };

  // Handle word search on double-click or right-click
  const handleWordSearch = (e, messageId) => {
    const selection = window.getSelection().toString().trim();
    if (!selection) return;
    setHighlightedWords((prev) => ({ ...prev, [messageId]: selection }));
    checkWikipediaAndOpen(selection);
  };

  // Function to highlight selected word permanently
  const highlightText = (text, word) => {
    if (!word || !text.includes(word)) return text;
    const parts = text.split(new RegExp(`(${word})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === word.toLowerCase() ? (
        <mark
          key={index}
          className="bg-yellow-300 rounded px-1 transition-all"
        >
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && (
                <p
                  onDoubleClick={(e) => handleWordSearch(e, message._id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleWordSearch(e, message._id);
                  }}
                  className="cursor-pointer select-text"
                  title="Double-click or right-click to search"
                >
                  {highlightText(message.text, highlightedWords[message._id])}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;

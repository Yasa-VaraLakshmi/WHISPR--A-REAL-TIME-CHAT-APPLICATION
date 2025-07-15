import { useChatStore } from "../store/useChatStore";

const ChatList = () => {
  const { chats, setSelectedUser } = useChatStore();

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="p-3 border rounded hover:bg-zinc-100 cursor-pointer"
          onClick={() => setSelectedUser(chat)}
        >
          <div className="font-bold">{chat.name}</div>
          <div className="text-sm text-gray-600 truncate">
            {chat.lastMessage || "No messages yet"}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;

import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Sun, Languages, DollarSign, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CollaborativeCanvas from "../pages/CollaborativeCanvas"; // Import your CollaborativeCanvas component
import { X } from "lucide-react"; // X icon to close the canvas modal

const Sidebar = () => {
  const {
    getUsers,
    getSortedUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadMessages,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false); // State to control canvas modal visibility
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const sortedUsers = getSortedUsers();
  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter((user) => onlineUsers.includes(user._id))
    : sortedUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        <div className="mt-3 hidden lg:flex flex-col gap-2">
          <div className="flex items-center gap-4 justify-start">
            <button className="tooltip tooltip-bottom" data-tip="Weather" onClick={() => navigate("/weather")}>
              <Sun className="size-5 text-zinc-500 hover:text-primary transition-colors" />
            </button>
            <button className="tooltip tooltip-bottom" data-tip="Translator" onClick={() => navigate("/translator")}>
              <Languages className="size-5 text-zinc-500 hover:text-primary transition-colors" />
            </button>
            <button className="tooltip tooltip-bottom" data-tip="Currency" onClick={() => navigate("/currency")}>
              <DollarSign className="size-5 text-zinc-500 hover:text-primary transition-colors" />
            </button>
            <button className="tooltip tooltip-bottom" data-tip="Bot" onClick={() => navigate("/chatbot")}>
              <Bot className="size-5 text-zinc-500 hover:text-primary transition-colors" />
            </button>

            {/* Button to open Canvas Modal */}
            <button className="tooltip tooltip-bottom" data-tip="Collaborative Canvas" onClick={() => setShowCanvas(true)}>
              <span className="text-zinc-500 hover:text-primary transition-colors">🖼️ Canvas</span>
            </button>
          </div>

          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      {/* User List */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              useChatStore.getState().resetUnreadMessages?.(user._id);
            }}
            className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
              selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
            }`}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}
            </div>

            <div className="hidden lg:flex flex-col text-left min-w-0 w-full">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{user.fullName}</span>
                {unreadMessages?.[user._id] > 0 && (
                  <span className="badge badge-error text-xs">
                    {unreadMessages[user._id]}
                  </span>
                )}
              </div>
              <span className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </span>
            </div>
          </button>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No users found</div>
        )}
      </div>

      {/* Canvas Modal */}
      {showCanvas && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-lg w-[90%] max-w-4xl shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={() => setShowCanvas(false)} // Close the canvas modal
            >
              <X />
            </button>
            <CollaborativeCanvas roomId="canvas-room-123" onClose={() => setShowCanvas(false)} />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

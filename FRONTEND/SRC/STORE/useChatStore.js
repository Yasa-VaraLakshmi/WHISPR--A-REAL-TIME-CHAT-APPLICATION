import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      users: [],
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: false,
      unreadMessages: {},
      lastMessages: {},

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          set({ users: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load users");
        } finally {
          set({ isUsersLoading: false });
        }
      },

      getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });

          if (res.data.length > 0) {
            const lastMessage = res.data[res.data.length - 1];
            set((state) => ({
              lastMessages: {
                ...state.lastMessages,
                [userId]: lastMessage,
              },
            }));
          }

          set((state) => ({
            unreadMessages: {
              ...state.unreadMessages,
              [userId]: 0,
            },
          }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to fetch messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          const newMessage = res.data;

          set((state) => ({
            messages: [...messages, newMessage],
            lastMessages: {
              ...state.lastMessages,
              [selectedUser._id]: newMessage,
            },
          }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Message send failed");
        }
      },

      subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.on("receive-message", async (newMessage) => {
          const { selectedUser, messages, users } = get();
          const currentUserId = useAuthStore.getState().authUser._id;

          const isMessageFromSelectedUser =
            selectedUser && newMessage.senderId === selectedUser._id;

          const otherUserId =
            newMessage.senderId === currentUserId
              ? newMessage.receiverId
              : newMessage.senderId;

          // ✅ Check if new user and fetch if not in list
          const isNewUser = !users.some((u) => u._id === otherUserId);
          if (isNewUser) {
            try {
              const res = await axiosInstance.get(`/users/${otherUserId}`);
              set((state) => ({
                users: [...state.users, res.data],
              }));
            } catch (err) {
              console.error("Failed to fetch new user:", err);
            }
          }

          set((state) => {
            const updatedMessages = isMessageFromSelectedUser
              ? [...messages, newMessage]
              : state.messages;

            const updatedUnread = isMessageFromSelectedUser
              ? state.unreadMessages
              : {
                  ...state.unreadMessages,
                  [otherUserId]: (state.unreadMessages[otherUserId] || 0) + 1,
                };

            return {
              messages: updatedMessages,
              lastMessages: {
                ...state.lastMessages,
                [otherUserId]: newMessage,
              },
              unreadMessages: updatedUnread,
            };
          });
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("receive-message");
      },

      setSelectedUser: (selectedUser) => {
        set({ selectedUser });

        if (selectedUser?._id) {
          set((state) => ({
            unreadMessages: {
              ...state.unreadMessages,
              [selectedUser._id]: 0,
            },
          }));
        }
      },

      resetUnreadMessages: (userId) => {
        set((state) => ({
          unreadMessages: {
            ...state.unreadMessages,
            [userId]: 0,
          },
        }));
      },

      getSortedUsers: () => {
        const { users, lastMessages } = get();
        return [...users].sort((a, b) => {
          const aTime = lastMessages[a._id]?.createdAt || 0;
          const bTime = lastMessages[b._id]?.createdAt || 0;
          return new Date(bTime) - new Date(aTime);
        });
      },
    }),
    {
      name: "chat-store",
      getStorage: () => localStorage,
    }
  )
);

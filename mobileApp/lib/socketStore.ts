import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";
import { Chat, Message, MessageSender } from "../types";
import * as Sentry from "@sentry/react-native";

export interface socketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>; // chatId -> userId
  unreadChats: Set<string>;
  currentChatId: string | null;
  queryClient: QueryClient | null;

  connect: (token: string, queryClient: QueryClient) => void;
  disconnect: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (
    chatId: string,
    text: string,
    currentUser: MessageSender,
  ) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
}

const SOCKET_URL = "https://nexora-00xrp.sevalla.app";

export const useSocketStore = create<socketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  unreadChats: new Set(),
  currentChatId: null,
  queryClient: null,

  connect: (token, queryClient) => {
    const existingSocket = get().socket;

    if (existingSocket?.connected) return;

    if (existingSocket) existingSocket.disconnect();

    const socket = io(SOCKET_URL, { auth: { token } }); // initialised client side socket

    socket.on("connect", () => {
      console.log("socket got connected", socket.id);
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("socket got disconnected", socket.id);
      set({ isConnected: false });
    });

    //("") these are event names that we derived in the backend
    // whenever we emit anything from the backend, we have receive it like (userIds)
    // socket.on("getOnlineUsers", ({ userIds }: { userIds: string[] }) => {
    //   console.log("Got online users", userIds);
    //   set({ onlineUsers: new Set(userIds) });
    // });
    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("userOnline", ({ currentUserId }: { currentUserId: string }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, currentUserId]),
      }));
    });

    socket.on("userOffline", ({ userId }: { userId: string }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers: onlineUsers };
      });
    });

    socket.on("socket-error", ({ socketError }: { socketError: string }) => {
      console.log("error from socket", socketError);
      Sentry.logger.error("Socket Error", { socketError });
    });

    socket.on("new-message", (message: Message) => {
      const senderId = (message.senderId as MessageSender)._id;
      const { currentChatId } = get();
      // add message to the chat's message list, replacing optimistic (temp) messages
      queryClient.setQueryData<Message[]>(["messages", message.chat], (old) => {
        if (!old) return [message];
        // remove any optimistic messages (temp IDs) and add the real one
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        if (filtered.some((m) => m._id === message._id)) return filtered;
        return [...filtered, message];
      });
      // Update chat's lastMessage directly for instant UI update
      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        return oldChats?.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                text: message.text,
                sender: senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
            };
          }
          return chat;
        });
      });

      // mark as unread if not currently viewing this chat and message is from other user
      if (currentChatId !== message.chat) {
        const chats = queryClient.getQueryData<Chat[]>(["chats"]);
        const chat = chats?.find((c) => c._id === message.chat);
        if (chat?.otherParticipant && senderId === chat.otherParticipant._id) {
          set((state) => ({
            unreadChats: new Set([...state.unreadChats, message.chat]),
          }));
        }
      }

      // clear typing indicator when message received
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers: typingUsers };
      });
    });

    socket.on(
      "typing",
      ({
        chatId,
        userId,
        isTyping,
      }: {
        userId: String;
        chatId: string;
        isTyping: Boolean;
      }) => {
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          if (isTyping) typingUsers.set(chatId, userId);
          else typingUsers.delete(chatId);
          return { typingUsers: typingUsers };
        });
      },
    );

    set({ socket: socket, queryClient: queryClient });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      (socket.disconnect(),
        set({
          socket: null,
          isConnected: false,
          onlineUsers: new Set(),
          typingUsers: new Map(),
          unreadChats: new Set(),
          currentChatId: null,
          queryClient: null,
        }));
    }
  },

  joinChat: (chatId: string) => {
    const socket = get().socket;
    set((state) => {
      const unreadChats = new Set(state.unreadChats);
      unreadChats.delete(chatId);
      return { unreadChats: unreadChats };
    });

    if (socket?.connected) {
      socket.emit("join-chat", chatId);
    }
  },

  leaveChat: (chatId) => {
    const socket = get().socket;
    set({ currentChatId: null });
    if (socket?.connected) {
      socket.emit("leave-chat", chatId);
    }
  },

  sendMessage: (chatId: string, text: string, currentUser) => {
    const socket = get().socket;
    const queryClient = get().queryClient;

    if (!socket || !queryClient) return;
    //optimistic updates

    const tempId = `temp-${Date.now()}`;

    const tempMessage: Message = {
      _id: tempId,
      chat: chatId,
      senderId: currentUser,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    //update the UI with temp message immediatly
    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
      if (!old) return [tempMessage];
      return [...old, tempMessage];
    });

    socket?.emit("send-message", { chatId, text });
    //error handler method
    const errorHandler = (error: { message: string }) => {
      Sentry.logger.error("Failed to send message", {
        chatId,
        error: error.message,
      });
      queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });
      socket.off("socket-error", errorHandler);
    };

    socket.once("socket-error", errorHandler);
  },

  sendTyping: (chatId, isTyping) => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit("typing", chatId, isTyping);
    }
  },
}));

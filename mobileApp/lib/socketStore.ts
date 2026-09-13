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
    // text: string,
    encrypted: {
      cipherText: string | undefined;
      nonce: string | undefined;
    },
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

    socket.on("userOnline", ({ userId }: { userId: string }) => {
      if (!userId) return;
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
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
      const chatId = String(message.chatId ?? "");
      if (!chatId) return;

      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId._id;
      const { currentChatId } = get();
      // add message to the chat's message list, replacing optimistic (temp) messages
      queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
        if (!old) return [message];
        // remove any optimistic messages (temp IDs) and add the real one
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        if (filtered.some((m) => m._id === message._id)) return filtered;
        return [...filtered, message];
      });
      // Update chat's lastMessage directly for instant UI update
      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        if (!oldChats) return oldChats;
        const updated = oldChats.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                cipherText: message.cipherText,
                nonce: message.nonce,
                senderId:
                  typeof message.senderId === "string"
                    ? message.senderId
                    : message.senderId._id,
                createdAt: message.createdAt,
                isSoftDelete: message.isSoftDelete,
                isHardDelete: message.isHardDelete,
              },
              lastMessageAt: message.createdAt,
            };
          }
          return chat;
        });
        // keep the most recently messaged chat at the top
        return updated.sort((a, b) => {
          if (a._id === chatId) return -1;
          if (b._id === chatId) return 1;
          return 0;
        });
      });

      // mark as unread if not currently viewing this chat and message is from other user
      if (currentChatId !== chatId) {
        const chats = queryClient.getQueryData<Chat[]>(["chats"]);
        const chat = chats?.find((c) => c._id === chatId);
        if (chat?.otherParticipant && senderId === chat.otherParticipant._id) {
          set((state) => ({
            unreadChats: new Set([...state.unreadChats, chatId]),
          }));
        }
      }

      // clear typing indicator when message received
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(chatId);
        return { typingUsers: typingUsers };
      });
    });

    socket.on("message-editted", (message: Message) => {
      const chatId = String(message.chatId ?? "");
      queryClient.setQueryData<Message[]>(["messages", chatId], (old) =>
        old?.map((m) => (m._id === message._id ? { ...m, ...message } : m)),
      );
      // if this is lastMessage, update ["chats"] cipherText/nonce too
    });

    socket.on(
      "message-deleted",
      ({
        chatId,
        messageIds,
        type,
      }: {
        chatId: string;
        messageIds: string[];
        type: "soft" | "hard";
      }) => {
        if (!chatId || !messageIds?.length) return;
        const isHard = type === "hard";
        queryClient.setQueryData<Message[]>(["messages", chatId], (old) =>
          old?.map((m) =>
            messageIds.includes(m._id)
              ? {
                  ...m,
                  isHardDelete: isHard,
                  isSoftDelete: !isHard,
                  ...(isHard ? { cipherText: "", nonce: "" } : {}),
                }
              : m,
          ),
        );
        queryClient.setQueryData<Chat[]>(["chats"], (oldChats) =>
          oldChats?.map((chat) => {
            if (chat._id !== chatId) return chat;
            if (
              !chat.lastMessage ||
              !messageIds.includes(chat.lastMessage._id)
            ) {
              return chat;
            }
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                isHardDelete: isHard,
                isSoftDelete: !isHard,
                ...(isHard ? { cipherText: "", nonce: "" } : {}),
              },
            };
          }),
        );
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      },
    );

    socket.on(
      "typing",
      ({
        chatId,
        userId,
        isTyping,
      }: {
        userId: string;
        chatId: string;
        isTyping: boolean;
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
      return { unreadChats, currentChatId: chatId };
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

  sendMessage: (chatId: string, encrypted, currentUser) => {
    const socket = get().socket;
    const queryClient = get().queryClient;

    if (!socket || !queryClient) return;
    //optimistic updates

    const tempId = `temp-${Date.now()}`;

    const tempMessage: Message = {
      _id: tempId,
      chatId,
      senderId: currentUser,
      // text,
      cipherText: encrypted.cipherText,
      nonce: encrypted.nonce,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEditted: false,
    };

    //update the UI with temp message immediatly
    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
      if (!old) return [tempMessage];
      return [...old, tempMessage];
    });

    // socket?.emit("send-message", { chatId, text });
    socket.emit("send-message", {
      chatId,
      cipherText: encrypted.cipherText,
      nonce: encrypted.nonce,
    });
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
      socket.emit("typing", { chatId, isTyping });
    }
  },
}));

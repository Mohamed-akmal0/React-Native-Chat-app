import { Socket, Server as SocketServer } from "socket.io";
import { Server as httpServer } from "http";
import { verifyToken } from "@clerk/express";
import User from "../models/User";
import Chat from "../models/Chat";
import Message from "../models/Message";

interface SocketWithUser extends Socket {
  userId: string;
}

//store online users in memory: userId => set of socketIds
export const onlineUsers: Map<string, Set<string>> = new Map();

export const initializeSocket = (httpServer: httpServer) => {
  const allowedOrigins = [
    "https://localhost:8081",
    "https://localhost:5173",
    process.env.FRONTEND_URL as string,
  ];

  const io = new SocketServer(httpServer, {
    cors: { origin: allowedOrigins },
  });

  // verify socket connection - if the user is authenticated, we will store the user id in the socket

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; //  this is what the user send from the frontend
    if (!token) return next(new Error("Authentication error"));

    try {
      // verifying the token with clerk
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY as string,
      });
      if (!session) return next(new Error("Authentication Error"));
      const clerkId = session.sub;
      const user = await User.findOne({ clerkId });
      if (!user) return next(new Error("User not found!"));
      // type casting because userId is not in the socket type
      (socket as SocketWithUser).userId = user._id.toString();
      next();
    } catch (error: any) {
      next(new Error(error.message));
    }
  });

  //this "connection" event name is special and should be written like this
  //this is the even thtat is triggered when a new clent connects to the server
  io.on("connection", (socket) => {
    const userId = (socket as SocketWithUser).userId;

    //showing the list of online users to current user
    socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

    //storing the current user in onlineUsers map
    const isFirstConnection = !onlineUsers.has(userId);
    if (isFirstConnection) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    //showing current user as online to already online users (only on first connection)
    if (isFirstConnection) {
      socket.broadcast.emit("userOnline", { userId });
    }

    // user room for messages
    socket.join(`user:${userId}`);

    // user join to a private room for chat
    //listening to the event that coming from the frontend
    socket.on("join-chat", async (chatId: string) => {
      try {
        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });
        if (!chat) {
          socket.emit("socket-error", { message: "Chat not found!" });
          return;
        }
        socket.join(`chat:${chatId}`);
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to join chat!" });
      }
    });

    // user leave from a chat
    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    //handling sending messages
    socket.on(
      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;
          //checking chat is existed or not
          const chat = await Chat.findOne({
            _id: chatId,
            paricipants: userId,
          });
        
          if (!chat) {
            socket.emit("socket-error", { message: "Chat not found!" });
            return;
          }

          //creating a new message if chat is existed
          const message = await Message.create({
            chatId: chatId,
            senderId: userId,
            text,
          });

          chat.lastMessage = message._id;
          chat.lastMessageAt = new Date();
          await chat.save();

          await message.populate("senderId", "name email avatar");

          //emit to chat room for users inside the chat
          io.to(`chat:${chatId}`).emit("new-message", message);

          //emitting the same message to pariticpant message list
          for(const participant of chat.participants){
            io.to(`user:${participant}`).emit("new-message", message);
          }

        } catch (error) {
           socket.emit("socket-error", { message: "Failed to send message!" });
        }
      },
    );

    //handling typing event for the chat

    //handling disconnection
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user-offline", { userId });
        }
      }
    });
  });

  //returning the instance of the socket server
  return io;
};

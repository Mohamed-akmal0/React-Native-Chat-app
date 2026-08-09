import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Chat from "../models/Chat";
import Message from "../models/Message";

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    const chatId = req.params.chatId;
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "No chat found!" });
    // in message schema, we just add the senderId as mongoose id
    // so we only get the senderId in response
    // so if we give populate, it will follow up a lookup in the ref that we gave in the scheme and fetch the details that we want
    const messages = await Message.find({ chat: chatId })
      .populate("senderId", "name email avatar")
      .sort({ createdAt: 1 }); //older messages first!
    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

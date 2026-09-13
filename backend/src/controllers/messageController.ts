import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Chat from "../models/Chat";
import Message from "../models/Message";
import { getSocketIO } from "../utils/socket";

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
    const messages = await Message.find({ chatId: chatId })
      .populate("senderId", "name email avatar publicKey")
      .sort({ createdAt: 1 }); //older messages first!
    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    const messageId = req.params.messageId;
    // ! updated cipher text and nonce from the frontend
    const { cipherText, nonce } = req.body;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "No message found!" });
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: userId,
    });
    if (!chat) return res.status(404).json({ message: "No chat found!" });
    message.cipherText = cipherText;
    message.nonce = nonce;
    message.isEditted = true;
    await message.save();
    await message.populate("senderId", "name email avatar publicKey");

    const payload = message.toJSON();

    const io = getSocketIO();
    io.to(`chat:${message.chatId}`).emit("message-editted", payload);
    for (const participant of chat.participants) {
      io.to(`user:${participant.toString()}`).emit("message-editted", payload);
    }
    res.json(payload);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    const chatId = req.params.chatId;
    const { isSoftDelete, isHardDelete } = req.body;
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "No chat found!" });
    await Message.findOneAndUpdate(
      { chatId: chatId },
      { $set: { isSoftDelete: isSoftDelete, isHardDelete: isHardDelete } },
    );
  } catch (error) {
    res.status(500);
    next(error);
  }
};

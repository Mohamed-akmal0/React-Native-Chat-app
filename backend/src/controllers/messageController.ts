import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
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
    const messages = await Message.find({ chatId })
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
    const { messageIds, type } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "messageIds required" });
    }

    if (type !== "soft" && type !== "hard") {
      return res.status(400).json({ message: "type must be soft or hard" });
    }

    const allIdsValid = messageIds.every(
      (id: unknown) => typeof id === "string" && Types.ObjectId.isValid(id),
    );
    if (!allIdsValid) {
      return res.status(400).json({ message: "Invalid messageIds" });
    }

    const messages = await Message.find({ _id: { $in: messageIds } });
    const firstMessage = messages[0];
    if (!firstMessage) {
      return res.status(404).json({ message: "No messages found" });
    }

    const chatId = firstMessage.chatId;
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "No chat found" });

    const allInThisChat = messages.every(
      (message) => message.chatId.toString() === chatId.toString(),
    );
    if (!allInThisChat) {
      return res
        .status(400)
        .json({ message: "Messages must belong to one chat" });
    }

    const filter = {
      _id: { $in: messageIds },
      chatId,
      senderId: userId,
      isHardDelete: { $ne: true },
    };

    const ownedMessages = await Message.find(filter).select("_id");
    const deletedIds = ownedMessages.map((message) => message._id.toString());
    if (deletedIds.length === 0) {
      return res
        .status(403)
        .json({ message: "You can only delete your own messages" });
    }

    const update =
      type === "hard"
        ? {
            $set: {
              isHardDelete: true,
              isSoftDelete: false,
              cipherText: "",
              nonce: "",
            },
          }
        : { $set: { isSoftDelete: true } };

    await Message.updateMany({ _id: { $in: deletedIds } }, update);

    const payload = {
      chatId: chatId.toString(),
      messageIds: deletedIds,
      type,
    };

    const io = getSocketIO();
    if (type === "hard") {
      io.to(`chat:${chatId}`).emit("message-deleted", payload);
      for (const participant of chat.participants) {
        io.to(`user:${participant.toString()}`).emit(
          "message-deleted",
          payload,
        );
      }
    } else {
      io.to(`user:${userId}`).emit("message-deleted", payload);
    }

    res.json(payload);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

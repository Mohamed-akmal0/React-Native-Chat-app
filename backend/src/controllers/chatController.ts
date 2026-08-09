import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Chat from "../models/Chat";
import { Types } from "mongoose";

export const getChats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    const chats = await Chat.find({ participants: userId })
      //we have to call the populate function separately becuase only one populate can look up only one ref
      .populate("participants", "name email avatar ")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });
    if (!chats) return res.status(404).json({ message: "No chats found!" });

    // this is to format the chats to get rid of the current user chats
    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== userId.toString(),
      );
      return {
        _id: chat._id,
        otherParticipant: otherParticipant ?? null,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
      };
    });
    res.json(formattedChats);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

export const getOrCreateChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    const participantId = req.params.participantId;

    if (!participantId)
      return res.status(400).json({ message: "Participant ID is required!" });

    if(!Types.ObjectId.isValid(participantId as string))
      return res.status(400).json({ message: "Invalid participant ID!" });

    if (userId === participantId)
      return res
        .status(400)
        .json({ message: "You cannot chat with yourself!" });

    // check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
    })
      .populate("participants", "name email avatar ")
      .populate("lastMessage");
    if (!chat) {
      const newChat = new Chat({ participants: [userId, participantId] });
      await newChat.save();
      chat = await newChat.populate("participants", "name email avatar ");
    }
    const otherParticipant = chat.participants.find(
      (p) => p._id.toString() !== userId.toString(),
    );
    res.json({
      _id: chat._id,
      otherParticipant: otherParticipant ?? null,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

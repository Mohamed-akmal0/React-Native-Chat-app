import type { AuthRequest } from "../middleware/authMiddleware";
import type { Response, Request, NextFunction } from "express";
import User from "../models/User";
import { getAuth, clerkClient } from "@clerk/express";

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthRequest;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    res.status(500)
    next(error);
  }
};

export const authCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });
    let user = await User.findOne({ clerkId });
    if (!user) {
      //fetching the user details form clerk and saving to the database;
      const clerkUser = await clerkClient.users.getUser(clerkId);
      user = await User.create({
        clerkId,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0],
          email: clerkUser.emailAddresses[0]?.emailAddress,
          avatar: clerkUser.imageUrl
      });
    }
    res.json(user)
  } catch (error) {
    console.error(error);
    res.status(500)
    next(error);
  }
};

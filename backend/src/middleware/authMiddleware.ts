import type { NextFunction, Request, Response } from "express";
import { getAuth, requireAuth } from "@clerk/express";
import User from "../models/User";

//we can't call this type directly in the req arguments
//because this type says "I only accept requests that already have userId property"
//so we need to cast the request inside the function body
export type AuthRequest = Request & {
  userId: string;
};

export const protectRoute = [
  requireAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {userId: clerkId} = getAuth(req);
      //since we call requireAuth(), this if check is not needed
    //   if (!clerkId) return res.status(401).json({ message: "Unauthorized" });
      const user = await User.findOne({ clerkId });
      if (!user) return res.status(404).json({ message: "User not found" });
      (req as AuthRequest).userId = user._id.toString();
      next();
    } catch (error) {
      console.error(error);
      res.status(500)
      next(error);
    }
  },
];

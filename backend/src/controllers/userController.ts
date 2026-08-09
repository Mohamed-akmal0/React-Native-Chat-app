import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).userId;

    const users = await User.find({ _id: { $ne: userId } }).select(
      "name email avatar",
    ).limit(20);
    res.json(users);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

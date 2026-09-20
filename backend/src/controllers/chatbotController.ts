import type { NextFunction, Response, Request } from "express";
import { handleGemini, handleGpt } from "../helper/aiBotHelper";

export const getChatBotMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { provider, message, history, model } = req.body;

    switch (provider) {
      case "gemini":
        await handleGemini(message, history, model, res);
        return;
      case "gpt":
        await handleGpt(message, history, model, res);
        return;
      default:
        // Prevents the client from hanging on an unknown provider (mobile axios has a timeout, but this is cleaner).
        res
          .status(400)
          .json({ error: `Unknown provider: ${provider ?? "none"}` });
        return;
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500);
    }
    next(error);
  }
};

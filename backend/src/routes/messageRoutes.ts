import {Router}  from "express";
import { protectRoute } from "../middleware/authMiddleware";
import { getMessages } from "../controllers/messageController";

const router = Router();

router.get('/messages/:chatId', protectRoute, getMessages)

export default router;
import {Router}  from "express";
import { protectRoute } from "../middleware/authMiddleware";
import { getMessages, editMessage, deleteMessage } from "../controllers/messageController";

const router = Router();

router.get('/messages/:chatId', protectRoute, getMessages)
router.patch('/messages/:messageId/edit', protectRoute, editMessage)
router.patch('/messages/delete', protectRoute, deleteMessage)

export default router;
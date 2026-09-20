import { Router } from "express";
import { protectRoute } from "../middleware/authMiddleware";
import { getChatBotMessages } from "../controllers/chatbotController";

const router = Router();

router.post('/', protectRoute, getChatBotMessages)

export default router;
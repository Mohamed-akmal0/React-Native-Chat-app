import {Router}  from "express";
import { protectRoute } from "../middleware/authMiddleware";
import { getChats, getOrCreateChat } from "../controllers/chatController";

const router = Router();

//by using this, we don't have use protectRoute in each route
router.use(protectRoute);

router.get("/", getChats);
router.post("/with/:participantId", getOrCreateChat)

export default router;
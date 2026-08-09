import {Router}  from "express";
import { protectRoute } from "../middleware/authMiddleware";
import { getMe, authCallback } from "../controllers/authController";

const router = Router();

router.get("/me", protectRoute, getMe)
router.get("/callback", protectRoute, authCallback)


export default router;
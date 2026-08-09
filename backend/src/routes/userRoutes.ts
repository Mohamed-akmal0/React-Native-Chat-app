import {Router}  from "express";
import { protectRoute } from "../middleware/authMiddleware";
import { getUsers } from "../controllers/userController";

const router = Router();

router.get("/", protectRoute, getUsers);

export default router;
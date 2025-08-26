import { Router } from "express";
import { register, login, getUsers } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", authenticateToken, getUsers);

export default router;

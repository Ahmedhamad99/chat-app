import { Router } from "express";
import { 
  createConversation, 
  getUserConversations, 
  getConversationById 
} from "../controllers/conversation.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All conversation routes require authentication
router.use(authenticateToken);

router.post("/", createConversation);
router.get("/", getUserConversations);
router.get("/:id", getConversationById);

export default router;

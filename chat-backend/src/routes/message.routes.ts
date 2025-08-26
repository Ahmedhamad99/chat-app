import { Router } from "express";
import { 
  sendMessage, 
  getConversationMessages, 
  markMessageAsSeen 
} from "../controllers/message.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All message routes require authentication
router.use(authenticateToken);

router.post("/", sendMessage);
router.get("/conversation/:conversationId", getConversationMessages);
router.put("/:id/seen", markMessageAsSeen);

export default router;

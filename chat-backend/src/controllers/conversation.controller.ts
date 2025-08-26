import { Request, Response } from "express";
import * as ConversationService from "../services/conversation.service";

export async function createConversation(req: Request, res: Response) {
  try {
    const { participantIds } = req.body;
    const userId = (req as any).user.id; // From auth middleware

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: "At least one participant is required" });
    }

    // Add current user to participants if not already included
    const allParticipantIds = participantIds.includes(userId) 
      ? participantIds 
      : [userId, ...participantIds];

    const conversation = await ConversationService.createConversation(allParticipantIds);
    res.status(201).json(conversation);
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: error.message || "Failed to create conversation" });
  }
}

export async function getUserConversations(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id; // From auth middleware
    const conversations = await ConversationService.getUserConversations(userId);
    res.json(conversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: error.message || "Failed to fetch conversations" });
  }
}

export async function getConversationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id; // From auth middleware
    
    const conversation = await ConversationService.getConversationById(id, userId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.json(conversation);
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: error.message || "Failed to fetch conversation" });
  }
}

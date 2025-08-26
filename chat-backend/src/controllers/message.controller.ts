import { Request, Response } from "express";
import * as MessageService from "../services/message.service";

export async function sendMessage(req: Request, res: Response) {
  try {
    const { conversationId, type, text, imageUrl } = req.body;
    const senderId = (req as any).user.id; // From auth middleware

    if (!conversationId || !type) {
      return res.status(400).json({ error: "Conversation ID and message type are required" });
    }

    if (type === "TEXT" && !text) {
      return res.status(400).json({ error: "Text is required for text messages" });
    }

    if (type === "IMAGE" && !imageUrl) {
      return res.status(400).json({ error: "Image URL is required for image messages" });
    }

    const message = await MessageService.sendMessage({
      conversationId,
      senderId,
      type,
      text,
      imageUrl
    });

    res.status(201).json(message);
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message || "Failed to send message" });
  }
}

export async function getConversationMessages(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const userId = (req as any).user.id; // From auth middleware

    const messages = await MessageService.getConversationMessages(conversationId, userId);
    res.json(messages);
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message || "Failed to fetch messages" });
  }
}

export async function markMessageAsSeen(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id; // From auth middleware

    const message = await MessageService.markMessageAsSeen(id, userId);
    res.json(message);
  } catch (error: any) {
    console.error("Error marking message as seen:", error);
    res.status(500).json({ error: error.message || "Failed to mark message as seen" });
  }
}

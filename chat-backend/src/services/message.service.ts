import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SendMessageData {
  conversationId: string;
  senderId: string;
  type: string;
  text?: string;
  imageUrl?: string;
}

export async function sendMessage(data: SendMessageData) {
  try {
    const { conversationId, senderId, type, text, imageUrl } = data;

    // Verify sender is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: senderId
      }
    });

    if (!participant) {
      throw new Error("User is not a participant in this conversation");
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        type,
        text,
        imageUrl,
        deliveredAt: new Date()
      },
      include: {
        sender: true,
        conversation: {
          include: {
            participants: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return message;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}

export async function getConversationMessages(conversationId: string, userId: string) {
  try {
    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });

    if (!participant) {
      throw new Error("User is not a participant in this conversation");
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return messages;
  } catch (error) {
    console.error("Error in getConversationMessages:", error);
    throw error;
  }
}

export async function markMessageAsSeen(messageId: string, userId: string) {
  try {
    // Verify user is participant in conversation
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: {
              userId
            }
          }
        }
      }
    });

    if (!message) {
      throw new Error("Message not found or user not authorized");
    }

    // Mark message as seen
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { seenAt: new Date() },
      include: {
        sender: true
      }
    });

    return updatedMessage;
  } catch (error) {
    console.error("Error in markMessageAsSeen:", error);
    throw error;
  }
}

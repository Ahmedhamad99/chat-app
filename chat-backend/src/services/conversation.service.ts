import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createConversation(participantIds: string[]) {
  try {
    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: participantIds
            }
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: participantIds.map(userId => ({
            userId
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    return conversation;
  } catch (error) {
    console.error("Error in createConversation:", error);
    throw error;
  }
}

export async function getUserConversations(userId: string) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          include: {
            sender: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return conversations;
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    throw error;
  }
}

export async function getConversationById(conversationId: string, userId: string) {
  try {
    // Check if user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: {
            createdAt: "asc"
          },
          include: {
            sender: true
          }
        }
      }
    });

    return conversation;
  } catch (error) {
    console.error("Error in getConversationById:", error);
    throw error;
  }
}

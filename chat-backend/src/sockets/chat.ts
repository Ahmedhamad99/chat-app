// src/sockets/chat.ts
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export function setupChatSocket(io: Server) {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, avatarUrl: true }
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.name} (${socket.userId})`);

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Handle joining conversation
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, type, text, imageUrl } = data;
        
        if (!socket.userId) {
          socket.emit("error", "User not authenticated");
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId,
            type,
            text,
            imageUrl,
            deliveredAt: new Date()
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });

        // Broadcast message to all participants in the conversation
        io.to(`conversation_${conversationId}`).emit("new_message", message);

        // Emit delivery confirmation to sender
        socket.emit("message_sent", message);

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", "Failed to send message");
      }
    });

    // Handle typing indicator
    socket.on("typing_start", (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        userId: socket.userId,
        userName: socket.user?.name
      });
    });

    socket.on("typing_stop", (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit("user_stopped_typing", {
        userId: socket.userId
      });
    });

    // Handle message seen
    socket.on("mark_seen", async (messageId: string) => {
      try {
        if (!socket.userId) return;

        const message = await prisma.message.update({
          where: { id: messageId },
          data: { seenAt: new Date() }
        });

        // Notify other participants that message was seen
        socket.to(`conversation_${message.conversationId}`).emit("message_seen", {
          messageId,
          seenBy: socket.userId,
          seenAt: message.seenAt
        });

      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user?.name} (${socket.userId})`);
    });
  });
}

// src/hooks/useChatSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type ChatSocket = Socket & { connected: boolean };

export default function useChatSocket(token?: string) {
  const socketRef = useRef<ChatSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io("http://localhost:4000", {
      auth: { token },
      autoConnect: true,
    });

    socketRef.current = socket as ChatSocket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Optional: global error handler
    socket.on("error", (err: any) => console.error("Socket error:", err));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit("join:conversation", conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socketRef.current?.emit("leave:conversation", conversationId);
  };

  const sendMessage = (payload: { conversationId: string; text?: string; clientTempId?: string; imageUrl?: string }) => {
    socketRef.current?.emit("message:send", payload);
  };

  const markSeen = (conversationId: string, messageId: string) => {
    socketRef.current?.emit("message:markSeen", { conversationId, messageId });
  };

  const startTyping = (conversationId: string) => socketRef.current?.emit("typing:start", { conversationId });
  const stopTyping = (conversationId: string) => socketRef.current?.emit("typing:stop", { conversationId });

  return {
    socket: socketRef.current,
    connected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markSeen,
    startTyping,
    stopTyping,
  };
}

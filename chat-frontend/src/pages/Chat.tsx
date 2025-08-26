// src/pages/Chat.tsx
import React, { useEffect, useState, useRef } from "react";
import useChatSocket from "../hooks/useChatSocket";
import API from "../api/axios"; // axios instance
import Navbar from "../components/Navbar";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  clientTempId?: string | null;
};

export default function ChatPage() {
  const token = localStorage.getItem("token") || undefined;
  const { socket, joinConversation, sendMessage, markSeen, startTyping, stopTyping } = useChatSocket(token);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // New message handler
    socket.on("message:new", (msg: Message) => {
      // If new message belongs to active conversation -> append
      if (msg.conversationId === activeConv) {
        setMessages((prev) => [...prev, msg]);
        // send delivered ack (optional)
        socket.emit("message:delivered", { conversationId: msg.conversationId, messageId: msg.id });
      }

      // update conversation preview in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId ? { ...c, lastMessage: msg.text ?? (msg.imageUrl ? "📷 Image" : ""), updatedAt: msg.createdAt } : c
        )
      );
    });

    // seen
    socket.on("message:seen", ({ conversationId, messageId, seenBy }) => {
      // update message seenAt locally if present
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, seenAt: new Date().toISOString() } : m)));
    });

    // typing
    socket.on("typing", ({ conversationId, userId, isTyping }) => {
      // show typing indicator if needed
      // TODO: implement state to show typing for conversationId
      console.log("typing", conversationId, userId, isTyping);
    });

    return () => {
      socket.off("message:new");
      socket.off("message:seen");
      socket.off("typing");
    };
  }, [socket, activeConv]);

  useEffect(() => {
    // scroll to bottom when messages update
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    const res = await API.get("/conversations");
    setConversations(res.data);
  }

  async function openConversation(convId: string) {
    setActiveConv(convId);
    // join socket room
    joinConversation(convId);

    // fetch messages
    const res = await API.get(`/messages/${convId}`);
    setMessages(res.data);
    // mark all as read (optional): markSeen for last message
    const last = res.data[res.data.length - 1];
    if (last) markSeen(convId, last.id);
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!activeConv || !text.trim()) return;

    // optimistic message
    const tempId = "temp-" + Date.now();
    const optimistic: Message = {
      id: tempId,
      conversationId: activeConv,
      senderId: "me", // or decode from token
      text,
      createdAt: new Date().toISOString(),
      clientTempId: tempId,
    };
    setMessages((prev) => [...prev, optimistic]);

    // send over socket (server will persist + broadcast message:new with real id)
    sendMessage({ conversationId: activeConv, text, clientTempId: tempId });

    setText("");
  }

  return (
    <>
      <Navbar />
      <div className="container mt-3">
        <div className="row">
          <div className="col-4">
            <div className="list-group">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  className={`list-group-item list-group-item-action ${c.id === activeConv ? "active" : ""}`}
                  onClick={() => openConversation(c.id)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">{c.title || "Conversation"}</h5>
                    <small>{new Date(c.updatedAt).toLocaleTimeString()}</small>
                  </div>
                  <p className="mb-1 text-truncate">{c.lastMessage}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="col-8 d-flex flex-column">
            <div ref={messagesRef} className="flex-grow-1 border rounded p-3 mb-2" style={{ overflowY: "auto", height: 500 }}>
              {messages.map((m) => (
                <div key={m.id} className={`mb-2 ${m.senderId === "me" ? "text-end" : ""}`}>
                  <div className="d-inline-block p-2 rounded" style={{ background: m.senderId === "me" ? "#0d6efd" : "#f1f3f5", color: m.senderId === "me" ? "white" : "black" }}>
                    {m.text}
                  </div>
                  <div className="small text-muted">{new Date(m.createdAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { handleSend(e); }} className="d-flex">
              <input
                className="form-control me-2"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  startTyping(activeConv!);
                  // throttle stopTyping if needed
                }}
                placeholder="Type a message..."
              />
              <button className="btn btn-primary">Send</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/auth-client";
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Loader2, Send } from 'lucide-react';

interface Conversation {
  id: string;
  type: string;
  lastMessage: string | null;
  lastActivity: string;
  participants: { user: { id: string; firstName: string; lastName: string; imageUrl?: string } }[];
}

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string; imageUrl?: string };
  createdAt: string;
}

export default function MessagesPage() {
  const { user } = useUser();
  const { t } = useT();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', user?.id],
    queryFn: () => api.get(`/messaging/conversations/${user!.id}`).then((r) => r.data),
    enabled: !!user?.id,
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConv) return;
    api.get(`/messaging/conversations/${activeConv}/messages`)
      .then((r) => setMessages([...r.data].reverse()))
      .catch(() => {});
  }, [activeConv]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv || !user?.id || sending) return;
    setSending(true);
    try {
      const { data: msg } = await api.post(`/messaging/messages`, {
        conversationId: activeConv,
        senderId: user.id,
        content: newMessage,
      });
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch {}
    setSending(false);
  };

  const getOtherParticipant = (conv: Conversation) => {
    const other = conv.participants.find((p) => p.user.id !== user?.id);
    return other?.user || { firstName: "Inconnu", lastName: "" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">{t.header.messagesTooltip}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Aucune conversation</div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = activeConv === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv.id)}
                  className={`w-full text-left p-4 border-b border-border transition-colors ${
                    isActive
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {other.firstName?.[0]}{other.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {other.firstName} {other.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage || "Nouvelle conversation"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium">Sélectionnez une conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                      isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

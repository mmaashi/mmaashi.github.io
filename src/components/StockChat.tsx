"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StockContext {
  ticker: string;
  name: string;
  price: number | null;
  changePct: number | null;
  pe: string | null;
  eps: number | null;
  revenue: string | null;
  netMargin: string | null;
  divYield: string | null;
  sector: string | null;
  fairValue: number | null;
}

interface Props {
  stockContext: StockContext;
  locale: string;
}

const SUGGESTED_EN = [
  "Is this stock undervalued?",
  "Explain the P/E ratio",
  "What does this sector do?",
  "Is the dividend sustainable?",
];
const SUGGESTED_AR = [
  "هل السهم مقيّم بأقل من قيمته؟",
  "اشرح مضاعف الربحية",
  "ما هذا القطاع؟",
  "هل التوزيعات مستدامة؟",
];

export default function StockChat({ stockContext, locale }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAr = locale === "ar";

  useEffect(() => {
    if (open && messages.length === 0) {
      // Initial greeting
      setMessages([{
        role: "assistant",
        content: isAr
          ? `مرحباً! أنا مساعد SŪQAI. يمكنني الإجابة على أسئلتك حول ${stockContext.name} (${stockContext.ticker}). كيف يمكنني مساعدتك؟`
          : `Hi! I'm the SŪQAI assistant. Ask me anything about ${stockContext.name} (${stockContext.ticker}).`,
      }]);
    }
  }, [open, isAr, stockContext.name, stockContext.ticker, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter((m) => m.role !== "assistant" || newMessages.indexOf(m) > 0),
          stockContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = isAr ? SUGGESTED_AR : SUGGESTED_EN;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 999,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--c-gold), #b8940f)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(200,169,81,0.4)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label="Open AI chat"
      >
        {open ? <X size={22} color="#1a1a1a" /> : <MessageCircle size={22} color="#1a1a1a" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 28,
            zIndex: 998,
            width: 360,
            maxWidth: "calc(100vw - 56px)",
            height: 480,
            display: "flex",
            flexDirection: "column",
            background: "var(--c-elevated)",
            border: "1px solid var(--c-border-md)",
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--c-border)",
            background: "var(--c-base)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, rgba(200,169,81,0.2), rgba(200,169,81,0.05))",
              border: "1px solid var(--c-border-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={16} style={{ color: "var(--c-gold)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", lineHeight: 1.2 }}>
                {isAr ? "مساعد SŪQAI" : "SŪQAI Assistant"}
              </p>
              <p style={{ fontSize: 10, color: "var(--c-muted)" }}>
                {stockContext.ticker} · {isAr ? "ذكاء اصطناعي" : "AI-powered"}
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? (isAr ? "flex-start" : "flex-end") : (isAr ? "flex-end" : "flex-start"),
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "9px 13px",
                  borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, rgba(200,169,81,0.25), rgba(200,169,81,0.1))"
                    : "var(--c-card)",
                  border: `1px solid ${msg.role === "user" ? "var(--c-border-md)" : "var(--c-border)"}`,
                  fontSize: 13,
                  color: "var(--c-text)",
                  lineHeight: 1.55,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex" }}>
                <div style={{ padding: "9px 13px", borderRadius: "12px 12px 12px 4px", background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                  <Loader2 size={14} style={{ color: "var(--c-gold)", animation: "spin 1s linear infinite" }} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--c-red-bg)", border: "1px solid var(--c-red-ring)", fontSize: 12, color: "var(--c-red)" }}>
                {error}
              </div>
            )}

            {/* Suggestion chips (show when only greeting) */}
            {messages.length === 1 && !loading && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    style={{
                      padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                      background: "var(--c-base)", border: "1px solid var(--c-border-md)",
                      color: "var(--c-muted)", fontWeight: 500, transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-gold)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-border-md)")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--c-border)", display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isAr ? "اسأل عن السهم…" : "Ask about this stock…"}
              disabled={loading}
              style={{
                flex: 1,
                padding: "9px 14px",
                borderRadius: 24,
                background: "var(--c-base)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--c-gold)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: input.trim() && !loading ? "var(--c-gold)" : "var(--c-border)",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            >
              <Send size={15} color={input.trim() && !loading ? "#1a1a1a" : "var(--c-muted)"} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

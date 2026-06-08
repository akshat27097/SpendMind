import React, { useEffect, useState, useRef } from "react";
import { Brain, RefreshCw, Send, Bot, User as UserIcon } from "lucide-react";
import { coachApi } from "../api/index.js";
import ChatBubble from "../components/ChatBubble.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ReactMarkdown from 'react-markdown';

export default function AICoach() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "model", text: `Hi ${user?.name || "there"}! I'm your SpendMind AI Coach. Ask me anything about your spending, anomalies, or budget!` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await coachApi.getInsights();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load initial insights:", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle Chat Submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = { role: "user", text: chatInput };
    const currentHistory = [...chatHistory, newMessage];
    
    setChatHistory(currentHistory);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await coachApi.sendChat({ 
        chatMessage: chatInput, 
        chatHistory: currentHistory.slice(1) 
      });

      setChatHistory(prev => [...prev, { role: "model", text: response.data.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [...prev, { role: "model", text: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Coach</h1>
          <p className="page-subtitle">Personalized financial intelligence — powered by your own data</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card" style={{
        background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(0,229,160,0.05) 100%)",
        border: "1px solid rgba(0,229,160,0.12)",
        marginBottom: 24,
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "var(--accent-dim)", border: "1px solid rgba(0,229,160,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Brain size={26} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>
            SpendMind AI Coach
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Your coach analyzes anomaly patterns, budget utilization, and month-over-month trends 
            to generate personalized financial guidance.
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: 80, opacity: 0.4, animation: "pulse 1.5s ease infinite" }} />
          ))}
        </div>
      )}

      {/* Static Dashboard Insights */}
      {!loading && data && (
        <div style={{ marginBottom: 24 }}>
          {!data.summary_available && (
            <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>📊</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8 }}>No data for this month yet</div>
            </div>
          )}

          {data.messages?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.messages.map((msg, i) => (
                <ChatBubble key={i} {...msg} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Chatbot Interface */}
      <div className="card" style={{ display: "flex", flexDirection: "column", height: "500px", padding: 0 }}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)", borderRadius: "12px 12px 0 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Chat with your Financial Coach</div>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{ display: "flex", gap: "12px", alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              {msg.role === "model" && <div style={{ background: "var(--accent)", color: "white", padding: "8px", borderRadius: "50%", height: "fit-content" }}><Bot size={18} /></div>}
              
              <div style={{ 
                background: msg.role === "user" ? "var(--bg-elevated)" : "transparent",
                border: msg.role === "model" ? "1px solid var(--border)" : "none",
                padding: "12px 16px", borderRadius: "12px", fontSize: "0.9rem", lineHeight: "1.6",
                color: "var(--text-primary)", whiteSpace: "pre-wrap"
              }}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {msg.role === "user" && <div style={{ background: "var(--bg-elevated)", padding: "8px", borderRadius: "50%", height: "fit-content" }}><UserIcon size={18} /></div>}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={{ padding: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px" }}>
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)" }}
            disabled={isChatLoading}
          />
          <button type="submit" disabled={isChatLoading || !chatInput.trim()} style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", padding: "0 20px", cursor: "pointer" }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
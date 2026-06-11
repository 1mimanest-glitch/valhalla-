import { useState, useRef, useEffect } from "react";
import {
  createConversation, saveMessage, getMessages,
  updateConversationTitle, createAction, logSessionMetric,
  updateUserMemory, getUserMemory
} from "../lib/db";
import { useAuth } from "../lib/auth";

function parseActions(text) {
  const match = text.match(/---ACCIÓN---([\s\S]*?)(?:---|$)/);
  if (!match) return null;
  const block = match[1];
  const title = (block.match(/TÍTULO:\s*(.+)/) || [])[1]?.trim();
  const dateStr = (block.match(/FECHA:\s*(.+)/) || [])[1]?.trim();
  const prospect = (block.match(/PROSPECTO:\s*(.+)/) || [])[1]?.trim();
  if (!title) return null;
  return { title, dateStr, prospect };
}

function parseFilterResult(text) {
  if (text.includes("[PASA CON AJUSTES]") || text.includes("PASA CON AJUSTES")) return "pasa_con_ajustes";
  if (text.includes("[NO PASA]") || text.includes("NO PASA")) return "no_pasa";
  if (text.includes("[PASA]") || text.match(/\bPASA\b/)) return "pasa";
  return null;
}

function Message({ role, content }) {
  const isUser = role === "user";

  // Highlight sections in assistant messages
  const renderContent = (text) => {
    if (isUser) return text;
    return text
      .replace(/---INTERLOCUTOR---/g, "")
      .replace(/---FEEDBACK---/g, "\n─────────────────\n")
      .replace(/---VEREDICTO---/g, "\n─────────────────\n")
      .replace(/---ACCIÓN---[\s\S]*$/, "")
      .trim();
  };

  return (
    <div style={{
      display: "flex",
      gap: "10px",
      marginBottom: "16px",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start"
    }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
        background: isUser ? "var(--amber-bg)" : "var(--bg-3)",
        border: `0.5px solid ${isUser ? "var(--amber-dim)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em",
        color: isUser ? "var(--amber)" : "var(--text-2)"
      }}>
        {isUser ? "TÚ" : "IA"}
      </div>
      <div style={{
        maxWidth: "80%",
        background: isUser ? "var(--bg-3)" : "var(--bg-2)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: "14px", lineHeight: "1.65",
        color: "var(--text-0)",
        whiteSpace: "pre-wrap"
      }}>
        {renderContent(content)}
      </div>
    </div>
  );
}

export default function Chat({ systemPrompt, module, persona, initialMessage, onActionDetected }) {
  const { user, profile } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    init();
  }, [module, persona]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function init() {
    setMessages([{ role: "assistant", content: initialMessage }]);
    setConversationId(null);
    setMsgCount(0);
  }

  async function getOrCreateConversation() {
    if (conversationId) return conversationId;
    const conv = await createConversation(user.id, module, persona);
    setConversationId(conv.id);
    return conv.id;
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const convId = await getOrCreateConversation();
      await saveMessage(convId, "user", userText);

      // Load memory for context
      const memory = await getUserMemory(user.id);
      const memoryContext = module.startsWith("captacion")
        ? memory?.commercial_context
        : memory?.digital_context;

      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages
        })
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || "Error al conectar.";

      await saveMessage(convId, "assistant", reply);

      const updatedMessages = [...newMessages, { role: "assistant", content: reply }];
      setMessages(updatedMessages);
      const newCount = msgCount + 1;
      setMsgCount(newCount);

      // Auto-title after 2nd exchange
      if (newCount === 2) {
        const title = userText.slice(0, 60) + (userText.length > 60 ? "..." : "");
        await updateConversationTitle(convId, title);
      }

      // Detect actions from seguimiento module
      if (module === "captacion_seguimiento") {
        const action = parseActions(reply);
        if (action && onActionDetected) {
          onActionDetected(action, convId);
        }
      }

      // Detect filter result for metrics
      if (module === "digital_filtro") {
        const filterResult = parseFilterResult(reply);
        if (filterResult) {
          await logSessionMetric({
            user_id: user.id,
            conversation_id: convId,
            module,
            messages_count: newCount,
            filter_result: filterResult,
            session_date: new Date().toISOString().split("T")[0]
          });
        }
      }

      // Update memory summary every 4 messages
      if (newCount % 4 === 0) {
        await updateMemory(updatedMessages, memory);
      }

    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Error de conexión." }]);
    }
    setLoading(false);
  }

  async function updateMemory(msgs, currentMemory) {
    try {
      const summaryRes = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: "Eres un asistente que resume conversaciones en JSON conciso.",
          messages: [{
            role: "user",
            content: `Resume en máximo 150 palabras los puntos clave de esta conversación para recordarlos en futuras sesiones. Enfócate en prospectos mencionados, objeciones encontradas, aprendizajes del usuario y próximas acciones. Responde solo con texto plano, sin JSON.\n\nConversación:\n${msgs.slice(-8).map(m => `${m.role}: ${m.content}`).join("\n")}`
          }]
        })
      });
      const summaryData = await summaryRes.json();
      const summary = summaryData.content?.[0]?.text;
      if (!summary) return;

      const isCommercial = module.startsWith("captacion");
      await updateUserMemory(user.id, isCommercial
        ? { commercial_context: summary }
        : { digital_context: summary }
      );
    } catch { /* silent */ }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "var(--bg-3)", border: "0.5px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", color: "var(--text-2)"
            }}>IA</div>
            <div style={{
              background: "var(--bg-2)", border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              fontSize: "14px", color: "var(--text-2)"
            }}>Pensando...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{
        padding: "12px 16px",
        borderTop: "0.5px solid var(--border)",
        display: "flex", gap: "8px", alignItems: "flex-end"
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu mensaje... (Enter para enviar)"
          rows={2}
          style={{
            flex: 1, resize: "none",
            background: "var(--bg-2)", border: "0.5px solid var(--border-md)",
            borderRadius: "var(--radius-md)", padding: "10px 12px",
            color: "var(--text-0)", fontSize: "14px", lineHeight: "1.5"
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 14px",
            background: "transparent",
            border: `0.5px solid ${loading || !input.trim() ? "var(--border)" : "var(--amber-dim)"}`,
            borderRadius: "var(--radius-md)",
            color: loading || !input.trim() ? "var(--text-3)" : "var(--amber)",
            fontSize: "18px", display: "flex", alignItems: "center"
          }}
        >
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  );
}

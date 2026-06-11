import { useState } from "react";
import Chat from "./Chat";
import {
  buildCaptacionSystem, buildSeguimientoSystem, PERFILES
} from "../lib/prompts";
import { useAuth } from "../lib/auth";
import { getUserMemory, createAction } from "../lib/db";

export default function Captacion() {
  const { user, profile } = useAuth();
  const [view, setView] = useState(null); // null | 'practica' | 'seguimiento'
  const [perfil, setPerfil] = useState(null);
  const [actionToast, setActionToast] = useState(null);

  async function handleActionDetected(action, convId) {
    const dueDate = action.dateStr?.includes("días")
      ? new Date(Date.now() + parseInt(action.dateStr) * 86400000).toISOString().split("T")[0]
      : new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

    await createAction({
      title: action.title,
      description: action.prospect ? `Relacionado con: ${action.prospect}` : null,
      due_date: dueDate,
      assigned_to: user.id,
      conversation_id: convId,
      created_by: user.id
    });
    setActionToast(action.title);
    setTimeout(() => setActionToast(null), 4000);
  }

  async function getSystem(module, perfilKey = null) {
    const memory = await getUserMemory(user.id);
    const memCtx = memory?.commercial_context;
    if (module === "seguimiento") return buildSeguimientoSystem(memCtx);
    const perfilData = PERFILES[perfilKey];
    return buildCaptacionSystem(perfilData.system, memCtx);
  }

  if (view === "practica" && !perfil) {
    return (
      <div style={{ padding: "24px", maxWidth: "520px" }}>
        <BackBtn onClick={() => setView(null)} />
        <h2 style={{ fontSize: "16px", fontWeight: 500, marginBottom: "6px" }}>Práctica de conversación</h2>
        <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "24px" }}>
          Elige el perfil con el que quieres practicar el pitch.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.entries(PERFILES).map(([key, p]) => (
            <button key={key} onClick={() => setPerfil(key)} style={cardStyle}>
              <i className={`ti ${p.icon}`} style={{ fontSize: "22px", color: "var(--text-2)" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-0)", marginBottom: "3px" }}>{p.label}</div>
                <div style={{ fontSize: "12px", color: "var(--text-2)" }}>{p.desc}</div>
              </div>
              <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)", fontSize: "16px" }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === "practica" && perfil) {
    const p = PERFILES[perfil];
    const intro = `Listo. Vas a hablar con un ${p.label.toLowerCase()}.\n\nEscribe lo que dirías para abrir la conversación: puede ser un mensaje de WhatsApp, una llamada en frío, o una visita. Tú decides el contexto.\n\nYo reaccionaré como el interlocutor y te daré feedback inmediato en cada turno.`;

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={headerStyle}>
          <BackBtn onClick={() => { setPerfil(null); }} />
          <i className={`ti ${p.icon}`} style={{ fontSize: "16px", color: "var(--text-2)" }} />
          <span style={{ fontSize: "13px", color: "var(--text-1)" }}>{p.label}</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <AsyncChat
            getSystem={() => getSystem("practica", perfil)}
            module="captacion_practica"
            persona={perfil}
            initialMessage={intro}
          />
        </div>
        {actionToast && <ActionToast msg={actionToast} />}
      </div>
    );
  }

  if (view === "seguimiento") {
    const intro = `Cuéntame qué pasos has dado con tus prospectos: llamadas, visitas, mensajes, reuniones, respuestas...\n\nAnalizaré lo que has hecho y te diré cuál es el siguiente movimiento más inteligente. Si identifico una acción concreta, la añado automáticamente al calendario del equipo.`;
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={headerStyle}>
          <BackBtn onClick={() => setView(null)} />
          <i className="ti ti-route" style={{ fontSize: "16px", color: "var(--text-2)" }} />
          <span style={{ fontSize: "13px", color: "var(--text-1)" }}>Asesor de seguimiento</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <AsyncChat
            getSystem={() => getSystem("seguimiento")}
            module="captacion_seguimiento"
            initialMessage={intro}
            onActionDetected={handleActionDetected}
          />
        </div>
        {actionToast && <ActionToast msg={actionToast} />}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "520px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 500, marginBottom: "6px" }}>Captación B2B</h2>
      <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "24px" }}>
        Practica el pitch y gestiona tu proceso comercial.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={() => setView("practica")} style={cardStyle}>
          <i className="ti ti-messages" style={{ fontSize: "22px", color: "var(--text-2)" }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-0)", marginBottom: "3px" }}>Práctica de conversación</div>
            <div style={{ fontSize: "12px", color: "var(--text-2)" }}>Simula negociaciones reales. Feedback en cada respuesta.</div>
          </div>
          <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)", fontSize: "16px" }} />
        </button>
        <button onClick={() => setView("seguimiento")} style={cardStyle}>
          <i className="ti ti-route" style={{ fontSize: "22px", color: "var(--text-2)" }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-0)", marginBottom: "3px" }}>Asesor de seguimiento</div>
            <div style={{ fontSize: "12px", color: "var(--text-2)" }}>Cuéntame tus pasos y te digo el siguiente movimiento más inteligente.</div>
          </div>
          <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)", fontSize: "16px" }} />
        </button>
      </div>
    </div>
  );
}

// Async wrapper to load system prompt before rendering Chat
function AsyncChat({ getSystem, module, persona, initialMessage, onActionDetected }) {
  const [system, setSystem] = useState(null);

  useState(() => {
    getSystem().then(setSystem);
  });

  if (!system) return (
    <div style={{ padding: "24px", color: "var(--text-2)", fontSize: "14px" }}>Cargando...</div>
  );

  return (
    <Chat
      systemPrompt={system}
      module={module}
      persona={persona}
      initialMessage={initialMessage}
      onActionDetected={onActionDetected}
    />
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", color: "var(--text-2)",
      padding: "4px", display: "flex", alignItems: "center"
    }}>
      <i className="ti ti-arrow-left" style={{ fontSize: "18px" }} />
    </button>
  );
}

function ActionToast({ msg }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "var(--bg-3)", border: "0.5px solid var(--amber-dim)",
      borderRadius: "var(--radius-md)", padding: "10px 16px",
      fontSize: "13px", color: "var(--amber)", display: "flex", gap: "8px",
      alignItems: "center", zIndex: 100
    }}>
      <i className="ti ti-calendar-plus" style={{ fontSize: "16px" }} />
      Acción añadida al calendario: {msg}
    </div>
  );
}

const cardStyle = {
  background: "var(--bg-2)",
  border: "0.5px solid var(--border-md)",
  borderRadius: "var(--radius-lg)",
  padding: "16px", cursor: "pointer", textAlign: "left",
  display: "flex", gap: "14px", alignItems: "center",
  width: "100%"
};

const headerStyle = {
  padding: "10px 14px",
  borderBottom: "0.5px solid var(--border)",
  display: "flex", gap: "8px", alignItems: "center"
};

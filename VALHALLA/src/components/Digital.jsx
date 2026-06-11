import { useState } from "react";
import Chat from "./Chat";
import { buildDigitalSystem } from "../lib/prompts";
import { useAuth } from "../lib/auth";
import { getUserMemory } from "../lib/db";

const MODES = {
  ideas: {
    label: "Generar ideas",
    icon: "ti-bulb",
    desc: "Pídeme ideas de posts, campañas o estrategias. Propongo opciones que encajan con la marca.",
    module: "digital_ideas",
    intro: `Soy tu director de estrategia digital de Valhalla.\n\nDime qué necesitas: ideas para posts, una campaña, contenido para web, estrategia para el canal B2B, preparación para la Velada del Año...\n\nCuanto más contexto me des (canal, objetivo, momento), más útil seré.`,
    placeholder: "¿Qué necesitas? Canal, objetivo, contexto..."
  },
  filtro: {
    label: "Filtro Valhalla",
    icon: "ti-filter",
    desc: "Trae tu contenido. Lo evalúo contra el ADN de la marca y te doy veredicto claro.",
    module: "digital_filtro",
    intro: `Tráeme lo que hayas creado: un post, una idea de campaña, un texto, un concepto visual...\n\nLo paso por el filtro Valhalla:\n\nPASA — encaja con la marca\nPASA CON AJUSTES — buena base, hay que corregir\nNO PASA — explico qué falla y cómo arreglarlo\n\nSé específico en lo que traes.`,
    placeholder: "Pega tu texto, idea o describe el contenido a validar..."
  }
};

export default function Digital() {
  const { user } = useAuth();
  const [mode, setMode] = useState(null);
  const [system, setSystem] = useState(null);

  async function selectMode(key) {
    const memory = await getUserMemory(user.id);
    const sys = buildDigitalSystem(memory?.digital_context);
    setSystem(sys);
    setMode(key);
  }

  if (mode && system) {
    const cfg = MODES[mode];
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={headerStyle}>
          <button onClick={() => { setMode(null); setSystem(null); }} style={backBtnStyle}>
            <i className="ti ti-arrow-left" style={{ fontSize: "18px" }} />
          </button>
          <i className={`ti ${cfg.icon}`} style={{ fontSize: "16px", color: "var(--text-2)" }} />
          <span style={{ fontSize: "13px", color: "var(--text-1)" }}>{cfg.label}</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Chat
            systemPrompt={system}
            module={cfg.module}
            initialMessage={cfg.intro}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "520px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 500, marginBottom: "6px" }}>Estrategia digital</h2>
      <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "24px" }}>
        Diseña comunicación que pase el filtro Valhalla.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Object.entries(MODES).map(([key, cfg]) => (
          <button key={key} onClick={() => selectMode(key)} style={cardStyle}>
            <i className={`ti ${cfg.icon}`} style={{ fontSize: "22px", color: "var(--text-2)" }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-0)", marginBottom: "3px" }}>{cfg.label}</div>
              <div style={{ fontSize: "12px", color: "var(--text-2)" }}>{cfg.desc}</div>
            </div>
            <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)", fontSize: "16px" }} />
          </button>
        ))}
      </div>
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

const backBtnStyle = {
  background: "none", border: "none", color: "var(--text-2)",
  padding: "4px", display: "flex", alignItems: "center"
};

import { useState, useEffect } from "react";
import {
  getDashboardSummary, getPipelineSummary,
  getActions, completeAction, getProspects, upsertProspect
} from "../lib/db";
import { useAuth } from "../lib/auth";

const STATUS_LABELS = {
  identificado: "Identificado",
  contactado: "Contactado",
  reunion: "Reunión",
  negociando: "Negociando",
  cerrado: "Cerrado",
  descartado: "Descartado"
};

const STATUS_COLORS = {
  identificado: "var(--text-3)",
  contactado: "#4a8fd4",
  reunion: "#ef9f27",
  negociando: "#9f7aea",
  cerrado: "#48bb78",
  descartado: "var(--text-3)"
};

const TYPE_LABELS = {
  gimnasio_pueblo: "Gimn. pueblo",
  gimnasio_ciudad: "Gimn. ciudad",
  entrenador: "Entrenador",
  otro: "Otro"
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [actions, setActions] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [newProspect, setNewProspect] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [s, p, a, pr] = await Promise.all([
      getDashboardSummary(),
      getPipelineSummary(),
      getActions({ status: "pendiente" }),
      getProspects()
    ]);
    setSummary(s);
    setPipeline(p);
    setActions(a);
    setProspects(pr);
    setLoading(false);
  }

  async function handleComplete(id) {
    await completeAction(id);
    setActions(actions.filter(a => a.id !== id));
  }

  async function handleSaveProspect(data) {
    await upsertProspect(data);
    setNewProspect(null);
    load();
  }

  if (loading) {
    return <div style={{ padding: "24px", color: "var(--text-2)", fontSize: "14px" }}>Cargando...</div>;
  }

  const totalProspects = prospects.length;
  const closedProspects = prospects.filter(p => p.status === "cerrado").length;
  const pendingActions = actions.length;
  const totalSessions = summary.reduce((acc, u) => acc + (u.total_conversations || 0), 0);

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {[
          { key: "overview", label: "Resumen" },
          { key: "pipeline", label: "Pipeline" },
          { key: "calendar", label: "Acciones" },
          ...(profile?.role === "admin" ? [{ key: "team", label: "Equipo" }] : [])
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "6px 14px", border: "0.5px solid",
            borderColor: tab === t.key ? "var(--amber-dim)" : "var(--border)",
            borderRadius: "var(--radius-sm)",
            background: tab === t.key ? "var(--amber-bg)" : "transparent",
            color: tab === t.key ? "var(--amber)" : "var(--text-2)",
            fontSize: "13px", cursor: "pointer"
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
            {[
              { label: "Prospectos", value: totalProspects, icon: "ti-building" },
              { label: "Cerrados", value: closedProspects, icon: "ti-check" },
              { label: "Acciones pend.", value: pendingActions, icon: "ti-calendar" },
              { label: "Sesiones", value: totalSessions, icon: "ti-messages" }
            ].map(k => (
              <div key={k.label} style={{
                background: "var(--bg-2)", border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "14px"
              }}>
                <div style={{ fontSize: "11px", color: "var(--text-2)", marginBottom: "6px", display: "flex", gap: "6px", alignItems: "center" }}>
                  <i className={`ti ${k.icon}`} style={{ fontSize: "14px" }} />
                  {k.label}
                </div>
                <div style={{ fontSize: "24px", fontWeight: 500, color: "var(--text-0)" }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Pipeline mini */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-2)", letterSpacing: "0.08em", marginBottom: "12px" }}>PIPELINE</div>
            {Object.entries(STATUS_LABELS).filter(([k]) => k !== "descartado").map(([status, label]) => {
              const count = prospects.filter(p => p.status === status).length;
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "90px", fontSize: "12px", color: "var(--text-2)" }}>{label}</div>
                  <div style={{ flex: 1, height: "4px", background: "var(--bg-3)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "2px",
                      background: STATUS_COLORS[status],
                      width: `${totalProspects > 0 ? (count / totalProspects) * 100 : 0}%`,
                      transition: "width 0.3s"
                    }} />
                  </div>
                  <div style={{ width: "20px", textAlign: "right", fontSize: "12px", color: "var(--text-1)" }}>{count}</div>
                </div>
              );
            })}
          </div>

          {/* Próximas acciones */}
          {actions.slice(0, 3).length > 0 && (
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-2)", letterSpacing: "0.08em", marginBottom: "12px" }}>PRÓXIMAS ACCIONES</div>
              {actions.slice(0, 3).map(a => (
                <ActionRow key={a.id} action={a} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "pipeline" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", color: "var(--text-2)" }}>{prospects.length} prospectos</div>
            <button onClick={() => setNewProspect({})} style={{
              background: "transparent", border: "0.5px solid var(--amber-dim)",
              borderRadius: "var(--radius-sm)", padding: "6px 12px",
              color: "var(--amber)", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center"
            }}>
              <i className="ti ti-plus" /> Añadir
            </button>
          </div>

          {newProspect !== null && (
            <ProspectForm
              onSave={handleSaveProspect}
              onCancel={() => setNewProspect(null)}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {prospects.map(p => (
              <div key={p.id} style={{
                background: "var(--bg-2)", border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "12px 14px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-0)", marginBottom: "3px" }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                      {TYPE_LABELS[p.type]} {p.location ? `· ${p.location}` : ""}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px", padding: "3px 8px", borderRadius: "4px",
                    background: "var(--bg-3)",
                    color: STATUS_COLORS[p.status] || "var(--text-2)"
                  }}>{STATUS_LABELS[p.status]}</span>
                </div>
                {p.notes && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.5" }}>
                    {p.notes}
                  </div>
                )}
              </div>
            ))}
            {prospects.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-2)", fontSize: "13px" }}>
                Sin prospectos aún. El asesor de seguimiento los irá registrando.
              </div>
            )}
          </div>
        </>
      )}

      {tab === "calendar" && (
        <>
          <div style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "16px" }}>
            {actions.length} acciones pendientes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {actions.map(a => (
              <ActionRow key={a.id} action={a} onComplete={handleComplete} showDate />
            ))}
            {actions.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-2)", fontSize: "13px" }}>
                Sin acciones pendientes.
              </div>
            )}
          </div>
        </>
      )}

      {tab === "team" && profile?.role === "admin" && (
        <>
          <div style={{ fontSize: "11px", color: "var(--text-2)", letterSpacing: "0.08em", marginBottom: "16px" }}>ACTIVIDAD DEL EQUIPO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {summary.map(u => (
              <div key={u.user_id} style={{
                background: "var(--bg-2)", border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "14px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-0)" }}>{u.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                    {u.last_activity ? new Date(u.last_activity).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "Sin actividad"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <Stat label="Sesiones" value={u.total_conversations || 0} />
                  <Stat label="Captación" value={u.captacion_sessions || 0} />
                  <Stat label="Digital" value={u.digital_sessions || 0} />
                  <Stat label="Mensajes" value={u.total_messages || 0} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "18px", fontWeight: 500, color: "var(--text-0)" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--text-2)" }}>{label}</div>
    </div>
  );
}

function ActionRow({ action, onComplete, showDate }) {
  const isOverdue = new Date(action.due_date) < new Date();
  return (
    <div style={{
      background: "var(--bg-2)", border: "0.5px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "12px 14px",
      display: "flex", gap: "10px", alignItems: "flex-start"
    }}>
      <button onClick={() => onComplete(action.id)} style={{
        width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
        border: "0.5px solid var(--border-md)", background: "transparent",
        cursor: "pointer", marginTop: "2px"
      }} title="Marcar como completada" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", color: "var(--text-0)", marginBottom: "2px" }}>{action.title}</div>
        <div style={{ fontSize: "11px", color: isOverdue ? "#e24b4a" : "var(--text-2)", display: "flex", gap: "8px" }}>
          {showDate && <span>{new Date(action.due_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>}
          {action.profiles?.name && <span>→ {action.profiles.name}</span>}
          {action.prospects?.name && <span>· {action.prospects.name}</span>}
        </div>
      </div>
    </div>
  );
}

function ProspectForm({ onSave, onCancel }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", type: "gimnasio_pueblo", status: "identificado", location: "", notes: "" });

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div style={{
      background: "var(--bg-2)", border: "0.5px solid var(--amber-dim)",
      borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "16px"
    }}>
      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-1)", marginBottom: "12px" }}>Nuevo prospecto</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nombre del negocio" style={inputStyle} />
        <div style={{ display: "flex", gap: "8px" }}>
          <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Localización (opcional)" style={inputStyle} />
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Notas..." rows={2} style={{ ...inputStyle, resize: "none" }} />
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => onSave({ ...form, created_by: user.id, assigned_to: user.id })} disabled={!form.name} style={{
            flex: 1, padding: "8px", background: "var(--amber)", border: "none",
            borderRadius: "var(--radius-sm)", color: "#0e0e0d", fontSize: "13px", fontWeight: 500
          }}>Guardar</button>
          <button onClick={onCancel} style={{
            padding: "8px 14px", background: "transparent",
            border: "0.5px solid var(--border-md)", borderRadius: "var(--radius-sm)",
            color: "var(--text-2)", fontSize: "13px"
          }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "8px 10px", background: "var(--bg-3)",
  border: "0.5px solid var(--border-md)", borderRadius: "var(--radius-sm)",
  color: "var(--text-0)", fontSize: "13px", width: "100%"
};

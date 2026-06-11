import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const err = await signIn(email, password);
    if (err) setError("Credenciales incorrectas");
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px",
      background: "var(--bg-0)"
    }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ marginBottom: "40px" }}>
          <div style={{
            fontSize: "10px", letterSpacing: "0.2em", color: "var(--amber)",
            marginBottom: "12px", fontWeight: 500
          }}>VALHALLA</div>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--text-0)", marginBottom: "6px" }}>
            Centro de operaciones
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-2)" }}>
            Acceso restringido al equipo
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-2)", display: "block", marginBottom: "6px", letterSpacing: "0.05em" }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "10px 12px",
                background: "var(--bg-2)", border: "0.5px solid var(--border-md)",
                borderRadius: "var(--radius-md)", color: "var(--text-0)",
                fontSize: "14px"
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-2)", display: "block", marginBottom: "6px", letterSpacing: "0.05em" }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "10px 12px",
                background: "var(--bg-2)", border: "0.5px solid var(--border-md)",
                borderRadius: "var(--radius-md)", color: "var(--text-0)",
                fontSize: "14px"
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "12px", color: "#e24b4a" }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{
              padding: "12px",
              background: loading ? "var(--bg-3)" : "var(--amber)",
              border: "none",
              borderRadius: "var(--radius-md)",
              color: loading ? "var(--text-2)" : "#0e0e0d",
              fontSize: "14px", fontWeight: 500,
              marginTop: "4px",
              transition: "background 0.15s"
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

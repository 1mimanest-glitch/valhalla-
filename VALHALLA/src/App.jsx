import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Captacion from "./components/Captacion";
import Digital from "./components/Digital";

const NAV = [
  { key: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
  { key: "captacion", icon: "ti-handshake", label: "Captación" },
  { key: "digital", icon: "ti-brand-instagram", label: "Digital" }
];

function Shell() {
  const { profile, loading, signOut } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--bg-0)"
      }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--amber)" }}>VALHALLA</div>
      </div>
    );
  }

  if (!profile) return <Login />;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg-0)"
    }}>
      {/* Top bar */}
      <div style={{
        height: "48px", display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "0.5px solid var(--border)",
        background: "var(--bg-1)", flexShrink: 0,
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            fontSize: "10px", letterSpacing: "0.2em",
            color: "var(--amber)", fontWeight: 600
          }}>VALHALLA</span>
          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>—</span>
          <span style={{ fontSize: "11px", color: "var(--text-2)" }}>
            {NAV.find(n => n.key === page)?.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{profile.name}</span>
          <button onClick={signOut} style={{
            background: "none", border: "none", color: "var(--text-3)",
            cursor: "pointer", padding: "4px", display: "flex", alignItems: "center"
          }}>
            <i className="ti ti-logout" style={{ fontSize: "16px" }} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {page === "dashboard" && <Dashboard />}
          {page === "captacion" && <Captacion />}
          {page === "digital" && <Digital />}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        height: "56px", display: "flex",
        borderTop: "0.5px solid var(--border)",
        background: "var(--bg-1)", flexShrink: 0
      }}>
        {NAV.map(n => {
          const active = page === n.key;
          return (
            <button key={n.key} onClick={() => setPage(n.key)} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "3px",
              background: "none", border: "none",
              borderTop: `2px solid ${active ? "var(--amber)" : "transparent"}`,
              cursor: "pointer"
            }}>
              <i className={`ti ${n.icon}`} style={{
                fontSize: "20px",
                color: active ? "var(--amber)" : "var(--text-3)"
              }} />
              <span style={{
                fontSize: "10px", letterSpacing: "0.05em",
                color: active ? "var(--amber)" : "var(--text-3)"
              }}>{n.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

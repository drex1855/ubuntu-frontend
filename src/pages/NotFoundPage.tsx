import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        textAlign: "center",
        padding: "var(--space-5)",
      }}
    >
      <span style={{ fontSize: 40, fontWeight: 700, color: "var(--accent-strong)" }}>404</span>
      <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>
        La página que buscas no existe o fue movida.
      </p>
      <Link to="/dashboard" style={{ fontSize: 13 }}>
        Volver al panel general
      </Link>
    </div>
  );
}

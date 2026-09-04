import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../ui/Button";
import { roleLabel } from "../../utils/format";
import styles from "./Topbar.module.css";

export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (session?.fullName ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.titleGroup}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="Abrir menú de navegación"
        >
          ☰
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <div className={styles.actions}>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden="true">
            {initials || "?"}
          </div>
          <div className={styles.identityText}>
            <span className={styles.name}>{session?.fullName}</span>
            <span className={styles.role}>{session ? roleLabel(session.role) : ""}</span>
          </div>
        </div>
        <Button variant="secondary" size="small" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}

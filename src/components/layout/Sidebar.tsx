import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import styles from "./Sidebar.module.css";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  staffOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Panel general", icon: "▦" },
  { to: "/cuentas", label: "Cuentas de modelos", icon: "◈", staffOnly: true },
  { to: "/tienda", label: "Tienda", icon: "▤" },
  { to: "/tokens", label: "Reporte de tokens", icon: "◎", staffOnly: true },
  { to: "/checklists", label: "Checklist de habitaciones", icon: "☑", staffOnly: true },
  { to: "/contactos", label: "WhatsApp", icon: "◔", staffOnly: true },
  { to: "/prestamos", label: "Préstamos", icon: "$" },
  { to: "/multas", label: "Multas", icon: "⚑", staffOnly: true },
  { to: "/horas", label: "Horas", icon: "◷", staffOnly: true },
  { to: "/perfil", label: "Mi perfil", icon: "☺" },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasRole } = useAuth();
  const isStaff = hasRole("Admin") || hasRole("Monitor");

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>UB</div>
          <div>
            <div className={styles.brandName}>UBUNTU</div>
            <div className={styles.brandTag}>Panel de control</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.filter((item) => !item.staffOnly || isStaff).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              <span className={styles.navIcon} aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} aria-hidden="true" />
            Sesión activa
          </div>
        </div>
      </aside>
    </>
  );
}

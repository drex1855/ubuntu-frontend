import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getProducts } from "../api/inventory";
import { useApi } from "../hooks/useApi";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { formatNumber } from "../utils/format";
import styles from "./DashboardPage.module.css";

interface Shortcut {
  to: string;
  icon: string;
  label: string;
  hint: string;
  staffOnly?: boolean;
}

const SHORTCUTS: Shortcut[] = [
  { to: "/tienda", icon: "▤", label: "Tienda", hint: "Productos, ventas y deudas" },
  { to: "/tokens", icon: "◎", label: "Reporte de tokens", hint: "Cargar reporte del periodo", staffOnly: true },
  { to: "/checklists", icon: "☑", label: "Checklist", hint: "Revisar una habitación", staffOnly: true },
  { to: "/contactos", icon: "◔", label: "WhatsApp", hint: "Contactos del sitio", staffOnly: true },
  { to: "/prestamos", icon: "$", label: "Préstamos", hint: "Solicitar o revisar préstamos" },
  { to: "/multas", icon: "⚑", label: "Multas", hint: "Aplicar y controlar multas", staffOnly: true },
  { to: "/horas", icon: "◷", label: "Horas", hint: "Anotar horas de una modelo", staffOnly: true },
  { to: "/perfil", icon: "☺", label: "Mi perfil", hint: "Ver y editar tus datos" },
  { to: "/cuentas", icon: "◈", label: "Cuentas de modelos", hint: "Gestionar accesos", staffOnly: true },
];

export function DashboardPage() {
  const { session, hasRole } = useAuth();
  const isStaff = hasRole("Admin") || hasRole("Monitor");
  const { data: products, loading } = useApi(getProducts, []);

  return (
    <AppShell title="Panel general">
      <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        Bienvenido{session ? `, ${session.fullName.split(" ")[0]}` : ""}. Resumen operativo del
        estudio.
      </p>

      <div className={styles.grid}>
        <Card>
          <div className={styles.statValue}>{loading ? "—" : formatNumber(products?.length ?? 0)}</div>
          <div className={styles.statLabel}>Productos activos en la tienda</div>
        </Card>
        <Card>
          <div className={styles.statValue}>{session ? "1" : "0"}</div>
          <div className={styles.statLabel}>Sesión activa</div>
        </Card>
      </div>

      <Card title="Accesos rápidos">
        <div className={styles.shortcuts}>
          {SHORTCUTS.filter((s) => !s.staffOnly || isStaff).map((shortcut) => (
            <Link key={shortcut.to} to={shortcut.to} className={styles.shortcut}>
              <span className={styles.shortcutIcon} aria-hidden="true">
                {shortcut.icon}
              </span>
              <span className={styles.shortcutLabel}>{shortcut.label}</span>
              <span className={styles.shortcutHint}>{shortcut.hint}</span>
            </Link>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

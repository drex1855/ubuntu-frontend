import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./AppShell.module.css";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className={styles.main}>
        <Topbar title={title} onMenuClick={() => setNavOpen(true)} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

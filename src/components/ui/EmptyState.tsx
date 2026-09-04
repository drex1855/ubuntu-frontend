import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = "○", title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.title}>{title}</span>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}

import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}

export function Badge({ tone = "neutral", dot, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}

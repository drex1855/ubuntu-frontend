import styles from "./Spinner.module.css";

export function Spinner() {
  return (
    <div className={styles.wrapper} role="status" aria-label="Cargando">
      <div className={styles.spinner} />
    </div>
  );
}

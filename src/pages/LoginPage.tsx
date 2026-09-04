import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    const state = location.state as { from?: { pathname?: string } } | null;
    const redirectTo = state?.from?.pathname ?? "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            WS
          </div>
          <div>
            <div className={styles.brandName}>Webcam Studio</div>
            <div className={styles.brandTag}>Panel de control</div>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <FormField label="Correo" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password" required>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </FormField>

          <Button type="submit" fullWidth loading={submitting}>
            Ingresar
          </Button>
        </form>

        <div className={styles.hintBox}>
          Acceso exclusivo para cuentas del estudio. Si olvidaste tu contraseña, contacta a
          un administrador.
        </div>

        <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
          <Link to="/" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

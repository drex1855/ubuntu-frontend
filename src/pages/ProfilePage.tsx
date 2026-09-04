import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/feedback/ToastContext";
import { useAuth } from "../auth/AuthContext";
import { changeMyPassword, getMyProfile, updateMyProfile } from "../api/profile";
import { getMyDebt } from "../api/inventory";
import { getMyFines } from "../api/fines";
import { getMyHourEntries } from "../api/hourEntries";
import { getMyTokenSummary } from "../api/tokenReports";
import { ApiError } from "../api/client";
import type { AccountGender } from "../api/types";
import {
  accountStatusLabel,
  fineStatusLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMinutesAsTime,
  formatNumber,
  formatPesos,
  roleLabel,
} from "../utils/format";
import shared from "./shared.module.css";
import styles from "./StorePage.module.css";
import tokenStyles from "./TokenReportsPage.module.css";

export function ProfilePage() {
  const { hasRole } = useAuth();
  const { data: profile, loading, error, reload } = useApi(getMyProfile, []);
  const { data: debt, loading: loadingDebt } = useApi(getMyDebt, []);
  const { data: fines, loading: loadingFines } = useApi(getMyFines, []);
  const { data: hourEntries, loading: loadingHours } = useApi(getMyHourEntries, []);
  const { data: tokenSummary, loading: loadingTokenSummary } = useApi(getMyTokenSummary, []);
  const { showSuccess, showError } = useToast();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<AccountGender | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhoneNumber(profile.phoneNumber ?? "");
      setGender(profile.gender ?? "");
    }
  }, [profile]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setSubmitting(true);
    try {
      await updateMyProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        gender: gender || null,
      });
      showSuccess("Perfil actualizado.");
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo actualizar el perfil.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Mi perfil">
      <Card title="Mis datos" subtitle="Puedes actualizar tu nombre, teléfono y género">
        {loading && <Spinner />}
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        {!loading && profile && (
          <form onSubmit={handleSubmit} className={shared.formGrid} noValidate>
            {formError && (
              <p className={shared.formGridFull} style={{ color: "var(--danger)", fontSize: 12.5 }}>
                {formError}
              </p>
            )}

            <FormField label="Correo" htmlFor="profileEmail" hint="El correo no se puede modificar desde aquí">
              <input id="profileEmail" value={profile.email} disabled style={{ width: "100%" }} />
            </FormField>

            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end" }}>
              <Badge tone={profile.role === "Admin" ? "accent" : "neutral"}>{roleLabel(profile.role)}</Badge>
              <Badge tone={profile.status === "Activo" ? "success" : "danger"} dot>
                {accountStatusLabel(profile.status)}
              </Badge>
            </div>

            <FormField label="Nombre completo" htmlFor="profileFullName" required>
              <input
                id="profileFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: "100%" }}
                required
              />
            </FormField>

            <FormField label="Teléfono" htmlFor="profilePhone">
              <input
                id="profilePhone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Género" htmlFor="profileGender">
              <select
                id="profileGender"
                value={gender}
                onChange={(e) => setGender(e.target.value as AccountGender | "")}
                style={{ width: "100%" }}
              >
                <option value="">Sin especificar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </FormField>

            <FormField label="Cuenta creada" htmlFor="profileCreatedAt">
              <input id="profileCreatedAt" value={formatDate(profile.createdAt)} disabled style={{ width: "100%" }} />
            </FormField>

            <div className={`${shared.formGridFull} ${shared.formActions}`}>
              <Button type="submit" loading={submitting}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </Card>

      {hasRole("Admin") && <ChangePasswordCard />}

      <Card title="Mis horas" subtitle="Solo lectura -- el estudio es quien anota tus horas">
        {loadingHours && <Spinner />}
        {!loadingHours && (
          <div className={styles.debtHero}>
            <div className={styles.debtValue}>{formatMinutesAsTime((hourEntries ?? []).reduce((sum, e) => sum + e.minutes, 0))}</div>
            <div className={styles.debtLabel}>horas acumuladas</div>
          </div>
        )}
        {!loadingHours && (hourEntries?.length ?? 0) === 0 && (
          <EmptyState title="Sin movimientos todavía" description="Todavía no tienes horas registradas." />
        )}
        {!loadingHours && (hourEntries?.length ?? 0) > 0 && (
          <Table>
            <thead>
              <tr>
                <th>Operación</th>
                <th>Horas</th>
                <th>Nota</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {hourEntries!.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Operación">{entry.minutes >= 0 ? "+ Sumó" : "− Restó"}</td>
                  <td data-label="Horas">{formatMinutesAsTime(Math.abs(entry.minutes))}</td>
                  <td data-label="Nota">{entry.note || <span className={shared.muted}>—</span>}</td>
                  <td data-label="Fecha">{formatDateTime(entry.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card
        title="Mis cuentas / plataformas"
        subtitle="Sitios en los que tienes reportes de tokens y cuánto llevas acumulado en cada uno"
      >
        {loadingTokenSummary && <Spinner />}
        {!loadingTokenSummary && (tokenSummary?.length ?? 0) === 0 && (
          <EmptyState
            title="Sin cuentas activas todavía"
            description="Cuando tengas reportes de tokens registrados en algún sitio, aparecerán aquí."
          />
        )}
        {!loadingTokenSummary && (tokenSummary?.length ?? 0) > 0 && (
          <div className={tokenStyles.summaryGrid}>
            {tokenSummary!.map((item) => (
              <div key={item.siteId} className={tokenStyles.summaryCard}>
                <div className={tokenStyles.summaryModel}>{item.siteName}</div>
                <div className={tokenStyles.summaryValue}>{formatCurrency(item.totalMonetaryValue)}</div>
                <div className={tokenStyles.summaryMeta}>
                  {formatNumber(item.totalTokens)} tokens · {item.reportsCount} reporte(s)
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Créditos activos en la tienda" subtitle="Lo que llevas debiendo por productos a crédito">
        {loadingDebt && <Spinner />}
        {!loadingDebt && debt && (
          <div className={styles.debtHero}>
            <div
              className={`${styles.debtValue} ${debt.totalDebt > 0 ? styles.debtValuePositive : styles.debtValueZero}`}
            >
              {formatPesos(debt.totalDebt)}
            </div>
            <div className={styles.debtLabel}>
              {debt.totalDebt > 0 ? "Tienes crédito pendiente por pagar." : "No tienes créditos activos."}
            </div>
          </div>
        )}
      </Card>

      <Card title="Mis multas" subtitle="Solo lectura -- el estudio es quien las registra y actualiza">
        {loadingFines && <Spinner />}
        {!loadingFines && (fines?.length ?? 0) === 0 && (
          <EmptyState title="Sin multas" description="No tienes ninguna multa registrada." />
        )}
        {!loadingFines && (fines?.length ?? 0) > 0 && (
          <Table>
            <thead>
              <tr>
                <th>Motivo</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {fines!.map((fine) => (
                <tr key={fine.id}>
                  <td data-label="Motivo" style={{ maxWidth: 320 }}>{fine.reason}</td>
                  <td data-label="Monto">{formatPesos(fine.amount)}</td>
                  <td data-label="Estado">
                    <Badge
                      tone={fine.status === "Pagada" ? "success" : fine.status === "Cancelada" ? "danger" : "warning"}
                      dot
                    >
                      {fineStatusLabel(fine.status)}
                    </Badge>
                  </td>
                  <td data-label="Fecha">{formatDateTime(fine.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}

function ChangePasswordCard() {
  const { showSuccess, showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setSubmitting(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      showSuccess("Contraseña actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Cambiar contraseña" subtitle="Necesitas tu contraseña actual para poder cambiarla">
      <form onSubmit={handleSubmit} className={shared.formGrid} noValidate>
        {formError && (
          <p className={shared.formGridFull} style={{ color: "var(--danger)", fontSize: 12.5 }}>
            {formError}
          </p>
        )}

        <div className={shared.formGridFull}>
          <FormField label="Contraseña actual" htmlFor="currentPassword" required>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: "100%" }}
              required
            />
          </FormField>
        </div>

        <FormField label="Contraseña nueva" htmlFor="newPassword" required hint="Mínimo 8 caracteres">
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Confirmar contraseña" htmlFor="confirmPassword" required>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={`${shared.formGridFull} ${shared.formActions}`}>
          <Button type="submit" loading={submitting}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Card>
  );
}

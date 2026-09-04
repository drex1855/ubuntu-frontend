import { useState, type FormEvent } from "react";
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
import { createLoanRequest, searchLoanRequests, setLoanRequestStatus } from "../api/loanRequests";
import { ApiError } from "../api/client";
import type { LoanRequestDto, LoanRequestStatus } from "../api/types";
import { formatDateTime, formatPesos, loanStatusLabel } from "../utils/format";
import shared from "./shared.module.css";

function statusTone(status: LoanRequestStatus): "warning" | "success" | "danger" {
  if (status === "Aprobada") return "success";
  if (status === "Rechazada") return "danger";
  return "warning";
}

export function LoanRequestsPage() {
  const { hasRole } = useAuth();
  const isStaff = hasRole("Admin") || hasRole("Monitor");
  const { showSuccess, showError } = useToast();

  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<LoanRequestStatus | "">("");
  const {
    data: requests,
    loading,
    error,
    reload,
  } = useApi(
    () =>
      isStaff
        ? searchLoanRequests({ status: statusFilter || undefined })
        : Promise.resolve<LoanRequestDto[]>([]),
    [isStaff, statusFilter],
  );

  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (amount <= 0) {
      setFormError("El monto debe ser mayor a cero.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Escribe el motivo del préstamo.");
      return;
    }

    setSubmitting(true);
    try {
      await createLoanRequest({ amount, reason: reason.trim() });
      showSuccess("Solicitud enviada. El estudio revisará tu petición.");
      setAmount(0);
      setReason("");
      if (isStaff) reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo enviar la solicitud.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(id: string, status: LoanRequestStatus) {
    setBusyId(id);
    try {
      await setLoanRequestStatus(id, { status });
      showSuccess(status === "Aprobada" ? "Solicitud aprobada." : "Solicitud rechazada.");
      reload();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo actualizar la solicitud.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Préstamos">
      <Card title="Solicitar préstamo" subtitle="Tu solicitud le llega directo al estudio">
        <form onSubmit={handleSubmit} className={shared.formGrid} noValidate>
          {formError && (
            <p className={shared.formGridFull} style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {formError}
            </p>
          )}

          <FormField label="Monto" htmlFor="loanAmount" required>
            <input
              id="loanAmount"
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: "100%" }}
              required
            />
          </FormField>

          <div className={shared.formGridFull}>
            <FormField label="Motivo" htmlFor="loanReason" required>
              <textarea
                id="loanReason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", resize: "vertical" }}
                required
              />
            </FormField>
          </div>

          <div className={`${shared.formGridFull} ${shared.formActions}`}>
            <Button type="submit" loading={submitting}>
              Enviar solicitud
            </Button>
          </div>
        </form>
      </Card>

      {isStaff && (
        <Card title="Historial de solicitudes" subtitle="Todas las solicitudes recibidas">
          <div className={shared.filters}>
            <div className={shared.filterField}>
              <FormField label="Estado" htmlFor="statusFilter">
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LoanRequestStatus | "")}
                  style={{ width: "100%" }}
                >
                  <option value="">Todas</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                </select>
              </FormField>
            </div>
          </div>

          <div style={{ marginTop: "var(--space-4)" }}>
            {loading && <Spinner />}
            {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
            {!loading && !error && (requests?.length ?? 0) === 0 && (
              <EmptyState title="Sin solicitudes" description="No hay solicitudes de préstamo para este filtro." />
            )}
            {!loading && (requests?.length ?? 0) > 0 && (
              <Table>
                <thead>
                  <tr>
                    <th>Solicitante</th>
                    <th>Monto</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requests!.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Solicitante">{r.requestedByFullName}</td>
                      <td data-label="Monto">{formatPesos(r.amount)}</td>
                      <td data-label="Motivo" style={{ maxWidth: 280 }}>{r.reason}</td>
                      <td data-label="Estado">
                        <Badge tone={statusTone(r.status)} dot>
                          {loanStatusLabel(r.status)}
                        </Badge>
                      </td>
                      <td data-label="Fecha">{formatDateTime(r.requestedAt)}</td>
                      <td>
                        {r.status === "Pendiente" && (
                          <div className={shared.rowActions}>
                            <Button
                              variant="secondary"
                              size="small"
                              loading={busyId === r.id}
                              onClick={() => handleResolve(r.id, "Aprobada")}
                            >
                              Aprobar
                            </Button>
                            <Button
                              variant="danger"
                              size="small"
                              loading={busyId === r.id}
                              onClick={() => handleResolve(r.id, "Rechazada")}
                            >
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

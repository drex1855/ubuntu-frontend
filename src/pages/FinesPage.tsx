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
import { createFine, searchFines, setFineStatus } from "../api/fines";
import { getModelAccounts } from "../api/modelAccounts";
import { ApiError } from "../api/client";
import type { FineStatus } from "../api/types";
import { fineStatusLabel, formatDateTime, formatPesos } from "../utils/format";
import shared from "./shared.module.css";

function statusTone(status: FineStatus): "warning" | "success" | "danger" {
  if (status === "Pagada") return "success";
  if (status === "Cancelada") return "danger";
  return "warning";
}

export function FinesPage() {
  const { showSuccess, showError } = useToast();
  const { data: models } = useApi(getModelAccounts, []);

  const [modelAccountId, setModelAccountId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [filterModelId, setFilterModelId] = useState("");
  const [filterStatus, setFilterStatus] = useState<FineStatus | "">("");
  const {
    data: fines,
    loading,
    error,
    reload,
  } = useApi(
    () => searchFines({ modelAccountId: filterModelId || undefined, status: filterStatus || undefined }),
    [filterModelId, filterStatus],
  );

  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!modelAccountId) {
      setFormError("Selecciona una modelo.");
      return;
    }
    if (amount <= 0) {
      setFormError("El monto debe ser mayor a cero.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Escribe el motivo de la multa.");
      return;
    }

    setSubmitting(true);
    try {
      await createFine({ modelAccountId, amount, reason: reason.trim() });
      showSuccess("Multa registrada.");
      setAmount(0);
      setReason("");
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo registrar la multa.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangeStatus(id: string, status: FineStatus) {
    setBusyId(id);
    try {
      await setFineStatus(id, { status });
      showSuccess("Estado de la multa actualizado.");
      reload();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo actualizar la multa.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Multas">
      <Card title="Registrar multa" subtitle="Aplica una multa a una cuenta de modelo">
        <form onSubmit={handleSubmit} className={shared.formGrid} noValidate>
          {formError && (
            <p className={shared.formGridFull} style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {formError}
            </p>
          )}

          <FormField label="Modelo" htmlFor="fineModel" required>
            <select
              id="fineModel"
              value={modelAccountId}
              onChange={(e) => setModelAccountId(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Selecciona una modelo…</option>
              {(models ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Monto" htmlFor="fineAmount" required>
            <input
              id="fineAmount"
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
            <FormField label="Motivo" htmlFor="fineReason" required>
              <textarea
                id="fineReason"
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
              Registrar multa
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Historial de multas" subtitle="Filtra por modelo o estado">
        <div className={shared.filters}>
          <div className={shared.filterField}>
            <FormField label="Modelo" htmlFor="filterFineModel">
              <select
                id="filterFineModel"
                value={filterModelId}
                onChange={(e) => setFilterModelId(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">Todas</option>
                {(models ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className={shared.filterField}>
            <FormField label="Estado" htmlFor="filterFineStatus">
              <select
                id="filterFineStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FineStatus | "")}
                style={{ width: "100%" }}
              >
                <option value="">Todos</option>
                <option value="PendientePorCobrar">Pendiente por cobrar</option>
                <option value="Pagada">Pagada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </FormField>
          </div>
        </div>

        <div style={{ marginTop: "var(--space-4)" }}>
          {loading && <Spinner />}
          {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
          {!loading && !error && (fines?.length ?? 0) === 0 && (
            <EmptyState title="Sin multas" description="No hay multas registradas para este filtro." />
          )}
          {!loading && (fines?.length ?? 0) > 0 && (
            <Table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Monto</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fines!.map((fine) => (
                  <tr key={fine.id}>
                    <td data-label="Modelo">{fine.modelFullName}</td>
                    <td data-label="Monto">{formatPesos(fine.amount)}</td>
                    <td data-label="Motivo" style={{ maxWidth: 280 }}>{fine.reason}</td>
                    <td data-label="Estado">
                      <Badge tone={statusTone(fine.status)} dot>
                        {fineStatusLabel(fine.status)}
                      </Badge>
                    </td>
                    <td data-label="Fecha">{formatDateTime(fine.issuedAt)}</td>
                    <td>
                      <div className={shared.rowActions}>
                        {fine.status !== "Pagada" && (
                          <Button
                            variant="secondary"
                            size="small"
                            loading={busyId === fine.id}
                            onClick={() => handleChangeStatus(fine.id, "Pagada")}
                          >
                            Marcar pagada
                          </Button>
                        )}
                        {fine.status !== "Cancelada" && (
                          <Button
                            variant="danger"
                            size="small"
                            loading={busyId === fine.id}
                            onClick={() => handleChangeStatus(fine.id, "Cancelada")}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
    </AppShell>
  );
}

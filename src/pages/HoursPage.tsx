import { useState, type FormEvent } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/feedback/ToastContext";
import { createHourEntry, searchHourEntries } from "../api/hourEntries";
import { getModelAccounts } from "../api/modelAccounts";
import { ApiError } from "../api/client";
import { formatDateTime, formatMinutesAsTime, parseTimeToMinutes } from "../utils/format";
import shared from "./shared.module.css";
import styles from "./StorePage.module.css";

/**
 * El staff (Admin/Monitor) anota los movimientos de horas de una modelo elegida de la
 * lista. Reemplaza la calculadora anterior que solo vivia en el navegador: ahora cada
 * movimiento se guarda en el servidor y la modelo afectada lo ve en su propio perfil
 * (ver ProfilePage), de forma personal y de solo lectura.
 */
export function HoursPage() {
  const { data: models } = useApi(getModelAccounts, []);
  const { showSuccess, showError } = useToast();

  const [selectedModelId, setSelectedModelId] = useState("");
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: entries,
    loading: loadingEntries,
    reload: reloadEntries,
  } = useApi(
    () => (selectedModelId ? searchHourEntries({ modelAccountId: selectedModelId }) : Promise.resolve([])),
    [selectedModelId],
  );

  const totalMinutes = (entries ?? []).reduce((sum, e) => sum + e.minutes, 0);
  const selectedModel = models?.find((m) => m.id === selectedModelId);

  async function applyOperation(event: FormEvent, operation: "Sumar" | "Restar") {
    event.preventDefault();
    setFormError(null);

    if (!selectedModelId) {
      setFormError("Selecciona una modelo.");
      return;
    }

    const minutes = parseTimeToMinutes(input);
    if (minutes === null) {
      setFormError('Escribe la hora en formato H:MM, por ejemplo "6:47".');
      return;
    }

    setSubmitting(true);
    try {
      await createHourEntry({
        modelAccountId: selectedModelId,
        minutes: operation === "Sumar" ? minutes : -minutes,
        note: note.trim() || null,
      });
      showSuccess(operation === "Sumar" ? "Horas sumadas correctamente." : "Horas restadas correctamente.");
      setInput("");
      setNote("");
      reloadEntries();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo registrar el movimiento.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Horas">
      <Card title="Anotar horas" subtitle="Elige una modelo y suma o resta horas en formato H:MM (ej. 6:47)">
        <form className={shared.formGrid} noValidate>
          <div className={shared.formGridFull}>
            <FormField label="Modelo" htmlFor="hoursModel" required>
              <select
                id="hoursModel"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
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
          </div>

          {formError && (
            <p className={shared.formGridFull} style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {formError}
            </p>
          )}

          <FormField label="Horas (formato H:MM)" htmlFor="hoursInput" required hint='Ejemplo: 6:47'>
            <input
              id="hoursInput"
              type="text"
              inputMode="numeric"
              placeholder="6:47"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ width: "100%" }}
              required
            />
          </FormField>

          <FormField label="Nota (opcional)" htmlFor="hoursNote">
            <input
              id="hoursNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. cubrió turno extra"
              style={{ width: "100%" }}
            />
          </FormField>

          <div className={`${shared.formGridFull} ${shared.formActions}`}>
            <Button
              type="button"
              variant="danger"
              loading={submitting}
              onClick={(e) => applyOperation(e, "Restar")}
            >
              Restar
            </Button>
            <Button type="submit" loading={submitting} onClick={(e) => applyOperation(e, "Sumar")}>
              Sumar
            </Button>
          </div>
        </form>
      </Card>

      {selectedModelId && (
        <Card
          title={`Total acumulado -- ${selectedModel?.fullName ?? ""}`}
          subtitle="Suma de todos los movimientos registrados para esta modelo"
        >
          <div style={{ textAlign: "center", padding: "var(--space-5) 0" }}>
            <div className={styles.debtValue}>{loadingEntries ? "—" : formatMinutesAsTime(totalMinutes)}</div>
            <div className={styles.debtLabel}>horas acumuladas</div>
          </div>
        </Card>
      )}

      {selectedModelId && (
        <Card title="Historial" subtitle="Movimientos registrados para la modelo seleccionada">
          {loadingEntries && <Spinner />}
          {!loadingEntries && (entries?.length ?? 0) === 0 && (
            <EmptyState title="Sin movimientos todavía" description="Suma o resta horas para ver el historial aquí." />
          )}
          {!loadingEntries && (entries?.length ?? 0) > 0 && (
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
                {entries!.map((entry) => (
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
      )}
    </AppShell>
  );
}

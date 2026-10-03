import { useState, type FormEvent } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/feedback/ToastContext";
import { useAuth } from "../auth/AuthContext";
import { createTokenReport, getTokenReportsSummary, searchTokenReports } from "../api/tokenReports";
import { getModelAccounts } from "../api/modelAccounts";
import { createSite, getSites, updateSite } from "../api/sites";
import { ApiError } from "../api/client";
import type { ModelAccountDto, SiteDto, TokenReportDto, TokenReportSearchParams } from "../api/types";
import { formatCurrency, formatDate, formatDateTime, formatNumber, toDateInputValue } from "../utils/format";
import shared from "./shared.module.css";
import styles from "./TokenReportsPage.module.css";

function formatTokenRate(value: number): string {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

type SiteModalState = { mode: "create" } | { mode: "edit"; site: SiteDto } | null;

function exportReportsToCsv(reports: TokenReportDto[]) {
  const headers = ["Modelo", "Sitio", "Periodo", "Tokens", "Valor (USD)", "Registrado"];
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const rows = reports.map((r) =>
    [
      r.modelFullName,
      r.siteName,
      formatDate(r.period),
      r.tokensAmount.toString().replace(".", ","),
      r.monetaryValue.toFixed(4).replace(".", ","),
      formatDateTime(r.registeredAt),
    ].map(escapeCell),
  );

  const csvContent = [headers.map(escapeCell), ...rows].map((row) => row.join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-tokens-${toDateInputValue(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function TokenReportsPage() {
  const { session, hasRole } = useAuth();
  const isStaff = hasRole("Admin") || hasRole("Monitor");
  const { showSuccess, showError } = useToast();

  const { data: models } = useApi(
    () => (isStaff ? getModelAccounts() : Promise.resolve<ModelAccountDto[]>([])),
    [isStaff],
  );
  const { data: sites, reload: reloadSites } = useApi(() => getSites(), []);
  const [siteModal, setSiteModal] = useState<SiteModalState>(null);

  const [filters, setFilters] = useState<TokenReportSearchParams>({});
  const [appliedFilters, setAppliedFilters] = useState<TokenReportSearchParams>({});

  const {
    data: reports,
    loading: loadingReports,
    error: reportsError,
    reload: reloadReports,
  } = useApi(() => searchTokenReports(appliedFilters), [appliedFilters]);

  const { data: summary, reload: reloadSummary } = useApi(
    () => getTokenReportsSummary(appliedFilters),
    [appliedFilters],
  );

  const [reportForm, setReportForm] = useState({
    modelAccountId: session?.accountId ?? "",
    siteId: "",
    period: toDateInputValue(new Date()),
    tokensAmount: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedSite = sites?.find((s) => s.id === reportForm.siteId);
  const computedValue = selectedSite ? reportForm.tokensAmount * selectedSite.tokenValueUsd : 0;

  function handleApplyFilters(event: FormEvent) {
    event.preventDefault();
    setAppliedFilters(filters);
  }

  async function handleCreateReport(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const modelAccountId = isStaff ? reportForm.modelAccountId : session?.accountId ?? "";
    if (!modelAccountId || !reportForm.siteId) {
      setFormError("Selecciona modelo y sitio.");
      return;
    }
    if (reportForm.tokensAmount <= 0) {
      setFormError("La cantidad de tokens debe ser mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      await createTokenReport({
        modelAccountId,
        siteId: reportForm.siteId,
        period: reportForm.period,
        tokensAmount: reportForm.tokensAmount,
      });
      showSuccess("Reporte registrado correctamente.");
      setReportForm((f) => ({ ...f, tokensAmount: 0 }));
      reloadReports();
      reloadSummary();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo registrar el reporte.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Reporte de tokens">
      <Card title="Registrar reporte" subtitle="Carga el reporte de tokens de un periodo">
        <form onSubmit={handleCreateReport} className={shared.formGrid} noValidate>
          {formError && (
            <p className={shared.formGridFull} style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {formError}
            </p>
          )}

          {isStaff ? (
            <FormField label="Modelo" htmlFor="reportModel" required>
              <select
                id="reportModel"
                value={reportForm.modelAccountId}
                onChange={(e) => setReportForm({ ...reportForm, modelAccountId: e.target.value })}
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
          ) : (
            <FormField label="Modelo" htmlFor="reportModel">
              <input id="reportModel" value={session?.fullName ?? ""} disabled style={{ width: "100%" }} />
            </FormField>
          )}

          <FormField label="Sitio" htmlFor="reportSite" required>
            <select
              id="reportSite"
              value={reportForm.siteId}
              onChange={(e) => setReportForm({ ...reportForm, siteId: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">Selecciona un sitio…</option>
              {(sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Periodo" htmlFor="reportPeriod" required>
            <input
              id="reportPeriod"
              type="date"
              value={reportForm.period}
              onChange={(e) => setReportForm({ ...reportForm, period: e.target.value })}
              style={{ width: "100%" }}
              required
            />
          </FormField>

          <FormField label="Tokens" htmlFor="reportTokens" required>
            <input
              id="reportTokens"
              type="number"
              min={0}
              step="0.01"
              value={reportForm.tokensAmount}
              onChange={(e) => setReportForm({ ...reportForm, tokensAmount: Number(e.target.value) })}
              style={{ width: "100%" }}
              required
            />
          </FormField>

          <FormField label="Valor monetario (calculado)" htmlFor="reportValue">
            <input
              id="reportValue"
              value={
                selectedSite
                  ? `${formatCurrency(computedValue)} (${formatTokenRate(selectedSite.tokenValueUsd)} por token)`
                  : "Selecciona un sitio…"
              }
              disabled
              style={{ width: "100%" }}
            />
          </FormField>

          <div className={`${shared.formGridFull} ${shared.formActions}`}>
            <Button type="submit" loading={submitting}>
              Registrar reporte
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="Historial"
        subtitle="Filtra por modelo, sitio y periodo"
        action={
          <Button
            variant="secondary"
            size="small"
            onClick={() => exportReportsToCsv(reports ?? [])}
            disabled={!reports?.length}
          >
            Exportar a Excel
          </Button>
        }
      >
        <form onSubmit={handleApplyFilters} className={shared.filters} noValidate>
          {isStaff && (
            <div className={shared.filterField}>
              <FormField label="Modelo" htmlFor="filterModel">
                <select
                  id="filterModel"
                  value={filters.modelAccountId ?? ""}
                  onChange={(e) => setFilters({ ...filters, modelAccountId: e.target.value || undefined })}
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
          )}
          <div className={shared.filterField}>
            <FormField label="Sitio" htmlFor="filterSite">
              <select
                id="filterSite"
                value={filters.siteId ?? ""}
                onChange={(e) => setFilters({ ...filters, siteId: e.target.value || undefined })}
                style={{ width: "100%" }}
              >
                <option value="">Todos</option>
                {(sites ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className={shared.filterField}>
            <FormField label="Desde" htmlFor="filterFrom">
              <input
                id="filterFrom"
                type="date"
                value={filters.periodFrom ?? ""}
                onChange={(e) => setFilters({ ...filters, periodFrom: e.target.value || undefined })}
                style={{ width: "100%" }}
              />
            </FormField>
          </div>
          <div className={shared.filterField}>
            <FormField label="Hasta" htmlFor="filterTo">
              <input
                id="filterTo"
                type="date"
                value={filters.periodTo ?? ""}
                onChange={(e) => setFilters({ ...filters, periodTo: e.target.value || undefined })}
                style={{ width: "100%" }}
              />
            </FormField>
          </div>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>

        <div style={{ marginTop: "var(--space-4)" }}>
          {loadingReports && <Spinner />}
          {reportsError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{reportsError}</p>}
          {!loadingReports && !reportsError && (reports?.length ?? 0) === 0 && (
            <EmptyState title="Sin reportes" description="No hay reportes para los filtros seleccionados." />
          )}
          {!loadingReports && (reports?.length ?? 0) > 0 && (
            <Table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Sitio</th>
                  <th>Periodo</th>
                  <th>Tokens</th>
                  <th>Valor</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {reports!.map((report) => (
                  <tr key={report.id}>
                    <td data-label="Modelo">{report.modelFullName}</td>
                    <td data-label="Sitio">{report.siteName}</td>
                    <td data-label="Periodo">{formatDate(report.period)}</td>
                    <td data-label="Tokens">{formatNumber(report.tokensAmount)}</td>
                    <td data-label="Valor">{formatCurrency(report.monetaryValue)}</td>
                    <td data-label="Registrado">{formatDate(report.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

      <Card title="Resumen agregado" subtitle="Totales por modelo y sitio">
        {(summary?.length ?? 0) === 0 ? (
          <EmptyState title="Sin datos" description="Aplica filtros o registra reportes para ver el resumen." />
        ) : (
          <div className={styles.summaryGrid}>
            {summary!.map((item) => (
              <div key={`${item.modelAccountId}-${item.siteId}`} className={styles.summaryCard}>
                <div className={styles.summaryModel}>{item.modelFullName}</div>
                <div className={styles.summarySite}>{item.siteName}</div>
                <div className={styles.summaryValue}>{formatCurrency(item.totalMonetaryValue)}</div>
                <div className={styles.summaryMeta}>
                  {formatNumber(item.totalTokens)} tokens · {item.reportsCount} reporte(s)
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isStaff && (
        <Card
          title="Sitios"
          subtitle="Valor en USD de cada token, por sitio — se usa para calcular el reporte automáticamente"
          action={
            <Button variant="secondary" size="small" onClick={() => setSiteModal({ mode: "create" })}>
              + Sitio
            </Button>
          }
        >
          {(sites?.length ?? 0) === 0 ? (
            <EmptyState title="Sin sitios todavía" description="Da de alta el primer sitio de la plataforma." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Sitio</th>
                  <th>Valor por token</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sites!.map((site) => (
                  <tr key={site.id}>
                    <td data-label="Sitio">{site.name}</td>
                    <td data-label="Valor por token">{formatTokenRate(site.tokenValueUsd)}</td>
                    <td>
                      <Button variant="secondary" size="small" onClick={() => setSiteModal({ mode: "edit", site })}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {siteModal?.mode === "create" && (
        <SiteModal onClose={() => setSiteModal(null)} onSaved={() => { setSiteModal(null); reloadSites(); }} />
      )}
      {siteModal?.mode === "edit" && (
        <SiteModal
          site={siteModal.site}
          onClose={() => setSiteModal(null)}
          onSaved={() => { setSiteModal(null); reloadSites(); }}
        />
      )}
    </AppShell>
  );
}

function SiteModal({
  site,
  onClose,
  onSaved,
}: {
  site?: SiteDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState(site?.name ?? "");
  const [description, setDescription] = useState(site?.description ?? "");
  const [tokenValueUsd, setTokenValueUsd] = useState(site?.tokenValueUsd ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (tokenValueUsd < 0) {
      setFormError("El valor por token no puede ser negativo.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null, tokenValueUsd };
      if (site) {
        await updateSite(site.id, payload);
        showSuccess("Sitio actualizado correctamente.");
      } else {
        await createSite(payload);
        showSuccess("Sitio creado correctamente.");
      }
      onSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar el sitio.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={site ? "Editar sitio" : "Nuevo sitio"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Nombre" htmlFor="siteName" required>
          <input
            id="siteName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Descripción (opcional)" htmlFor="siteDescription">
          <input
            id="siteDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%" }}
          />
        </FormField>

        <FormField label="Valor por token (USD)" htmlFor="siteTokenValue" required>
          <input
            id="siteTokenValue"
            type="number"
            min={0}
            step="any"
            value={tokenValueUsd}
            onChange={(e) => setTokenValueUsd(Number(e.target.value))}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

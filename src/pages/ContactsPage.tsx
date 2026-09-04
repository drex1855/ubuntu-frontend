import { useState, type FormEvent } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/feedback/ToastContext";
import {
  assignTag,
  createContact,
  createTag,
  deleteContact,
  deleteTag,
  getTags,
  removeTag,
  searchContacts,
  sendMassEmail,
  updateContact,
} from "../api/contacts";
import { ApiError } from "../api/client";
import type { ContactDto, ContactSearchParams, TagDto } from "../api/types";
import { formatDateTime } from "../utils/format";
import shared from "./shared.module.css";

type ModalState =
  | { mode: "create-contact" }
  | { mode: "edit-contact"; contact: ContactDto }
  | { mode: "manage-tags"; contact: ContactDto }
  | { mode: "create-tag" }
  | { mode: "mass-email" }
  | null;

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportContactsToCsv(contacts: ContactDto[]) {
  const headers = ["Nombre", "Teléfono", "Correo", "Etiquetas", "Creado"];
  const rows = contacts.map((c) =>
    [
      c.fullName,
      c.phoneNumber,
      c.email ?? "",
      c.tags.map((t) => t.name).join(", "),
      formatDateTime(c.createdAt),
    ].map(escapeCsvCell),
  );

  const csvContent = [headers.map(escapeCsvCell), ...rows].map((row) => row.join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `contactos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ContactsPage() {
  const { data: tags, reload: reloadTags } = useApi(() => getTags(), []);

  const [filters, setFilters] = useState<{ search: string; tagId: string; hasEmail: boolean }>({
    search: "",
    tagId: "",
    hasEmail: false,
  });
  const [appliedFilters, setAppliedFilters] = useState<ContactSearchParams>({});

  const {
    data: contacts,
    loading,
    error,
    reload: reloadContacts,
  } = useApi(() => searchContacts(appliedFilters), [appliedFilters]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState>(null);

  function handleApplyFilters(event: FormEvent) {
    event.preventDefault();
    setAppliedFilters({
      search: filters.search || undefined,
      tagId: filters.tagId || undefined,
      hasEmail: filters.hasEmail || undefined,
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reloadAll() {
    reloadContacts();
  }

  return (
    <AppShell title="WhatsApp">
      <Card title="Filtros" subtitle="Busca por nombre/teléfono, etiqueta, o solo con correo">
        <form onSubmit={handleApplyFilters} className={shared.filters} noValidate>
          <div className={shared.filterField}>
            <FormField label="Buscar" htmlFor="contactSearch">
              <input
                id="contactSearch"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nombre o teléfono…"
                style={{ width: "100%" }}
              />
            </FormField>
          </div>
          <div className={shared.filterField}>
            <FormField label="Etiqueta" htmlFor="contactTag">
              <select
                id="contactTag"
                value={filters.tagId}
                onChange={(e) => setFilters({ ...filters, tagId: e.target.value })}
                style={{ width: "100%" }}
              >
                <option value="">Todas</option>
                {(tags ?? []).map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className={shared.filterField} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={filters.hasEmail}
                onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })}
              />
              Solo con correo
            </label>
          </div>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      <Card
        title="Contactos"
        subtitle="Quienes han escrito al WhatsApp del estudio desde la página"
        action={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button variant="secondary" onClick={() => setModal({ mode: "create-contact" })}>
              + Contacto
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportContactsToCsv(contacts ?? [])}
              disabled={!contacts?.length}
            >
              Exportar a Excel
            </Button>
            <Button
              onClick={() => setModal({ mode: "mass-email" })}
              disabled={!contacts?.some((c) => c.email)}
            >
              Enviar correo masivo
            </Button>
          </div>
        }
      >
        {loading && <Spinner />}
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        {!loading && !error && (contacts?.length ?? 0) === 0 && (
          <EmptyState title="Sin contactos todavía" description="Cuando alguien escriba desde el sitio, aparecerá aquí." />
        )}
        {!loading && (contacts?.length ?? 0) > 0 && (
          <Table>
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Etiquetas</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contacts!.map((contact) => (
                <tr key={contact.id}>
                  <td data-label="Seleccionar">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelected(contact.id)}
                      disabled={!contact.email}
                      title={contact.email ? "Seleccionar para correo masivo" : "Sin correo registrado"}
                    />
                  </td>
                  <td data-label="Nombre">{contact.fullName}</td>
                  <td data-label="Teléfono">{contact.phoneNumber}</td>
                  <td data-label="Correo">{contact.email ?? "—"}</td>
                  <td data-label="Etiquetas">
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {contact.tags.length === 0 && <span style={{ color: "var(--text-muted)" }}>—</span>}
                      {contact.tags.map((tag) => (
                        <Badge key={tag.id} tone="accent">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td data-label="Creado">{formatDateTime(contact.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                      <Button variant="secondary" size="small" onClick={() => setModal({ mode: "manage-tags", contact })}>
                        Etiquetas
                      </Button>
                      <Button variant="secondary" size="small" onClick={() => setModal({ mode: "edit-contact", contact })}>
                        Editar
                      </Button>
                      <DeleteContactButton contact={contact} onDeleted={reloadAll} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card
        title="Etiquetas"
        subtitle="Etiquetas libres para clasificar contactos (ej. 'Se le puede escribir')"
        action={
          <Button variant="secondary" size="small" onClick={() => setModal({ mode: "create-tag" })}>
            + Etiqueta
          </Button>
        }
      >
        {(tags?.length ?? 0) === 0 ? (
          <EmptyState title="Sin etiquetas todavía" description="Crea la primera etiqueta para clasificar contactos." />
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags!.map((tag) => (
              <TagChip key={tag.id} tag={tag} onDeleted={reloadTags} />
            ))}
          </div>
        )}
      </Card>

      {modal?.mode === "create-contact" && (
        <ContactFormModal onClose={() => setModal(null)} onSaved={() => { setModal(null); reloadAll(); }} />
      )}
      {modal?.mode === "edit-contact" && (
        <ContactFormModal
          contact={modal.contact}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reloadAll(); }}
        />
      )}
      {modal?.mode === "manage-tags" && (
        <TagPickerModal
          contact={modal.contact}
          allTags={tags ?? []}
          onChanged={() => { setModal(null); reloadAll(); }}
        />
      )}
      {modal?.mode === "create-tag" && (
        <CreateTagModal onClose={() => setModal(null)} onCreated={() => { setModal(null); reloadTags(); }} />
      )}
      {modal?.mode === "mass-email" && (
        <MassEmailModal
          selectedIds={Array.from(selectedIds)}
          tags={tags ?? []}
          onClose={() => setModal(null)}
          onSent={() => setModal(null)}
        />
      )}
    </AppShell>
  );
}

function DeleteContactButton({ contact, onDeleted }: { contact: ContactDto; onDeleted: () => void }) {
  const { showSuccess, showError } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar a "${contact.fullName}" de los contactos?`)) return;

    setDeleting(true);
    try {
      await deleteContact(contact.id);
      showSuccess("Contacto eliminado.");
      onDeleted();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo eliminar el contacto.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button variant="danger" size="small" onClick={handleDelete} loading={deleting}>
      Eliminar
    </Button>
  );
}

function TagChip({ tag, onDeleted }: { tag: TagDto; onDeleted: () => void }) {
  const { showSuccess, showError } = useToast();

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar la etiqueta "${tag.name}"? Se quitará de todos los contactos que la tengan.`)) return;

    try {
      await deleteTag(tag.id);
      showSuccess("Etiqueta eliminada.");
      onDeleted();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo eliminar la etiqueta.");
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Badge tone="accent">{tag.name}</Badge>
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Eliminar etiqueta ${tag.name}`}
        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
      >
        ✕
      </button>
    </span>
  );
}

function ContactFormModal({
  contact,
  onClose,
  onSaved,
}: {
  contact?: ContactDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [fullName, setFullName] = useState(contact?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(contact?.phoneNumber ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !phoneNumber.trim()) {
      setFormError("El nombre y el teléfono son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || null,
        notes: notes.trim() || null,
      };
      if (contact) {
        await updateContact(contact.id, payload);
        showSuccess("Contacto actualizado.");
      } else {
        await createContact(payload);
        showSuccess("Contacto creado.");
      }
      onSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar el contacto.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={contact ? "Editar contacto" : "Nuevo contacto"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Nombre" htmlFor="contactFullName" required>
          <input
            id="contactFullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Teléfono" htmlFor="contactPhone" required>
          <input
            id="contactPhone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Correo (opcional)" htmlFor="contactEmail">
          <input
            id="contactEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </FormField>

        <FormField label="Notas (opcional)" htmlFor="contactNotes">
          <textarea
            id="contactNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: "100%" }}
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

function TagPickerModal({
  contact,
  allTags,
  onChanged,
}: {
  contact: ContactDto;
  allTags: TagDto[];
  onChanged: () => void;
}) {
  const { showError } = useToast();
  const [assignedIds, setAssignedIds] = useState(new Set(contact.tags.map((t) => t.id)));
  const [busy, setBusy] = useState(false);

  async function toggle(tag: TagDto) {
    setBusy(true);
    try {
      if (assignedIds.has(tag.id)) {
        await removeTag(contact.id, tag.id);
        setAssignedIds((current) => {
          const next = new Set(current);
          next.delete(tag.id);
          return next;
        });
      } else {
        await assignTag(contact.id, tag.id);
        setAssignedIds((current) => new Set(current).add(tag.id));
      }
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo actualizar la etiqueta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Etiquetas de ${contact.fullName}`} onClose={() => { onChanged(); }}>
      {allTags.length === 0 ? (
        <EmptyState title="Sin etiquetas" description="Crea una etiqueta primero desde la sección de etiquetas." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {allTags.map((tag) => (
            <label key={tag.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={assignedIds.has(tag.id)}
                onChange={() => toggle(tag)}
                disabled={busy}
              />
              {tag.name}
            </label>
          ))}
        </div>
      )}
      <div className={shared.formActions}>
        <Button type="button" onClick={() => onChanged()}>
          Listo
        </Button>
      </div>
    </Modal>
  );
}

function CreateTagModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("El nombre de la etiqueta es obligatorio.");
      return;
    }

    setSubmitting(true);
    try {
      await createTag({ name: name.trim() });
      showSuccess("Etiqueta creada.");
      onCreated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo crear la etiqueta.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nueva etiqueta" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Nombre" htmlFor="tagName" required>
          <input
            id="tagName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Crear etiqueta
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MassEmailModal({
  selectedIds,
  tags,
  onClose,
  onSent,
}: {
  selectedIds: string[];
  tags: TagDto[];
  onClose: () => void;
  onSent: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tagId, setTagId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!subject.trim() || !body.trim()) {
      setFormError("El asunto y el cuerpo del correo son obligatorios.");
      return;
    }
    if (selectedIds.length === 0 && !tagId) {
      setFormError("Selecciona contactos en la tabla (checkbox) o una etiqueta.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await sendMassEmail({
        subject: subject.trim(),
        body: body.trim(),
        contactIds: selectedIds.length > 0 ? selectedIds : null,
        tagId: tagId || null,
      });
      showSuccess(
        `Se intentó el envío a ${result.recipients} contacto(s) (${result.skippedNoEmail} sin correo). ` +
          "Revisa los registros del servidor si algún correo no llegó.",
      );
      onSent();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo enviar el correo masivo.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Enviar correo masivo" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {selectedIds.length > 0
            ? `${selectedIds.length} contacto(s) seleccionados en la tabla.`
            : "No hay contactos seleccionados en la tabla — elige una etiqueta abajo."}
        </p>

        <FormField label="También enviar a esta etiqueta (opcional)" htmlFor="massEmailTag">
          <select id="massEmailTag" value={tagId} onChange={(e) => setTagId(e.target.value)} style={{ width: "100%" }}>
            <option value="">Ninguna</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Asunto" htmlFor="massEmailSubject" required>
          <input
            id="massEmailSubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Cuerpo" htmlFor="massEmailBody" required>
          <textarea
            id="massEmailBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Enviar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

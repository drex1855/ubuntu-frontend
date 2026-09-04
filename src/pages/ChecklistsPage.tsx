import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/feedback/ToastContext";
import {
  addTemplateItem,
  createRoom,
  getChecklistAttachmentUrl,
  getRoomTemplate,
  getRooms,
  submitChecklist,
  uploadChecklistAttachment,
} from "../api/checklists";
import { ApiError } from "../api/client";
import type { ChecklistItemStatus, ChecklistRunDto } from "../api/types";
import { formatDateTime, maintenanceStatusLabel } from "../utils/format";
import shared from "./shared.module.css";
import styles from "./ChecklistsPage.module.css";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES = "image/jpeg,image/png,image/webp";

interface AttachmentState {
  fileName: string;
  contentType: string;
  previewUrl: string;
}

function AttachmentPicker({
  value,
  onChange,
  inputId,
}: {
  value: AttachmentState | null;
  onChange: (next: AttachmentState | null) => void;
  inputId: string;
}) {
  const { showError } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      showError("La imagen no puede pesar más de 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadChecklistAttachment(file);
      onChange({ fileName: result.fileName, contentType: file.type, previewUrl: URL.createObjectURL(file) });
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      {value ? (
        <>
          <img
            src={value.previewUrl}
            alt="Adjunto"
            style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "var(--radius-sm)" }}
          />
          <Button type="button" variant="secondary" size="small" onClick={() => onChange(null)}>
            Quitar foto
          </Button>
        </>
      ) : (
        <>
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_ATTACHMENT_TYPES}
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
            disabled={uploading}
          />
          {uploading && <Spinner />}
        </>
      )}
    </div>
  );
}

function AttachmentThumbnail({ fileName }: { fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getChecklistAttachmentUrl(fileName).then((result) => {
      if (cancelled) return;
      objectUrl = result;
      setUrl(result);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileName]);

  if (!url) return <Spinner />;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt="Foto adjunta" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
    </a>
  );
}

export function ChecklistsPage() {
  const { data: rooms, loading: loadingRooms, error: roomsError, reload: reloadRooms } = useApi(getRooms, []);
  const { showSuccess, showError } = useToast();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [lastRun, setLastRun] = useState<ChecklistRunDto | null>(null);

  useEffect(() => {
    if (!selectedRoomId && rooms && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const {
    data: template,
    loading: loadingTemplate,
    error: templateError,
    reload: reloadTemplate,
  } = useApi(
    () => (selectedRoomId ? getRoomTemplate(selectedRoomId) : Promise.resolve(null)),
    [selectedRoomId],
  );

  return (
    <AppShell title="Checklist de habitaciones">
      <Card
        title="Habitaciones"
        subtitle="Selecciona una habitación para cargar su checklist"
        action={
          <Button variant="secondary" onClick={() => setRoomModalOpen(true)}>
            + Habitación
          </Button>
        }
      >
        {loadingRooms && <Spinner />}
        {roomsError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{roomsError}</p>}
        {!loadingRooms && !roomsError && (rooms?.length ?? 0) === 0 && (
          <EmptyState title="Sin habitaciones" description="Crea la primera habitación del estudio." />
        )}
        {!loadingRooms && (rooms?.length ?? 0) > 0 && (
          <div className={styles.roomList}>
            {rooms!.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`${styles.roomChip} ${room.id === selectedRoomId ? styles.roomChipActive : ""}`}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setLastRun(null);
                }}
              >
                {room.name}
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedRoomId && (
        <Card
          title={template?.room.name ?? "Plantilla"}
          subtitle="Marca el estado de cada ítem y envía la revisión"
          action={
            <Button variant="secondary" size="small" onClick={() => setItemModalOpen(true)}>
              + Ítem de plantilla
            </Button>
          }
        >
          {loadingTemplate && <Spinner />}
          {templateError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{templateError}</p>}
          {!loadingTemplate && !templateError && template && template.items.length === 0 && (
            <EmptyState
              title="Sin ítems en la plantilla"
              description="Agrega al menos un ítem para poder registrar una revisión."
            />
          )}
          {!loadingTemplate && template && template.items.length > 0 && (
            <ChecklistForm
              roomId={selectedRoomId}
              items={template.items}
              onSubmitted={(run) => {
                setLastRun(run);
                showSuccess("Checklist enviado correctamente.");
              }}
              onError={(message) => showError(message)}
            />
          )}
        </Card>
      )}

      {lastRun && (
        <Card title="Resultado de la revisión" subtitle={formatDateTime(lastRun.performedAt)}>
          <div className={styles.resultBox}>
            {lastRun.maintenanceRequests.length > 0 ? (
              lastRun.maintenanceRequests.map((req) => (
                <div key={req.id} className={styles.maintenanceItem}>
                  <span>{req.description}</span>
                  <Badge tone="warning" dot>
                    {maintenanceStatusLabel(req.status)}
                  </Badge>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                No se generaron solicitudes de mantenimiento: todos los ítems quedaron en buen estado.
              </p>
            )}

            {lastRun.items.some((item) => item.attachmentFileName) && (
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
                {lastRun.items
                  .filter((item) => item.attachmentFileName)
                  .map((item) => (
                    <div key={item.templateItemId} style={{ textAlign: "center" }}>
                      <AttachmentThumbnail fileName={item.attachmentFileName!} />
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                        {item.templateItemName}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {lastRun.materialsAttachmentFileName && (
              <div style={{ marginTop: "var(--space-3)" }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Foto de materiales
                </div>
                <AttachmentThumbnail fileName={lastRun.materialsAttachmentFileName} />
              </div>
            )}
          </div>
        </Card>
      )}

      {roomModalOpen && (
        <CreateRoomModal
          onClose={() => setRoomModalOpen(false)}
          onCreated={(room) => {
            setRoomModalOpen(false);
            reloadRooms();
            setSelectedRoomId(room);
          }}
        />
      )}

      {itemModalOpen && selectedRoomId && (
        <AddTemplateItemModal
          roomId={selectedRoomId}
          onClose={() => setItemModalOpen(false)}
          onAdded={() => {
            setItemModalOpen(false);
            reloadTemplate();
          }}
        />
      )}
    </AppShell>
  );
}

function ChecklistForm({
  roomId,
  items,
  onSubmitted,
  onError,
}: {
  roomId: string;
  items: { id: string; name: string; description?: string | null }[];
  onSubmitted: (run: ChecklistRunDto) => void;
  onError: (message: string) => void;
}) {
  const [statuses, setStatuses] = useState<Record<string, ChecklistItemStatus>>(
    Object.fromEntries(items.map((item) => [item.id, "Bueno" as ChecklistItemStatus])),
  );
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, AttachmentState | null>>({});
  const [materialsNotes, setMaterialsNotes] = useState("");
  const [materialsAttachment, setMaterialsAttachment] = useState<AttachmentState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const run = await submitChecklist({
        roomId,
        items: items.map((item) => ({
          templateItemId: item.id,
          status: statuses[item.id] ?? "Bueno",
          observation: observations[item.id]?.trim() || null,
          attachmentFileName: attachments[item.id]?.fileName ?? null,
          attachmentContentType: attachments[item.id]?.contentType ?? null,
        })),
        availableMaterialsNotes: materialsNotes.trim() || null,
        materialsAttachmentFileName: materialsAttachment?.fileName ?? null,
        materialsAttachmentContentType: materialsAttachment?.contentType ?? null,
      });
      onSubmitted(run);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo enviar el checklist.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }} noValidate>
      {items.map((item) => (
        <div key={item.id} className={styles.itemRow}>
          <div className={styles.itemHeader}>
            <div>
              <div className={styles.itemName}>{item.name}</div>
              {item.description && <div className={styles.itemDescription}>{item.description}</div>}
            </div>
            <div className={styles.statusToggle}>
              <button
                type="button"
                className={`${styles.statusButton} ${statuses[item.id] === "Bueno" ? styles.statusGoodActive : ""}`}
                onClick={() => setStatuses({ ...statuses, [item.id]: "Bueno" })}
              >
                Bueno
              </button>
              <button
                type="button"
                className={`${styles.statusButton} ${statuses[item.id] === "Malo" ? styles.statusBadActive : ""}`}
                onClick={() => setStatuses({ ...statuses, [item.id]: "Malo" })}
              >
                Malo
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <input
              placeholder={
                statuses[item.id] === "Malo" ? "Describe el problema encontrado…" : "Nota u observación (opcional)…"
              }
              value={observations[item.id] ?? ""}
              onChange={(e) => setObservations({ ...observations, [item.id]: e.target.value })}
              style={{ width: "100%" }}
            />
            <AttachmentPicker
              inputId={`attachment-${item.id}`}
              value={attachments[item.id] ?? null}
              onChange={(next) => setAttachments({ ...attachments, [item.id]: next })}
            />
          </div>
        </div>
      ))}

      <FormField label="Notas de materiales disponibles" htmlFor="materialsNotes">
        <textarea
          id="materialsNotes"
          rows={3}
          value={materialsNotes}
          onChange={(e) => setMaterialsNotes(e.target.value)}
          style={{ width: "100%", resize: "vertical" }}
        />
      </FormField>

      <FormField label="Foto de materiales (opcional)" htmlFor="materialsAttachment">
        <AttachmentPicker inputId="materialsAttachment" value={materialsAttachment} onChange={setMaterialsAttachment} />
      </FormField>

      <div className={shared.formActions}>
        <Button type="submit" loading={submitting}>
          Enviar revisión
        </Button>
      </div>
    </form>
  );
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: (roomId: string) => void }) {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("El nombre de la habitación es obligatorio.");
      return;
    }
    setSubmitting(true);
    try {
      const room = await createRoom({ name: name.trim(), description: description.trim() || null });
      showSuccess("Habitación creada.");
      onCreated(room.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo crear la habitación.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nueva habitación" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}
        <FormField label="Nombre" htmlFor="roomName" required>
          <input id="roomName" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} required />
        </FormField>
        <FormField label="Descripción" htmlFor="roomDescription">
          <input
            id="roomDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%" }}
          />
        </FormField>
        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Crear
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddTemplateItemModal({
  roomId,
  onClose,
  onAdded,
}: {
  roomId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("El nombre del ítem es obligatorio.");
      return;
    }
    setSubmitting(true);
    try {
      await addTemplateItem(roomId, {
        name: name.trim(),
        description: description.trim() || null,
        displayOrder,
      });
      showSuccess("Ítem agregado a la plantilla.");
      onAdded();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo agregar el ítem.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nuevo ítem de plantilla" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}
        <FormField label="Nombre" htmlFor="itemName" required>
          <input id="itemName" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} required />
        </FormField>
        <FormField label="Descripción" htmlFor="itemDescription">
          <input
            id="itemDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%" }}
          />
        </FormField>
        <FormField label="Orden de despliegue" htmlFor="itemOrder" required>
          <input
            id="itemOrder"
            type="number"
            min={1}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            style={{ width: "100%" }}
            required
          />
        </FormField>
        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Agregar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

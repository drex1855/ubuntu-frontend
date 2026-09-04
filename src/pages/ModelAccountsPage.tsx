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
import { useAuth } from "../auth/AuthContext";
import {
  createModelAccount,
  getModelAccounts,
  resetModelAccountPassword,
  setModelAccountStatus,
  updateModelAccount,
} from "../api/modelAccounts";
import { ApiError } from "../api/client";
import type { AccountGender, AccountRole, ModelAccountDto } from "../api/types";
import { accountStatusLabel, formatDate, genderLabel, roleLabel } from "../utils/format";
import shared from "./shared.module.css";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; account: ModelAccountDto }
  | { mode: "reset-password"; account: ModelAccountDto }
  | null;

const emptyCreateForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "Modelo" as AccountRole,
  gender: "" as AccountGender | "",
};

export function ModelAccountsPage() {
  const { hasRole } = useAuth();
  const { data: accounts, loading, error, reload } = useApi(getModelAccounts, []);
  const { showSuccess, showError } = useToast();
  const [modal, setModal] = useState<ModalState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggleStatus(account: ModelAccountDto) {
    const nextStatus = account.status === "Activo" ? "Desactivado" : "Activo";
    setBusyId(account.id);
    try {
      await setModelAccountStatus(account.id, { status: nextStatus });
      showSuccess(`Cuenta ${nextStatus === "Activo" ? "activada" : "desactivada"} correctamente.`);
      reload();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo actualizar el estado.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Cuentas de modelos">
      <Card
        title="Cuentas registradas"
        subtitle="Alta, edición y control de acceso de administradores y modelos"
        action={<Button onClick={() => setModal({ mode: "create" })}>+ Nueva cuenta</Button>}
      >
        {loading && <Spinner />}
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        {!loading && !error && (accounts?.length ?? 0) === 0 && (
          <EmptyState title="Sin cuentas todavía" description="Crea la primera cuenta de modelo o administrador." />
        )}
        {!loading && (accounts?.length ?? 0) > 0 && (
          <Table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Género</th>
                <th>Estado</th>
                <th>Creada</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {accounts!.map((account) => (
                <tr key={account.id}>
                  <td data-label="Nombre">{account.fullName}</td>
                  <td data-label="Correo">{account.email}</td>
                  <td data-label="Teléfono">{account.phoneNumber || <span className={shared.muted}>—</span>}</td>
                  <td data-label="Rol">
                    <Badge tone={account.role === "Admin" ? "accent" : "neutral"}>
                      {roleLabel(account.role)}
                    </Badge>
                  </td>
                  <td data-label="Género">
                    {account.gender ? genderLabel(account.gender) : <span className={shared.muted}>—</span>}
                  </td>
                  <td data-label="Estado">
                    <Badge tone={account.status === "Activo" ? "success" : "danger"} dot>
                      {accountStatusLabel(account.status)}
                    </Badge>
                  </td>
                  <td data-label="Creada">{formatDate(account.createdAt)}</td>
                  <td>
                    <div className={shared.rowActions}>
                      <Button variant="ghost" size="small" onClick={() => setModal({ mode: "edit", account })}>
                        Editar
                      </Button>
                      {hasRole("Admin") && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => setModal({ mode: "reset-password", account })}
                        >
                          Restablecer contraseña
                        </Button>
                      )}
                      <Button
                        variant={account.status === "Activo" ? "danger" : "secondary"}
                        size="small"
                        loading={busyId === account.id}
                        onClick={() => handleToggleStatus(account)}
                      >
                        {account.status === "Activo" ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {modal?.mode === "create" && (
        <CreateAccountModal
          onClose={() => setModal(null)}
          onCreated={() => {
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.mode === "edit" && (
        <EditAccountModal
          account={modal.account}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.mode === "reset-password" && (
        <ResetPasswordModal account={modal.account} onClose={() => setModal(null)} />
      )}
    </AppShell>
  );
}

function ResetPasswordModal({ account, onClose }: { account: ModelAccountDto; onClose: () => void }) {
  const { showSuccess, showError } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setSubmitting(true);
    try {
      await resetModelAccountPassword(account.id, { newPassword });
      showSuccess(`Contraseña de ${account.fullName} restablecida correctamente.`);
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo restablecer la contraseña.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Restablecer contraseña -- ${account.fullName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Contraseña nueva" htmlFor="resetNewPassword" required hint="Mínimo 8 caracteres">
          <input
            id="resetNewPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Confirmar contraseña" htmlFor="resetConfirmPassword" required>
          <input
            id="resetConfirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Restablecer contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(emptyCreateForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setFormError("Nombre, correo y contraseña son obligatorios.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await createModelAccount({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        password: form.password,
        role: form.role,
        gender: form.gender || null,
      });
      showSuccess("Cuenta creada correctamente.");
      onCreated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo crear la cuenta.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nueva cuenta" onClose={onClose}>
      <form onSubmit={handleSubmit} className={shared.formGrid} noValidate>
        {formError && <p className={`${shared.formGridFull}`} style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <div className={shared.formGridFull}>
          <FormField label="Nombre completo" htmlFor="fullName" required>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              style={{ width: "100%" }}
              required
            />
          </FormField>
        </div>

        <FormField label="Correo" htmlFor="email" required>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Teléfono" htmlFor="phoneNumber">
          <input
            id="phoneNumber"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            style={{ width: "100%" }}
          />
        </FormField>

        <FormField label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Rol" htmlFor="role" required>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as AccountRole })}
            style={{ width: "100%" }}
          >
            <option value="Modelo">Modelo</option>
            <option value="Monitor">Monitor</option>
            <option value="Admin">Administrador</option>
          </select>
        </FormField>

        <FormField label="Género" htmlFor="gender">
          <select
            id="gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as AccountGender | "" })}
            style={{ width: "100%" }}
          >
            <option value="">Sin especificar</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Otro">Otro</option>
          </select>
        </FormField>

        <div className={`${shared.formGridFull} ${shared.formActions}`}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Crear cuenta
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditAccountModal({
  account,
  onClose,
  onSaved,
}: {
  account: ModelAccountDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [fullName, setFullName] = useState(account.fullName);
  const [phoneNumber, setPhoneNumber] = useState(account.phoneNumber ?? "");
  const [gender, setGender] = useState<AccountGender | "">(account.gender ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setSubmitting(true);
    try {
      await updateModelAccount(account.id, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        gender: gender || null,
      });
      showSuccess("Cuenta actualizada.");
      onSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo actualizar la cuenta.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Editar ${account.fullName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Correo" htmlFor="editEmail" hint="El correo no se puede modificar desde aquí">
          <input id="editEmail" value={account.email} disabled style={{ width: "100%" }} />
        </FormField>

        <FormField label="Nombre completo" htmlFor="editFullName" required>
          <input
            id="editFullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Teléfono" htmlFor="editPhone">
          <input
            id="editPhone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ width: "100%" }}
          />
        </FormField>

        <FormField label="Género" htmlFor="editGender">
          <select
            id="editGender"
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

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

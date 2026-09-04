import { useState, type FormEvent } from "react";
import { submitPublicContact } from "../../api/contacts";
import { ApiError } from "../../api/client";
import { useToast } from "../feedback/ToastContext";
import styles from "./ContactFormModal.module.css";

interface ContactFormModalProps {
  onClose: () => void;
  /** Arma la URL de wa.me con un mensaje personalizado usando el nombre ingresado. */
  buildWhatsAppUrl: (fullName: string) => string;
}

export function ContactFormModal({ onClose, buildWhatsAppUrl }: ContactFormModalProps) {
  const { showSuccess, showError } = useToast();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName || !trimmedPhone) {
      setFormError("El nombre y el teléfono son obligatorios.");
      return;
    }
    if (!consent) {
      setFormError("Debes aceptar el uso de tus datos para continuar.");
      return;
    }

    // Abrimos WhatsApp ya mismo, de forma sincrónica dentro del gesto de envío del
    // formulario: si esperamos a que responda el backend antes de abrir la ventana,
    // varios navegadores (Safari sobre todo) la bloquean como popup no solicitado.
    // Así un hipo del backend nunca le impide a la persona escribirle al estudio.
    window.open(buildWhatsAppUrl(trimmedName), "_blank", "noopener,noreferrer");
    onClose();

    try {
      await submitPublicContact({
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
        email: email.trim() || null,
        consent: true,
      });
      showSuccess("¡Gracias! Ya quedaste registrada, te contactaremos pronto.");
    } catch (err) {
      showError(
        err instanceof ApiError
          ? err.message
          : "No pudimos guardar tus datos, pero ya te llevamos a WhatsApp.",
      );
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Escríbenos por WhatsApp">
        <div className={styles.header}>
          <h2 className={styles.title}>Escríbenos por WhatsApp</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {formError && <p className={styles.error}>{formError}</p>}

          <label className={styles.field}>
            <span>Nombre*</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>

          <label className={styles.field}>
            <span>Teléfono*</span>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </label>

          <label className={styles.field}>
            <span>Correo (opcional)</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className={styles.consent}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            <span>
              Acepto que mis datos sean usados por Ubuntu Studio con fines de mercadeo, según los{" "}
              <a href="#terminos" onClick={onClose}>
                Términos y condiciones
              </a>
              .
            </span>
          </label>

          <button type="submit" className={styles.submitButton}>
            Escríbenos por WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}

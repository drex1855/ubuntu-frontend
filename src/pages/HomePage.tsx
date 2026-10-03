import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ContactFormModal } from "../components/public/ContactFormModal";
import styles from "./HomePage.module.css";

const STAFF_NAV_LINKS = [
  { to: "/dashboard", label: "Panel" },
  { to: "/tienda", label: "Tienda" },
  { to: "/tokens", label: "Tokens" },
  { to: "/prestamos", label: "Préstamos" },
  { to: "/cuentas", label: "Cuentas" },
];

const MODEL_NAV_LINKS = [
  { to: "/tokens", label: "Tokens" },
  { to: "/tienda", label: "Tienda" },
  { to: "/prestamos", label: "Préstamos" },
  { to: "/perfil", label: "Perfil" },
];

const WHATSAPP_NUMBER = "573011171835";
const WHATSAPP_MESSAGE =
  "Hola Ubuntu, estoy interesada en ser parte del equipo. Me gustaría agendar una entrevista.";
const WHATSAPP_URL = `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}&type=phone_number&app_absent=0`;

function buildPersonalizedWhatsAppUrl(fullName: string): string {
  const message = `Hola Ubuntu, soy ${fullName}. Estoy interesada en ser parte del equipo. Me gustaría agendar una entrevista.`;
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
    message,
  )}&type=phone_number&app_absent=0`;
}

const GALLERY_IMAGES = [
  "/images/galeria-1.svg",
  "/images/galeria-2.svg",
  "/images/galeria-3.svg",
  "/images/galeria-4.svg",
  "/images/galeria-5.svg",
];

const STATS = [
  { value: "150+", label: "Modelos han confiado" },
  { value: "80K+", label: "Metas cumplidas" },
  { value: "3+", label: "Años en la industria" },
];

const FAQ_ITEMS = [
  {
    question: "01. ¿Es legal trabajar como modelo webcam?",
    answer:
      "En Colombia el modelaje webcam es una actividad legal para mayores de 18 años. En Ubuntu te explicamos cómo funciona, qué dice la ley y cómo cuidar tu reputación y tu tranquilidad familiar desde el primer día.",
  },
  {
    question: "02. ¿Cuánto puedo ganar y cada cuánto me pagan?",
    answer:
      "Tus ingresos dependen de tu disciplina, del tiempo conectado y de nuestro acompañamiento. Te mostramos ejemplos reales de ganancias, porcentajes y pagos quincenales para que sepas desde el inicio cuánto puedes proyectar.",
  },
  {
    question: "03. ¿Qué necesito para empezar y si necesito experiencia?",
    answer:
      "Solo debes ser mayor de 18 años, tener cédula y muchas ganas de aprender. No requieres experiencia previa: en Ubuntu te capacitamos paso a paso, te damos las herramientas y te ayudamos a proteger tu privacidad en línea.",
  },
];

function ImageSlot({ path, className }: { path: string; className?: string }) {
  return (
    <div
      className={`${styles.imageSlot} ${className ?? ""}`}
      style={{ backgroundImage: `url(${path})` }}
      role="img"
      aria-label="Ubuntu Studio"
    />
  );
}

export function HomePage() {
  const { isAuthenticated, hasRole, session, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = hasRole("Admin") || hasRole("Monitor");
  const authLinks = isStaff ? STAFF_NAV_LINKS : MODEL_NAV_LINKS;
  const [contactModalOpen, setContactModalOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <a href="#inicio" aria-label="Ubuntu Studio">
          <ImageSlot path="/images/logo.svg" className={styles.logoSlot} />
        </a>

        <ul className={styles.navLinks}>
          {isAuthenticated ? (
            authLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))
          ) : (
            <>
              <li>
                <a href="#inicio">Inicio</a>
              </li>
              <li>
                <a href="#galeria">Instalaciones</a>
              </li>
              <li>
                <a href="#equipo">Ubuntu</a>
              </li>
            </>
          )}
        </ul>

        <div className={styles.navRight}>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.pillButton}>
            Agenda hoy
          </a>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className={`${styles.pillButton} ${styles.navPill}`}
              title={session?.fullName}
            >
              Cerrar sesión
            </button>
          ) : (
            <Link to="/login" className={`${styles.pillButton} ${styles.navPill}`}>
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      <main>
        <section id="inicio" className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div>
                <span className={styles.eyebrow}>Ubuntu Studio · Medellín</span>
                <h1 className={styles.heroTitle}>Oferta de empleo para modelo webcam</h1>
                <p className={styles.heroSubtitle}>
                  Solo mujeres mayores de +18 años en Medellín / Área Metropolitana.
                </p>
                <div className={styles.heroActions}>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.pillButton}>
                    Agenda hoy
                  </a>
                  <div className={styles.ratingBadge}>
                    <span className={styles.ratingStars} aria-hidden="true">
                      ★★★★★
                    </span>
                    <div className={styles.ratingText}>
                      <span className={styles.ratingValue}>4.8 de 5</span>
                      <span className={styles.ratingLabel}>Reviews por nuestras modelos</span>
                    </div>
                  </div>
                </div>
              </div>
              <ImageSlot path="/images/hero.svg" className={styles.heroImage} />
            </div>
          </div>
        </section>

        <section id="galeria" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.eyebrow}>Instalaciones</span>
              <h2 className={styles.sectionTitle}>Conoce nuestro estudio</h2>
            </div>
            <div className={styles.galleryGrid}>
              {GALLERY_IMAGES.map((path) => (
                <ImageSlot key={path} path={path} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <ImageSlot path="/images/nosotros.svg" className={styles.aboutImage} />
              <div>
                <span className={styles.eyebrow}>Acerca de nosotros</span>
                <h2 className={styles.sectionTitle}>Somos un estudio webcam líder en Medellín</h2>
                <p className={styles.sectionText}>
                  Acompañamos a mujeres con grandes sueños a construir una carrera como modelos webcam. Te
                  brindamos formación, apoyo constante y un espacio seguro para generar ingresos reales.
                </p>
                <div style={{ marginTop: 28 }}>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.pillButton}>
                    Agenda hoy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.statsRow}>
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.ctaBanner} style={{ backgroundImage: "url(/images/cta-bg.svg)" }}>
              <h2 className={styles.ctaTitle}>
                Convierte tus sueños en ingresos reales como modelo webcam
              </h2>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.pillButton} ${styles.pillButtonFilled}`}
              >
                Agendar entrevista
              </a>
            </div>
          </div>
        </section>

        <section id="equipo" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.teamGrid}>
              <div>
                <span className={styles.eyebrow}>Nuestro equipo</span>
                <h2 className={styles.sectionTitle}>
                  Tu carrera como modelo web, acompañada por un equipo profesional
                </h2>
                <p className={styles.sectionText}>
                  En Ubuntu Webcam Estudios no estás sola. Contarás con modelos líderes, coaches y un
                  equipo técnico que te guía desde el primer día para que aprendas, te sientas segura y
                  puedas alcanzar tus metas.
                </p>
                <div className={styles.teamContactCard}>
                  <span className={styles.teamContactHours}>24/7</span>
                  <div>
                    <div className={styles.teamContactLabel}>Agenda ahora</div>
                    <button
                      type="button"
                      onClick={() => setContactModalOpen(true)}
                      className={styles.linkButton}
                    >
                      Escríbenos por WhatsApp
                    </button>
                  </div>
                </div>
              </div>
              <ImageSlot path="/images/equipo.svg" className={styles.teamImage} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeaderCenter}>
              <span className={styles.eyebrow}>Preguntas frecuentes</span>
              <h2 className={styles.sectionTitle}>Todo lo que necesitas saber antes de empezar</h2>
            </div>
            <div className={styles.faqList}>
              {FAQ_ITEMS.map((item) => (
                <div key={item.question} className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>{item.question}</h3>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.pillButton}>
                    Agenda ahora
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="terminos" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeaderCenter}>
              <span className={styles.eyebrow}>Términos y condiciones</span>
              <h2 className={styles.sectionTitle}>Cómo usamos tus datos</h2>
            </div>
            <p className={styles.sectionText} style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
              Al escribirnos por este sitio, Ubuntu Studio recopila tu nombre, número de teléfono y, si lo
              compartes, tu correo electrónico. Usamos estos datos para contactarte sobre nuestras
              oportunidades y, si aceptas, para enviarte información y promociones del estudio. No
              compartimos tus datos con terceros fuera de este uso.
            </p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <ul className={styles.footerNav}>
            <li>
              <a href="#inicio">Inicio</a>
            </li>
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                Agenda ahora
              </a>
            </li>
          </ul>

          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Ubuntu Studio. Todos los derechos reservados.</span>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#terminos">Términos y condiciones</a>
              </li>
              <li>
                <a href="#">Políticas de privacidad</a>
              </li>
              <li>
                <Link to="/login" className={styles.staffLink}>
                  Acceso del personal
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setContactModalOpen(true)}
        className={styles.floatingChat}
        aria-label="Escríbenos por WhatsApp"
      >
        <span className={styles.floatingChatBubble}>
          ¿Tienes preguntas sobre el estudio? Escríbenos, te respondemos rápido
        </span>
        <span className={styles.floatingChatIcon} aria-hidden="true">
          💬
        </span>
      </button>

      {contactModalOpen && (
        <ContactFormModal
          onClose={() => setContactModalOpen(false)}
          buildWhatsAppUrl={buildPersonalizedWhatsAppUrl}
        />
      )}
    </div>
  );
}

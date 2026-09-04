import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { ToastProvider } from "./components/feedback/ToastContext";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ModelAccountsPage } from "./pages/ModelAccountsPage";
import { StorePage } from "./pages/StorePage";
import { TokenReportsPage } from "./pages/TokenReportsPage";
import { ChecklistsPage } from "./pages/ChecklistsPage";
import { ContactsPage } from "./pages/ContactsPage";
import { LoanRequestsPage } from "./pages/LoanRequestsPage";
import { FinesPage } from "./pages/FinesPage";
import { HoursPage } from "./pages/HoursPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/cuentas"
            element={
              <RequireAuth requiredRole={["Admin", "Monitor"]}>
                <ModelAccountsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/tienda"
            element={
              <RequireAuth>
                <StorePage />
              </RequireAuth>
            }
          />
          <Route
            path="/tokens"
            element={
              <RequireAuth requiredRole={["Admin", "Monitor"]}>
                <TokenReportsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/checklists"
            element={
              <RequireAuth requiredRole={["Admin", "Monitor"]}>
                <ChecklistsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/contactos"
            element={
              <RequireAuth requiredRole={["Admin", "Monitor"]}>
                <ContactsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/prestamos"
            element={
              <RequireAuth>
                <LoanRequestsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/multas"
            element={
              <RequireAuth requiredRole={["Admin", "Monitor"]}>
                <FinesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/horas"
            element={
              <RequireAuth requiredRole={["Admin", "Monitor"]}>
                <HoursPage />
              </RequireAuth>
            }
          />
          <Route
            path="/perfil"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

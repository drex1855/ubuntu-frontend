import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { AccountRole } from "../api/types";
import { useAuth } from "./AuthContext";

interface RequireAuthProps {
  children: ReactNode;
  /** Si se indica, solo cuentas con alguno de estos roles pueden ver la ruta. */
  requiredRole?: AccountRole | AccountRole[];
}

export function RequireAuth({ children, requiredRole }: RequireAuthProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.some(hasRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

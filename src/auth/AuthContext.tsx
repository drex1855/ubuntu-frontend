import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest } from "../api/auth";
import { ApiError } from "../api/client";
import type { AccountRole } from "../api/types";
import { clearSession, readSession, UNAUTHORIZED_EVENT, writeSession, type Session } from "./session";

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: AccountRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  useEffect(() => {
    const handleUnauthorized = () => setSession(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginRequest({ email, password });
      const nextSession: Session = {
        token: response.token,
        expiresAt: response.expiresAt,
        accountId: response.accountId,
        fullName: response.fullName,
        role: response.role,
      };
      writeSession(nextSession);
      setSession(nextSession);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        throw new ApiError("Correo o contraseña inválidos.", error.status);
      }
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const hasRole = useCallback((role: AccountRole) => session?.role === role, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: session !== null, login, logout, hasRole }),
    [session, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider.");
  return ctx;
}

import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import * as authStore from "./authStore";
import { fetchAuthStatus, fetchTeams, setOnUnauthorized } from "./api";
import { LoginPage } from "./pages/LoginPage";
import { useAuth } from "./AuthContext";
import type { ReactNode } from "react";

type Status = "loading" | "no-auth" | "login" | "ready";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const redirectToLogin = useCallback(() => {
    setStatus("login");
  }, []);

  useEffect(() => {
    setOnUnauthorized(redirectToLogin);
    return () => setOnUnauthorized(null);
  }, [redirectToLogin]);

  useEffect(() => {
    if (isAuthenticated && status === "login") {
      setStatus("ready");
    }
  }, [isAuthenticated, status]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { authRequired } = await fetchAuthStatus();

        if (cancelled) return;

        if (!authRequired) {
          setStatus("no-auth");
          return;
        }

        const header = authStore.getAuthHeader();
        if (!header) {
          setStatus("login");
          return;
        }

        try {
          await fetchTeams();
          if (cancelled) return;
          setStatus("ready");
        } catch {
          if (cancelled) return;
          authStore.clear();
          setStatus("login");
        }
      } catch {
        if (cancelled) return;
        setStatus("no-auth");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "login") {
    if (location.pathname === "/login") {
      return <LoginPage />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

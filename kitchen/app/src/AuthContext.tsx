import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authStore from "./authStore";

export type AuthState = {
  isAuthenticated: boolean;
  user?: string;
};

type AuthContextValue = AuthState & {
  login: (user: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: !!authStore.getAuthHeader(),
    user: undefined,
  });

  const syncFromStore = useCallback(() => {
    const header = authStore.getAuthHeader();
    if (header) {
      try {
        const decoded = atob(header);
        const colonIndex = decoded.indexOf(":");
        const user = colonIndex !== -1 ? decoded.slice(0, colonIndex) : decoded;
        setState({ isAuthenticated: true, user });
      } catch {
        setState({ isAuthenticated: false, user: undefined });
      }
    } else {
      setState({ isAuthenticated: false, user: undefined });
    }
  }, []);

  useEffect(() => {
    syncFromStore();
  }, [syncFromStore]);

  const login = useCallback(
    async (user: string, password: string) => {
      const header = btoa(`${user}:${password}`);
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Basic ${header}` },
      });
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Invalid username or password" : await res.text());
      }
      authStore.setAuthHeader(header);
      setState({ isAuthenticated: true, user });
    },
    []
  );

  const logout = useCallback(() => {
    authStore.clear();
    setState({ isAuthenticated: false, user: undefined });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

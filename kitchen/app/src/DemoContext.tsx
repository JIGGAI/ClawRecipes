import { createContext, useCallback, useContext, useState } from "react";

type DemoContextValue = {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children, initialDemoMode = false }: { children: React.ReactNode; initialDemoMode?: boolean }) {
  const [demoMode, setDemoMode] = useState(initialDemoMode);
  return (
    <DemoContext.Provider value={{ demoMode, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initialData, type AppData, type Session, type Automation } from "@/lib/prototype-model";
type Store = {
  data: AppData;
  ready: boolean;
  updateSession: (id: string, fn: (s: Session) => Session) => void;
  addSession: (s: Session) => void;
  saveAutomation: (a: Automation) => void;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
};
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("secure-ai-partner-v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed.sessions) &&
          Array.isArray(parsed.automations) &&
          parsed.profile &&
          parsed.preferences
        )
          setData(parsed);
      }
    } catch {
      /* Retain fictional samples if storage is unavailable. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("secure-ai-partner-v1", JSON.stringify(data));
      } catch {
        /* Storage may be disabled. */
      }
    }
  }, [data, ready]);
  const updateSession = (id: string, fn: (s: Session) => Session) =>
    setData((prev) => ({ ...prev, sessions: prev.sessions.map((s) => (s.id === id ? fn(s) : s)) }));
  const addSession = (s: Session) =>
    setData((prev) => ({ ...prev, sessions: [s, ...prev.sessions] }));
  const saveAutomation = (a: Automation) =>
    setData((prev) => ({
      ...prev,
      automations: prev.automations.some((x) => x.id === a.id)
        ? prev.automations.map((x) => (x.id === a.id ? a : x))
        : [a, ...prev.automations],
    }));
  return (
    <Context.Provider value={{ data, ready, updateSession, addSession, saveAutomation, setData }}>
      {children}
    </Context.Provider>
  );
}
export function usePrototype() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("PrototypeProvider is required");
  return ctx;
}

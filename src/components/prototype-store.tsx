import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initialData, type AppData, type Session, type Automation } from "@/lib/prototype-model";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { loadWorkspace, saveWorkspaceSession, saveWorkspaceSettings } from "@/lib/workspace.functions";
import { toast } from "sonner";
type Store = {
  data: AppData;
  ready: boolean;
  userId: string;
  email: string;
  updateSession: (id: string, fn: (s: Session) => Session) => void;
  addSession: (s: Session) => Promise<void>;
  saveAutomation: (a: Automation) => void;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
};
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  const [userId,setUserId] = useState("");
  const [email,setEmail] = useState("");
  const load = useServerFn(loadWorkspace);
  const saveSession = useServerFn(saveWorkspaceSession);
  const saveSettings = useServerFn(saveWorkspaceSettings);
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const { data: auth } = await supabase.auth.getUser();
      if(cancelled) return;
      setUserId(auth.user?.id ?? ""); setEmail(auth.user?.email ?? "");
      if(auth.user) {
        try { const saved = await load(); if(!cancelled) setData({ ...saved, profile: { ...saved.profile, email: auth.user.email ?? "" } }); }
        catch(error) { toast.error(error instanceof Error ? error.message : "Workspace could not be opened."); }
      } else setData(initialData());
      if(!cancelled) setReady(true);
    }
    restore();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if(["SIGNED_IN","SIGNED_OUT","USER_UPDATED"].includes(event)) { setReady(false); setTimeout(restore,0); }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!ready || !userId) return;
    const timer = setTimeout(() => saveSettings({ data: { profile: data.profile, preferences: data.preferences, automations: data.automations } }).catch(error => toast.error(error.message)), 600);
    return () => clearTimeout(timer);
  }, [data, ready]);
  const updateSession = (id: string, fn: (s: Session) => Session) =>
    setData((prev) => ({ ...prev, sessions: prev.sessions.map((s) => {
      if(s.id !== id || s.owner !== userId || ["Completed","Closed"].includes(s.status)) return s;
      const next = fn(s);
      if(next !== s) saveSession({ data: next }).catch(error => toast.error(error.message));
      return next;
    }) }));
  const addSession = async (s: Session) => {
    if(!userId) throw new Error("Sign in to create a session.");
    const session = { ...s, owner: userId };
    await saveSession({ data: session });
    setData(prev => ({ ...prev, sessions: [session,...prev.sessions] }));
  };
  const saveAutomation = (a: Automation) =>
    setData((prev) => ({
      ...prev,
      automations: prev.automations.some((x) => x.id === a.id)
        ? prev.automations.map((x) => (x.id === a.id ? a : x))
        : [a, ...prev.automations],
    }));
  return (
    <Context.Provider value={{ data, ready, userId, email, updateSession, addSession, saveAutomation, setData }}>
      {children}
    </Context.Provider>
  );
}
export function usePrototype() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("PrototypeProvider is required");
  return ctx;
}

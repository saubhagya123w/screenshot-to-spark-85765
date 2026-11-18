import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { initialData, type Session, type AppData } from "./prototype-model";

export const loadWorkspace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [sessions, settings] = await Promise.all([context.supabase.from("secure_sessions").select("payload"), context.supabase.from("workspace_settings").select("payload").eq("user_id", context.userId).maybeSingle()]);
  if (sessions.error || settings.error) throw new Error(sessions.error?.message ?? settings.error?.message);
  const saved = (settings.data?.payload ?? {}) as Partial<AppData>;
  const defaults = initialData();
  return { ...defaults, ...saved, sessions: sessions.data.map(r => r.payload as unknown as Session), profile: { ...defaults.profile, ...saved.profile, email: context.userId } };
});
export const saveWorkspaceSession = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: Session) => {
  if (!input || typeof input.id !== "string" || !/^SAP-\d{6}$/.test(input.id)) throw new Error("Invalid session");
  return input;
}).handler(async ({ data, context }) => {
  if (data.owner !== context.userId) throw new Error("Only the owner can change a session.");
  const { data: existing, error: readError } = await context.supabase.from("secure_sessions").select("payload").eq("id",data.id).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (existing && ["Completed","Closed"].includes((existing.payload as unknown as Session).status)) throw new Error("Closed sessions are read-only.");
  const payload = { id: data.id, owner_id: context.userId, payload: JSON.parse(JSON.stringify(data)), invited_emails: data.collaborators.map(c => c.email.toLowerCase()) };
  const result = existing ? await context.supabase.from("secure_sessions").update(payload).eq("id",data.id) : await context.supabase.from("secure_sessions").insert(payload);
  if (result.error) throw new Error(result.error.message);
  return true;
});
export const saveWorkspaceSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: Omit<AppData,"sessions">) => data).handler(async ({ data,context }) => {
  const { error } = await context.supabase.from("workspace_settings").upsert({ user_id: context.userId, payload: JSON.parse(JSON.stringify(data)) });
  if(error) throw new Error(error.message);
  return true;
});
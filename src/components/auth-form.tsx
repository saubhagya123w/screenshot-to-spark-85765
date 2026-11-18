import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
export function AuthForm() {
  const [mode,setMode] = useState("Sign in");
  const [busy,setBusy] = useState(false);
  const navigate = useNavigate();
  async function social(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if(result.error) toast.error(result.error.message);
    else if(!result.redirected) await navigate({ to: "/" });
  }
  return <div className="mx-auto max-w-md py-10">
    <ShieldCheck className="text-primary mb-5" size={40}/><h1 className="text-2xl font-semibold">Secure AI Partner</h1>
    <h2 className="text-lg font-medium mt-4">{mode}</h2>
    <form className="space-y-4 mt-6" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      const f = new FormData(e.currentTarget); const email = String(f.get("email")); const password = String(f.get("password"));
      const result = mode === "Create account" ? await supabase.auth.signUp({ email,password,options:{ emailRedirectTo: `${window.location.origin}/auth` } }) : mode === "Reset password" ? await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth?recovery=true`}) : mode === "Set new password" ? await supabase.auth.updateUser({ password }) : await supabase.auth.signInWithPassword({email,password});
      setBusy(false);
      if(result.error) { toast.error(result.error.message); return; }
      if(mode === "Create account") toast.success("Check your email to confirm your account.");
      else if(mode === "Reset password") toast.success("Check your email for a password reset link.");
      else { toast.success("Signed in."); await navigate({to:"/"}); }
    }}>
      {mode !== "Set new password" && <label className="field">Email<Input type="email" name="email" required autoComplete="email"/></label>}
      {mode !== "Reset password" && <label className="field">Password<Input type="password" name="password" required minLength={8} autoComplete={mode === "Sign in" ? "current-password" : "new-password"}/></label>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode}</Button>
    </form>
    <div className="flex flex-wrap gap-2 mt-3">{["Sign in","Create account","Reset password",...(typeof window !== "undefined" && window.location.search.includes("recovery=true") ? ["Set new password"] : [])].filter(m => m !== mode).map(m => <Button variant="link" size="sm" key={m} onClick={() => setMode(m)}>{m}</Button>)}</div>
    <div className="border-t border-border mt-5 pt-5 space-y-3">
      <Button variant="outline" className="w-full" onClick={() => social("google")}><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continue with Google</Button>
      <Button variant="outline" className="w-full" onClick={() => social("lovable")}><LovableMark/>Continue with Lovable</Button>
    </div>
  </div>;
}
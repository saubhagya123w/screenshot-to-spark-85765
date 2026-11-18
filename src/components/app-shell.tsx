import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  LayoutDashboard,
  Plus,
  FolderOpen,
  History,
  CalendarClock,
  MessageSquareText,
  Settings,
  UserRound,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  LockKeyhole,
  Check,
  ArrowUpRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePrototype } from "./prototype-store";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
const NAV = [
  { to: "/" as const, label: "Home", icon: LayoutDashboard },
  { to: "/sessions/new" as const, label: "New Secure Session", icon: Plus },
  { to: "/sessions" as const, label: "Active Sessions", icon: FolderOpen },
  { to: "/history" as const, label: "Session History", icon: History },
  { to: "/automation" as const, label: "Automated Monthly Analytics", icon: CalendarClock },
  { to: "/feedback" as const, label: "Feedback & System Learning", icon: MessageSquareText },
];
export function AppShell({ children }: { children: ReactNode }) {
  const { data, userId } = usePrototype();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [notifications, setNotifications] = useState(false);

  const title =
    NAV.find((n) => n.to === location.pathname)?.label ??
    (location.pathname.startsWith("/sessions/")
      ? "Secure Session"
      : location.pathname === "/settings"
        ? "Settings"
        : "Profile & Account");
  const pending = data.sessions.filter((s) => s.status === "Pending Approval");
  if(location.pathname === "/auth") return <main className="min-h-screen bg-background p-6">{children}</main>;
  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setMobile(false)}>
          <div className="brand-mark">
            <ShieldCheck size={35} strokeWidth={1.6} />
          </div>
          <div>
            <div className="brand-name">Secure AI Partner</div>
            <div className="brand-subtitle">Intelligence. With control.</div>
          </div>
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setMobile(false)}
              className={`nav-item ${location.pathname === n.to || (n.to === "/sessions" && location.pathname.startsWith("/sessions/") && location.pathname !== "/sessions/new") ? "active" : ""}`}
            >
              <n.icon />
              <span>{n.label}</span>
              {n.to === "/sessions" && (
                <span className="nav-count">
                  {data.sessions.filter((s) => s.status !== "Completed").length}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-label mt-5">MANAGE</div>
        <Link
          to="/settings"
          onClick={() => setMobile(false)}
          className={`nav-item ${location.pathname === "/settings" ? "active" : ""}`}
        >
          <Settings />
          Settings
        </Link>
        <Link
          to="/profile"
          onClick={() => setMobile(false)}
          className={`nav-item ${location.pathname === "/profile" ? "active" : ""}`}
        >
          <UserRound />
          Profile & Account
        </Link>
        <div className="sidebar-footer">
          <div className="sidebar-security">
            <div className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck size={15} className="text-success" />
              Privacy-focused workspace
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-sidebar-dim">
              Human control. Confidential-data protection.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-sidebar-dim">
              <span className="status-dot text-success" />
              Workspace
            </div>
          </div>
          <div className="sidebar-person">
            <Link to="/profile" className="avatar">
              {data.profile.name
                .split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2)}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{data.profile.name || "Account"}</div>
              <div className="mt-1 text-[10px] text-sidebar-dim">{data.profile.role}</div>
            </div>
            {userId ? <Button
              size="icon"
              variant="ghost"
              title="Log out"
              aria-label="Log out"
              onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({to:"/auth",replace:true}); }}
            >
              <LogOut size={15} />
            </Button> : <Button asChild variant="outline" size="sm"><Link to="/auth">Sign in</Link></Button>}
          </div>
        </div>
      </aside>
      {mobile && (
        <Button
          className="fixed right-3 top-3 z-50"
          variant="outline"
          size="icon"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X />
        </Button>
      )}
      <div className="app-main">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </Button>
            <span className="text-xs text-muted-foreground">Workspace</span>
            <span className="text-border">/</span>
            <span className="text-xs font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="topbar-security flex items-center gap-1.5 text-[10px] text-success">
              <LockKeyhole size={12} />
              Private workspace
            </span>
            <div className="h-5 w-px bg-border topbar-security" />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
              onClick={() => setNotifications(true)}
            >
              <Bell size={17} />
              {pending.length > 0 && (
                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
            <Link to="/profile" className="flex items-center gap-2">
              <span className="avatar !h-8 !w-8">
                {data.profile.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <ChevronDown size={13} className="text-muted-foreground" />
            </Link>
          </div>
        </header>
        <main className="main-content">
          {children}
          <footer className="app-footer">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={11} />
              Designed around privacy. Guided by human expertise.
            </span>
            <span>Secure AI Partner</span>
          </footer>
        </main>
      </div>
      <Dialog open={notifications} onOpenChange={setNotifications}>
        <DialogContent>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Updates from your workspace.</DialogDescription>
          {pending.map((s) => (
            <Link
              key={s.id}
              to="/sessions/$sessionId"
              params={{ sessionId: s.id }}
              onClick={() => setNotifications(false)}
              className="flex items-center justify-between border-b border-border py-3"
            >
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Awaiting consultant approval</p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
          {!pending.length && (
            <p className="text-sm text-muted-foreground">You’re all caught up.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

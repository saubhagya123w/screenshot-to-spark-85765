import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  CalendarClock,
  ArrowRight,
  ArrowUpRight,
  FolderOpen,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  MessageSquareText,
  History,
  Activity,
  LockKeyhole,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrototype } from "@/components/prototype-store";
import {
  Meta,
  PageHeading,
  Panel,
  Progress,
  SessionTable,
  Status,
  SecurityOverview,
} from "@/components/shared";
import { nextMonthlyDate, PHASES } from "@/lib/prototype-model";
export const Route = createFileRoute("/")({
  head: () =>
    Meta(
      "Workspace Overview",
      "Your Secure AI Partner workspace for human-controlled business analytics, approvals, reports and monthly automation.",
    ),
  component: Home,
});
function Home() {
  const { data } = usePrototype();
  const sessions = data.sessions;
  const pending = sessions.filter((s) => s.status === "Pending Approval");
  const completed = sessions.filter((s) => s.status === "Completed");
  const active = sessions.filter((s) => ["Active", "Pending Approval"].includes(s.status));
  const automation = data.automations[0];
  const stats = [
    {
      label: "Active Sessions",
      value: active.length,
      icon: FolderOpen,
      note: "Consultant-controlled",
      color: "text-primary",
    },
    {
      label: "Completed Sessions",
      value: completed.length,
      icon: CheckCircle2,
      note: "All phases approved",
      color: "text-success",
    },
    {
      label: "Pending Approvals",
      value: pending.length,
      icon: Clock3,
      note: "Awaiting your review",
      color: "text-warning",
    },
    {
      label: "Reports Generated",
      value:
        completed.length +
        data.automations.reduce(
          (n, a) => n + a.history.filter((r) => r.status === "Completed").length,
          0,
        ),
      icon: FileText,
      note: "Ready to download",
      color: "text-primary",
    },
    {
      label: "Monthly Automations",
      value: data.automations.filter((a) => a.active).length,
      icon: CalendarClock,
      note: "Active configurations",
      color: "text-primary",
    },
    {
      label: "Paused / Sleeping",
      value: sessions.filter((s) => ["Paused", "Sleeping"].includes(s.status)).length,
      icon: LockKeyhole,
      note: "Progress preserved",
      color: "text-muted-foreground",
    },
  ];
  return (
    <>
      <PageHeading
        title="Workspace overview"
        subtitle="Your analytics, approvals and business insights — in one place."
      >
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2">
          <CalendarClock size={14} />
          November 18, 2026
        </span>
      </PageHeading>
      <div className="welcome-band">
        <div>
          <div className="eyebrow mb-2">YOUR SECURE ANALYTICS WORKSPACE</div>
          <h2>Welcome to Secure AI Partner</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Secure, AI-powered business analytics with human control at every stage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/sessions/new">
              <Plus />
              Start New Secure Session
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/automation">
              <CalendarClock />
              Configure Monthly Analytics
            </Link>
          </Button>
        </div>
      </div>
      <div className="metrics-grid">
        {stats.map((s) => (
          <div className="metric-card" key={s.label}>
            <div className="metric-top">
              <span>{s.label}</span>
              <s.icon size={15} className={s.color} />
            </div>
            <div className="metric-value">{String(s.value).padStart(2, "0")}</div>
            <div className="metric-note">{s.note}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-primary">
        <Panel
          title="Recent sessions"
          body={false}
          action={
            <Button asChild variant="link" size="sm">
              <Link to="/sessions">
                View all sessions
                <ArrowRight />
              </Link>
            </Button>
          }
        >
          <SessionTable sessions={sessions.slice(0, 5)} />
          <div className="px-5 py-3 border-t border-border flex justify-between text-[10px] text-muted-foreground">
            <span>{sessions.length} sessions in your workspace</span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} />
              Private by default
            </span>
          </div>
        </Panel>
        <Panel
          title="Pending approvals"
          body={false}
          action={<span className="badge warning">{pending.length} to review</span>}
        >
          {pending.slice(0, 3).map((s) => (
            <div className="approval-item" key={s.id}>
              <div className="text-xs font-medium">{s.name}</div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Phase {s.phase + 1} · {PHASES[s.phase]}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1.5 text-[10px] text-warning">
                  <Clock3 size={12} />
                  Awaiting review
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/sessions/$sessionId" params={{ sessionId: s.id }}>
                    Review
                    <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {!pending.length && (
            <div className="p-6 text-xs text-muted-foreground">No pending approvals.</div>
          )}
        </Panel>
      </div>
      <div className="dashboard-secondary">
        <Panel
          title="Automated monthly analytics"
          action={<CalendarClock size={16} className="text-primary" />}
        >
          {automation ? (
            <>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="text-xs font-medium">{automation.name}</div>
                  <p className="text-[10px] text-muted-foreground mt-2">{automation.company}</p>
                </div>
                <Status status={automation.active ? "Active configuration" : "Draft"} />
              </div>
              <div className="grid grid-cols-2 mt-5 gap-5">
                <div>
                  <div className="text-[10px] text-muted-foreground">Next scheduled run</div>
                  <div className="text-xs font-medium mt-2">
                    {nextMonthlyDate(automation).split(" ")[0]}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {automation.time} · {automation.timezone}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Last report delivery</div>
                  <div className="text-xs text-success font-medium mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Delivered
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    November 1 · Simulated
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <Progress value={100} />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Latest execution complete</span>
                  <span>100%</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full mt-5">
                <Link to="/automation">
                  Manage monthly analytics
                  <ArrowRight />
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No configurations yet.</p>
          )}
        </Panel>
        <Panel
          title="Recent activity"
          action={<Activity size={16} className="text-muted-foreground" />}
        >
          {[
            {
              icon: CheckCircle2,
              title: "Data cleaning approved",
              sub: "Sales Performance Analysis",
              time: "24 min ago",
            },
            {
              icon: FileText,
              title: "Business report generated",
              sub: "Customer Analytics",
              time: "1 hour ago",
            },
            {
              icon: Plus,
              title: "Secure session created",
              sub: "Operational Cost Review",
              time: "2 hours ago",
            },
          ].map((a) => (
            <div className="mini-activity" key={a.title}>
              <span className="activity-icon">
                <a.icon />
              </span>
              <div className="flex-1">
                <div className="text-xs font-medium">{a.title}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{a.sub}</div>
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">{a.time}</span>
            </div>
          ))}
          <Button asChild variant="link" size="sm" className="px-0 mt-1">
            <Link to="/history">
              View activity history
              <ArrowRight />
            </Link>
          </Button>
        </Panel>
        <Panel
          title="Security overview"
          action={<ShieldCheck size={16} className="text-success" />}
        >
          <SecurityOverview />
        </Panel>
      </div>
      <div className="mt-7 flex justify-between items-center mb-4">
        <h2 className="section-title">Quick actions</h2>
        <span className="eyebrow">YOUR NEXT STEP</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            to: "/sessions/new" as const,
            label: "Create secure session",
            sub: "Begin a human-controlled analysis",
            icon: Plus,
          },
          {
            to: "/history" as const,
            label: "View session history",
            sub: "Revisit reports and approvals",
            icon: History,
          },
          {
            to: "/automation" as const,
            label: "Configure monthly analytics",
            sub: "Set your recurring business review",
            icon: CalendarClock,
          },
          {
            to: "/feedback" as const,
            label: "Review feedback",
            sub: "Track consultant improvement signals",
            icon: MessageSquareText,
          },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="panel p-4 flex items-center gap-3 hover:border-primary transition-colors"
          >
            <span className="activity-icon">
              <a.icon />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium">{a.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{a.sub}</p>
            </div>
            <ChevronRight className="ml-auto shrink-0 text-muted-foreground" size={14} />
          </Link>
        ))}
      </div>
      <div className="mt-7">
        <Panel
          title="Recent reports"
          action={
            <Button variant="link" size="sm" asChild>
              <Link to="/history">
                View reports
                <ArrowRight />
              </Link>
            </Button>
          }
        >
          <div className="flex flex-wrap gap-6">
            {completed.map((s) => (
              <Link
                key={s.id}
                to="/sessions/$sessionId"
                params={{ sessionId: s.id }}
                className="flex items-center gap-3"
              >
                <span className="activity-icon">
                  <FileText />
                </span>
                <div>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.id} · Final report</p>
                </div>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PHASES, type Session } from "@/lib/prototype-model";
export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
export function Panel({
  title,
  action,
  children,
  className = "",
  body = true,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  body?: boolean;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {body ? <div className="panel-body">{children}</div> : children}
    </section>
  );
}
export function Status({ status }: { status: string }) {
  const variant =
    /Completed|Approved|Delivered|Connected|Resolved|Active configuration|Ready for/.test(status)
      ? "success"
      : /Pending|Review|Attention|Scheduled|Limitation/.test(status)
        ? "warning"
        : /Sleeping|Paused|Draft/.test(status)
          ? "neutral"
          : /Reject|Fail/.test(status)
            ? "danger"
            : "";
  return (
    <span className={`badge ${variant}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function SessionTable({
  sessions,
  history = false,
}: {
  sessions: Session[];
  history?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Session name</th>
            <th>Consultant</th>
            <th>{history ? "Completed" : "Current phase"}</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>
                <Link
                  to="/sessions/$sessionId"
                  params={{ sessionId: s.id }}
                  className="session-name hover:text-primary block"
                >
                  {s.name}
                </Link>
                <div className="session-id">{s.id}</div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <span className="avatar !h-6 !w-6 !text-[8px]">
                    {s.consultant
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  {s.consultant}
                </div>
              </td>
              <td>
                {history
                  ? new Date(s.completed ?? s.created).toLocaleDateString("en-GB")
                  : PHASES[s.phase]}
              </td>
              <td>
                <Status status={s.status} />
              </td>
              <td>
                <Button size="icon" variant="ghost" asChild title={`Open ${s.name}`}>
                  <Link to="/sessions/$sessionId" params={{ sessionId: s.id }}>
                    <ArrowUpRight />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!sessions.length && (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No sessions to display.
        </p>
      )}
    </div>
  );
}
export function SecurityOverview() {
  return (
    <>
      <div className="flex items-center gap-2 text-success mb-3">
        <ShieldCheck size={21} />
        <span className="text-xs font-medium">Human-controlled protection</span>
      </div>
      {[
        "Private consultant sessions",
        "Confidential-data workflow",
        "Human verification",
        "Invitation-controlled access",
      ].map((t) => (
        <div className="security-row" key={t}>
          {t}
          <Check />
        </div>
      ))}
      <div className="security-row">
        Inactivity protection<span className="font-medium">2 minutes</span>
      </div>
      <p className="security-note">
        Session access requires a signed-in account. Review protection results before approving data.
      </p>
    </>
  );
}
export function Meta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | Secure AI Partner` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Secure AI Partner` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

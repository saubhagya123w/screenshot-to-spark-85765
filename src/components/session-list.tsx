import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrototype } from "./prototype-store";
import { PageHeading, Panel, SessionTable } from "./shared";
export function SessionList({ history = false }: { history?: boolean }) {
  const { data } = usePrototype();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [date, setDate] = useState("");
  const sessions = data.sessions.filter(
    (s) =>
      (history ? s.status === "Completed" : s.status !== "Completed") &&
      (status === "All statuses" || s.status === status) &&
      `${s.id} ${s.name} ${s.company} ${s.consultant}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!date || (s.completed ?? s.created).startsWith(date)),
  );
  return (
    <>
      <PageHeading
        title={history ? "Session history" : "Active sessions"}
        subtitle={
          history
            ? "Completed analyses, final reports and every consultant decision."
            : "Manage your ongoing consultant-controlled analytics sessions."
        }
      >
        {!history && (
          <Button asChild>
            <Link to="/sessions/new">
              <Plus />
              New Secure Session
            </Link>
          </Button>
        )}
      </PageHeading>
      <Panel
        title={history ? "Completed & closed sessions" : "Your secure sessions"}
        action={<span className="text-xs text-muted-foreground">{sessions.length} sessions</span>}
        body={false}
      >
        <div className="p-5 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute top-3 left-3 text-muted-foreground" />
            <Input
              className="pl-9"
              aria-label="Search sessions"
              placeholder="Search by session, ID, consultant or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter status"
            className="select-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "All statuses",
              ...(history ? ["Completed"] : ["Active", "Pending Approval", "Paused", "Sleeping"]),
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <Input
            type="date"
            aria-label="Filter date"
            className="w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <SessionTable sessions={sessions} history={history} />
      </Panel>
      {history && (
        <p className="mt-5 text-xs text-muted-foreground flex items-center gap-2">
          <FileText size={14} />
          Completed dashboards are view-only. Reports and approval records remain available.
        </p>
      )}
    </>
  );
}

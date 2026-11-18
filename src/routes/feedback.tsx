import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Search, MessageSquareText, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePrototype } from "@/components/prototype-store";
import { Meta, PageHeading, Panel, Status } from "@/components/shared";
import { learningSignal, PHASES } from "@/lib/prototype-model";
export const Route = createFileRoute("/feedback")({
  head: () =>
    Meta(
      "Feedback & System Learning",
      "Review consultant improvement signals without retaining confidential SME information in the learning interface.",
    ),
  component: FeedbackPage,
});
function FeedbackPage() {
  const { data } = usePrototype();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const records = data.sessions
    .flatMap((s) =>
      s.decisions
        .filter((d) => d.action === "Rejected")
        .map((d, i) => ({
          id: `FB-${s.id.slice(4)}-${i + 1}`,
          session: s.id,
          consultant: d.consultant,
          time: d.time,
          ...learningSignal(d),
        })),
    )
    .filter(
      (r) =>
        (category === "All categories" || r.category === category) &&
        `${r.id} ${r.session} ${r.category} ${r.consultant}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  return (
    <>
      <PageHeading
        title="Feedback & system learning"
        subtitle="Consultant expertise, captured as privacy-focused improvement signals."
      />
      <div className="mb-6 border border-border bg-success-soft p-5 rounded flex gap-3">
        <ShieldCheck size={22} className="text-success shrink-0" />
        <div>
          <p className="text-sm font-medium text-success">
            Feedback learning is designed to retain improvement signals without retaining
            confidential SME data.
          </p>
          <p className="mt-2 text-xs text-success">
            Only the category and a generic correction signal appear here. Original feedback remains
            in the private session. No model training runs in this prototype.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          ["Submitted signals", records.length],
          ["Categorised", records.length],
          ["Training executions", 0],
        ].map(([n, v]) => (
          <div className="metric-card" key={n}>
            <p className="text-xs text-muted-foreground">{n}</p>
            <div className="text-3xl font-semibold mt-3">{v}</div>
          </div>
        ))}
      </div>
      <Panel
        title="Improvement signals"
        body={false}
        action={<MessageSquareText size={17} className="text-primary" />}
      >
        <div className="p-5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={14} />
            <Input
              aria-label="Search feedback"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search session, consultant or category..."
            />
          </div>
          <select
            aria-label="Feedback category"
            className="select-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["All categories", ...PHASES].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  "Feedback ID",
                  "Session",
                  "Category",
                  "Improvement signal",
                  "Consultant",
                  "Status",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono">{r.id}</td>
                  <td>
                    <Link
                      to="/sessions/$sessionId"
                      params={{ sessionId: r.session }}
                      className="text-primary flex gap-1 items-center"
                    >
                      {r.session}
                      <ArrowUpRight size={12} />
                    </Link>
                  </td>
                  <td>{r.category}</td>
                  <td>{r.signal}</td>
                  <td>{r.consultant}</td>
                  <td>
                    <Status status="Categorised" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records.length && (
            <div className="p-12 text-center">
              <MessageSquareText className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No improvement signals yet</p>
              <p className="text-xs text-muted-foreground mt-2">
                Consultant correction decisions will appear here as non-confidential category
                signals.
              </p>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}

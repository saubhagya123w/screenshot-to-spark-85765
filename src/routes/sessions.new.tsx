import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrototype } from "@/components/prototype-store";
import { Meta, PageHeading, Panel, SecurityOverview } from "@/components/shared";
import { makeSession } from "@/lib/prototype-model";
export const Route = createFileRoute("/sessions/new")({
  head: () =>
    Meta(
      "New Secure Session",
      "Create a private consultant-controlled session with a unique ID, business objective and seven approval phases.",
    ),
  component: NewSession,
});
function NewSession() {
  const { data, addSession } = usePrototype();
  const navigate = useNavigate();
  function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const collaborator = String(f.get("collaborator") ?? "");
    const s = makeSession(
      {
        name: String(f.get("name")),
        company: String(f.get("company")),
        consultant: String(f.get("consultant")),
        description: String(f.get("description")),
        objective: String(f.get("objective")),
        collaborators: collaborator
          ? [
              {
                name: "Invited collaborator",
                email: collaborator,
                role: "Consultant",
                permission: "View",
              },
            ]
          : [],
      },
      data.sessions.map((s) => s.id),
    );
    addSession(s);
    navigate({ to: "/sessions/$sessionId", params: { sessionId: s.id } });
  }
  return (
    <>
      <PageHeading
        title="New secure session"
        subtitle="Define your business objective. Stay in control at every stage."
      />
      <div className="workspace-grid">
        <Panel title="Session details" action={<ShieldCheck size={17} className="text-primary" />}>
          <form onSubmit={create} className="space-y-6">
            <div className="form-grid">
              <label className="field">
                Session Name
                <Input name="name" required placeholder="e.g. November Revenue Analysis" />
              </label>
              <label className="field">
                Business / Company Name
                <Input name="company" required defaultValue="Nordic Business Solutions GmbH" />
              </label>
              <label className="field">
                Consultant Name
                <Input name="consultant" required defaultValue={data.profile.name} />
              </label>
              <label className="field">
                Optional Collaborator Email
                <Input name="collaborator" type="email" placeholder="colleague@example.com" />
              </label>
            </div>
            <label className="field">
              Description
              <textarea
                className="text-editor"
                name="description"
                placeholder="Add context for this analysis..."
              />
            </label>
            <label className="field">
              Analytics Objective
              <textarea
                className="text-editor"
                name="objective"
                required
                placeholder="What business questions should this session answer?"
              />
            </label>
            <div className="flex flex-wrap justify-between items-center gap-3 border-t border-border pt-5">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Check size={13} className="text-success" />
                Unique session ID generated automatically
              </span>
              <Button type="submit">
                Create Secure Session
                <ArrowRight />
              </Button>
            </div>
          </form>
        </Panel>
        <div className="space-y-5">
          <Panel title="Session security">
            <SecurityOverview />
          </Panel>
          <Panel title="Consultant-controlled workflow">
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI prepares each phase. You review the results, request corrections and approve before
              progressing. Sample business data is available in your workspace.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

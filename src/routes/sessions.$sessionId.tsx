import { createFileRoute } from "@tanstack/react-router";
import { SessionWorkspace } from "@/components/session-workspace";
import { Meta } from "@/components/shared";
export const Route = createFileRoute("/sessions/$sessionId")({
  head: () =>
    Meta(
      "Secure Analytics Session",
      "Review data protection, cleaning, formulas, business dashboards and reports in your seven-phase consultant-controlled workspace.",
    ),
  component: SessionPage,
});
function SessionPage() {
  const { sessionId } = Route.useParams();
  return <SessionWorkspace id={sessionId} />;
}

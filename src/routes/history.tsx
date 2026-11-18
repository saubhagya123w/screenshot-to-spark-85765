import { createFileRoute } from "@tanstack/react-router";
import { SessionList } from "@/components/session-list";
import { Meta } from "@/components/shared";
export const Route = createFileRoute("/history")({
  head: () =>
    Meta(
      "Session History",
      "Access completed business analytics, read-only dashboards, reports and consultant approval histories.",
    ),
  component: () => <SessionList history />,
});

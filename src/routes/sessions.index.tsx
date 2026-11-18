import { createFileRoute } from "@tanstack/react-router";
import { SessionList } from "@/components/session-list";
import { Meta } from "@/components/shared";
export const Route = createFileRoute("/sessions/")({
  head: () =>
    Meta(
      "Active Sessions",
      "Review, pause and continue your consultant-controlled secure analytics sessions.",
    ),
  component: SessionList,
});

import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@/components/account-settings";
import { Meta } from "@/components/shared";
export const Route = createFileRoute("/settings")({
  head: () =>
    Meta(
      "Workspace Settings",
      "Manage consultant profile, session protection, data-processing preferences and prototype notifications.",
    ),
  component: AccountSettings,
});

import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@/components/account-settings";
import { Meta } from "@/components/shared";
export const Route = createFileRoute("/profile")({
  head: () =>
    Meta(
      "Consultant Profile",
      "Manage your Secure AI Partner consultant identity, organisation and demo account.",
    ),
  component: () => <AccountSettings profileOnly />,
});

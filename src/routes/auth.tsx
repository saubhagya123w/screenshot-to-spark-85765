import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";
import { Meta } from "@/components/shared";
export const Route = createFileRoute("/auth")({ head: () => Meta("Sign In", "Sign in or create your Secure AI Partner account."), component: AuthForm });
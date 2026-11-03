"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export function SignInClient({ next, mode }: { next: string; mode: "signin" | "register" }) {
  const router = useRouter();
  return (
    <AuthForm
      initialMode={mode}
      compact
      onSuccess={() => {
        router.replace(next);
        router.refresh();
      }}
    />
  );
}

"use client";

import { useState } from "react";

type Mode = "register" | "signin";

export function AuthForm({
  initialMode = "register",
  defaults,
  onSuccess,
  compact = false,
}: {
  initialMode?: Mode;
  defaults?: { name?: string; phone?: string };
  onSuccess: () => void;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        setFields(body.fields ?? {});
        if (res.status === 409) setMode("signin");
        return;
      }
      onSuccess();
    } catch {
      setError("Network hiccup. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 inline-flex rounded-full bg-sand p-1 text-sm" role="tablist">
        {(["register", "signin"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${mode === m ? "bg-paper text-ink shadow-sm" : "text-ink-soft"}`}
          >
            {m === "register" ? "New here" : "I have an account"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`} noValidate>
        {mode === "register" && (
          <>
            <Field name="name" label="Your name" autoComplete="name" defaultValue={defaults?.name} error={fields.name} />
            <Field name="phone" label="Mobile (for delivery updates)" type="tel" autoComplete="tel" defaultValue={defaults?.phone} error={fields.phone} hint="Optional" />
          </>
        )}
        <Field name="email" label="Email" type="email" autoComplete="email" error={fields.email} />
        <Field
          name="password"
          label={mode === "register" ? "Create a password" : "Password"}
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          error={fields.password}
          hint={mode === "register" ? "At least 8 characters" : undefined}
        />
        {error && (
          <p className={`text-sm text-[#a3402c] ${compact ? "" : "sm:col-span-2"}`} role="alert">
            {error}
          </p>
        )}
        <div className={compact ? "" : "sm:col-span-2"}>
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={busy}>
            {busy ? "One moment…" : mode === "register" ? "Create account & continue" : "Sign in & continue"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, error, hint, ...rest }: { name: string; label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={`auth-${name}`} className="field-label">
        {label} {hint && <span className="font-normal text-ink-mute">· {hint}</span>}
      </label>
      <input id={`auth-${name}`} name={name} className="input" aria-invalid={!!error} {...rest} />
      {error && <p className="mt-1 text-sm text-[#a3402c]">{error}</p>}
    </div>
  );
}

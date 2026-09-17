"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  const inputClass =
    "mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="block size-2.5 rounded-[3px] bg-foreground" />
        <span className="text-sm font-semibold tracking-tight">Agency Zero</span>
      </div>

      <h1 className="mt-10 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Private workspace — owner access only.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="email"
            className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error ? (
          <p className="border-l-2 border-foreground pl-3 text-sm text-foreground">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-inverted py-2.5 text-sm font-medium text-inverted-foreground transition-colors hover:bg-neutral-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-10 text-xs leading-5 text-faint-foreground">
        No sign-up here by design. Create the owner account in your Supabase
        project (Authentication → Users) — see supabase/README.md.
      </p>
    </div>
  );
}

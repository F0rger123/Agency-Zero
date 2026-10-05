"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { passkeysSupported, signInWithPasskey } from "@/lib/passkeys/client";

type Phase = "idle" | "checking" | "granted";

/**
 * CRM sign-in. Monochrome, with a restrained glitch on the wordmark.
 *
 * - Passkey first (when the browser supports it and the site has passkeys switched on), password always available.
 * - The motion reacts to *events only*: a pulse per keystroke and a scan line while checking. Nothing ever reads, renders
 *   or animates the characters typed, and the password field stays a normal masked input.
 * - "Access granted" is shown only AFTER a successful sign-in; authentication is never delayed for effect.
 * - prefers-reduced-motion switches every animation off (see globals.css); the flow is unchanged.
 */
export function LoginForm({ next = "/app", passkeysEnabled = false }: { next?: string; passkeysEnabled?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pulse, setPulse] = useState(0);
  const [passkeyReady, setPasskeyReady] = useState(false);
  const [showPassword, setShowPassword] = useState(!passkeysEnabled);
  const emailRef = useRef<HTMLInputElement>(null);
  const busy = phase !== "idle";

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const ready = passkeysEnabled && passkeysSupported();
      setPasskeyReady(ready);
      if (!ready) setShowPassword(true);
    });
    return () => cancelAnimationFrame(id);
  }, [passkeysEnabled]);

  const bump = () => setPulse((value) => value + 1);

  const finish = () => {
    setPhase("granted");
    window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 520);
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("checking");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.message);
      setPhase("idle");
      return;
    }
    finish();
  }

  async function onPasskey() {
    setPhase("checking");
    setError(null);
    const result = await signInWithPasskey();
    if (!result.ok) {
      setPhase("idle");
      if (!result.cancelled) setError(result.error);
      else setError(null);
      return;
    }
    finish();
  }

  const status = phase === "checking" ? "Identity check" : phase === "granted" ? "Access granted" : "Welcome back.";

  return (
    <div className="az-login" data-phase={phase}>
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
        <div className="az-stage">
          <h1 className="az-wordmark" data-text="AGENCY ZER0" aria-label="Agency Zero">
            <span aria-hidden>
              AGENCY ZER<span className="az-dim">0</span>
            </span>
            <span key={pulse} className="az-pulse" aria-hidden data-text="AGENCY ZER0" data-on={pulse > 0} />
          </h1>
          <span className="az-scan" aria-hidden />
        </div>

        <p className="az-status" role="status" aria-live="polite" data-phase={phase}>
          {status}
        </p>

        {passkeyReady ? (
          <div className="mt-8">
            <button type="button" onClick={onPasskey} disabled={busy} className="az-button az-button-solid" data-testid="passkey-button">
              {phase === "checking" ? "Waiting for your device…" : "Continue with passkey"}
            </button>
            <p className="mt-3 text-center text-xs text-neutral-500">Uses your device&apos;s secure unlock. Your biometrics never leave the device.</p>
          </div>
        ) : null}

        {passkeyReady && !showPassword ? (
          <button
            type="button"
            onClick={() => {
              setShowPassword(true);
              window.setTimeout(() => emailRef.current?.focus(), 0);
            }}
            className="az-link mt-6 self-center"
          >
            Use password instead
          </button>
        ) : null}

        {showPassword ? (
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="az-label">
                Email
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  bump();
                }}
                className="az-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="az-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  bump();
                }}
                className="az-input"
              />
              <span key={`tick-${pulse}`} className="az-tick" aria-hidden data-on={pulse > 0} />
            </div>

            <button type="submit" disabled={busy} className={`az-button ${passkeyReady ? "az-button-ghost" : "az-button-solid"}`}>
              {phase === "checking" ? "Checking…" : "Sign in"}
            </button>
          </form>
        ) : null}

        {error ? (
          <p role="alert" className="mt-6 border-l-2 border-white pl-3 text-sm text-white">
            {error}
          </p>
        ) : null}

        <p className="mt-12 text-xs leading-5 text-neutral-500">
          Private workspace. Authorized users only.
          {passkeyReady && showPassword ? " Passkeys are set up from Settings → Security after you sign in." : ""}
        </p>
      </div>
    </div>
  );
}

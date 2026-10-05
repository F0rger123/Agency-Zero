"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { FieldLabel, FormMessage, SubmitButton, TextInput } from "@/components/form-controls";
import type { ActionState } from "@/lib/forms";
import { passkeysSupported, registerPasskey } from "@/lib/passkeys/client";
import { removePasskeyAction, renamePasskeyAction } from "./actions";

const initialState: ActionState = {};

export type PasskeyRow = {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  device_type: string | null;
  backed_up: boolean;
};

const monthYear = (iso: string) => new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(iso));
const dayLabel = (iso: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(iso));

function PasskeyItem({ passkey }: { passkey: PasskeyRow }) {
  const [renameState, rename] = useActionState(renamePasskeyAction, initialState);
  const [removeState, remove] = useActionState(removePasskeyAction, initialState);
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium">{passkey.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Added {monthYear(passkey.created_at)} · {passkey.last_used_at ? `last used ${dayLabel(passkey.last_used_at)}` : "not used yet"}
            {passkey.backed_up ? " · synced across your devices" : ""}
          </p>
        </div>
        <form action={remove} onSubmit={(event) => { if (!window.confirm(`Remove “${passkey.name}”? You can still sign in with your password.`)) event.preventDefault(); }}>
          <input type="hidden" name="id" value={passkey.id} />
          <SubmitButton pendingLabel="Removing…" className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground">
            Remove
          </SubmitButton>
        </form>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">Rename</summary>
        <form action={rename} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={passkey.id} />
          <div className="min-w-56 flex-1">
            <FieldLabel label="Name" htmlFor={`pk-name-${passkey.id}`} required />
            <TextInput id={`pk-name-${passkey.id}`} name="name" required defaultValue={passkey.name} />
          </div>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          <FormMessage {...renameState} />
        </form>
      </details>
      <FormMessage {...removeState} />
    </li>
  );
}

/** Lists this account's passkeys and adds new ones (the device's own prompt does the biometric check). */
export function PasskeysManager({ passkeys, configured, defaultName }: { passkeys: PasskeyRow[]; configured: boolean; defaultName: string }) {
  const router = useRouter();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});

  useEffect(() => {
    const id = requestAnimationFrame(() => setSupported(passkeysSupported()));
    return () => cancelAnimationFrame(id);
  }, []);

  async function add() {
    setBusy(true);
    setMessage({});
    const result = await registerPasskey(name.trim() || defaultName);
    setBusy(false);
    if (result.ok) {
      setMessage({ success: "Passkey added. You can now use it on the sign-in page." });
      router.refresh();
    } else if (!result.cancelled) {
      setMessage({ error: result.error });
    }
  }

  return (
    <div className="space-y-10">
      {passkeys.length === 0 ? (
        <p className="border-y border-border py-6 text-sm text-muted-foreground">No passkeys yet. Add one for this device below.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {passkeys.map((passkey) => (
            <PasskeyItem key={passkey.id} passkey={passkey} />
          ))}
        </ul>
      )}

      <div>
        <h3 className="text-sm font-medium">Add a passkey on this device</h3>
        {!configured ? (
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
            Passkeys aren&apos;t switched on yet. They need the secret <code className="font-mono text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> set in
            your Cloudflare Worker (see the setup steps), then a redeploy.
          </p>
        ) : supported === false ? (
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
            This browser or device can&apos;t create passkeys here (they need a secure https connection and a device unlock such as fingerprint, face unlock,
            Windows Hello or a device PIN). Try another browser or device. Your password still works.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="max-w-sm">
              <FieldLabel label="Name this device" htmlFor="passkey-name" hint="e.g. Pixel 8 Pro" />
              <TextInput id="passkey-name" name="passkey-name" defaultValue={defaultName} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={add}
                disabled={busy || supported === null}
                className="rounded-md bg-inverted px-4 py-2.5 text-sm font-medium text-inverted-foreground transition-colors hover:bg-neutral-700 disabled:opacity-50"
              >
                {busy ? "Waiting for your device…" : "Add passkey"}
              </button>
              {message.error ? <p role="alert" className="text-sm">{message.error}</p> : null}
              {message.success ? <p role="status" className="text-sm text-muted-foreground">{message.success}</p> : null}
            </div>
            <p className="max-w-prose text-xs leading-5 text-faint-foreground">
              Your device asks for its normal unlock. Agency Zero never receives or stores your fingerprint, face or PIN, only a public key that is useless without
              your device.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

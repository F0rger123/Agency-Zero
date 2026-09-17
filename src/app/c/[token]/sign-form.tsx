"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { FieldLabel, FormMessage, SubmitButton, TextInput } from "@/components/form-controls";
import { signContractAction } from "./actions";
const initialState: ActionState = {};
export function SignContractForm({ token }: { token: string }) { const [state, action] = useActionState(signContractAction, initialState); return <form action={action} className="mt-10 border-t border-border pt-8"><input type="hidden" name="token" value={token} /><FieldLabel label="Signer name" htmlFor="signer-name" required /><TextInput id="signer-name" name="signer_name" required placeholder="Your full name" /><label className="mt-5 flex items-start gap-3 text-sm leading-6 text-muted-foreground"><input type="checkbox" name="agreement" required className="mt-1 size-4 accent-black" /> I confirm that I have reviewed this contract and intend this typed name to represent my electronic signature.</label><div className="mt-5 flex flex-wrap items-center gap-4"><SubmitButton pendingLabel="Signing…">Sign contract</SubmitButton><FormMessage {...state} /></div></form>; }

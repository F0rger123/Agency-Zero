import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { RP_NAME, challengeCookie, relyingParty, saveChallenge, sameOrigin, serviceClient } from "@/lib/passkeys/server";

export const dynamic = "force-dynamic";

/** Step 1 of adding a passkey. Requires an existing signed-in, authorised session: nobody else can enrol one. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const admin = serviceClient();
  if (!isSupabaseConfigured() || !admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const owner = await supabase.rpc("is_owner");
  if (owner.data !== true) return NextResponse.json({ error: "This account is not authorised." }, { status: 403 });

  const existing = await supabase.from("passkeys").select("credential_id, transports");
  if (existing.error) return NextResponse.json({ error: "needs_migration" }, { status: 503 });

  const { rpID } = relyingParty(request);
  const label = user.email ?? "Agency Zero user";
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: label,
    userDisplayName: label,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: (existing.data ?? []).map((row) => ({ id: row.credential_id as string, transports: (row.transports as string[]) ?? [] })),
    // Discoverable credential (a real passkey) with the device's own unlock required.
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    supportedAlgorithmIDs: [-7, -257, -8],
  });

  const saved = await saveChallenge(admin, { challenge: options.challenge, purpose: "register", userId: user.id });
  if ("error" in saved) return NextResponse.json({ error: saved.error === "busy" ? "Try again in a minute." : "needs_migration" }, { status: 503 });
  const response = NextResponse.json(options);
  response.cookies.set(challengeCookie(saved.id, process.env.NODE_ENV === "production"));
  return response;
}

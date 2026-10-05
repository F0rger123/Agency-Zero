import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { challengeCookie, relyingParty, saveChallenge, sameOrigin, serviceClient } from "@/lib/passkeys/server";

export const dynamic = "force-dynamic";

/** Step 1 of passkey sign-in (public). Username-less: the device offers the passkeys it holds for this site. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const admin = serviceClient();
  if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { rpID } = relyingParty(request);
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required", timeout: 60_000 });
  const saved = await saveChallenge(admin, { challenge: options.challenge, purpose: "login" });
  if ("error" in saved) return NextResponse.json({ error: saved.error === "busy" ? "busy" : "needs_migration" }, { status: 503 });

  const response = NextResponse.json(options);
  response.cookies.set(challengeCookie(saved.id, process.env.NODE_ENV === "production"));
  return response;
}

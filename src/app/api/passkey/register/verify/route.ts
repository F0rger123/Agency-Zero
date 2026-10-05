import { NextResponse } from "next/server";
import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createClient } from "@/lib/supabase/server";
import { CHALLENGE_COOKIE, consumeChallenge, guessDeviceName, relyingParty, sameOrigin, serviceClient } from "@/lib/passkeys/server";

export const dynamic = "force-dynamic";

/** Step 2: verify the device's attestation against the stored challenge, then save only the public credential. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const admin = serviceClient();
  if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const owner = await supabase.rpc("is_owner");
  if (owner.data !== true) return NextResponse.json({ error: "This account is not authorised." }, { status: 403 });

  let body: { response?: RegistrationResponseJSON; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!body.response) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const cookieId = request.headers.get("cookie")?.match(new RegExp(`${CHALLENGE_COOKIE}=([^;]+)`))?.[1];
  const challenge = await consumeChallenge(admin, cookieId, "register");
  if (!challenge || challenge.userId !== user.id) return NextResponse.json({ error: "That request expired. Try again." }, { status: 400 });

  const { rpID, origin } = relyingParty(request);
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch {
    return NextResponse.json({ error: "Your device's response could not be verified." }, { status: 400 });
  }
  if (!verification.verified || !verification.registrationInfo) return NextResponse.json({ error: "Your device's response could not be verified." }, { status: 400 });

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const name = (body.name ?? "").trim().slice(0, 80) || guessDeviceName(request.headers.get("user-agent"));
  const { error } = await admin.from("passkeys").insert({
    user_id: user.id,
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: body.response.response.transports ?? credential.transports ?? [],
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    name,
  });
  if (error) {
    return NextResponse.json({ error: error.code === "23505" ? "This passkey is already registered." : "Could not save the passkey." }, { status: error.code === "23505" ? 409 : 500 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete({ name: CHALLENGE_COOKIE, path: "/api/passkey" });
  return response;
}

import { NextResponse } from "next/server";
import { verifyAuthenticationResponse, type AuthenticationResponseJSON, type AuthenticatorTransport } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createClient } from "@/lib/supabase/server";
import { CHALLENGE_COOKIE, consumeChallenge, isAuthorizedUser, relyingParty, sameOrigin, serviceClient } from "@/lib/passkeys/server";

export const dynamic = "force-dynamic";

const refused = (message = "That passkey could not be used to sign in.", status = 401) => NextResponse.json({ error: message }, { status });

/**
 * Step 2 of passkey sign-in. The signature is verified against the stored public key and single-use challenge; the
 * account must still be the owner or an authorised team member; only then is a normal Supabase session started.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const admin = serviceClient();
  if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  let body: { response?: AuthenticationResponseJSON };
  try {
    body = await request.json();
  } catch {
    return refused("Bad request.", 400);
  }
  const assertion = body.response;
  if (!assertion?.id) return refused("Bad request.", 400);

  const cookieId = request.headers.get("cookie")?.match(new RegExp(`${CHALLENGE_COOKIE}=([^;]+)`))?.[1];
  const challenge = await consumeChallenge(admin, cookieId, "login");
  if (!challenge) return refused("That request expired. Try again.", 400);

  const stored = await admin.from("passkeys").select("id, user_id, credential_id, public_key, counter, transports").eq("credential_id", assertion.id).maybeSingle();
  if (stored.error || !stored.data) return refused("This passkey isn't registered for Agency Zero.");
  const row = stored.data as { id: string; user_id: string; credential_id: string; public_key: string; counter: number | string; transports: string[] };

  const { rpID, origin } = relyingParty(request);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: row.credential_id,
        publicKey: isoBase64URL.toBuffer(row.public_key),
        counter: Number(row.counter),
        transports: (row.transports ?? []) as AuthenticatorTransport[],
      },
    });
  } catch {
    return refused();
  }
  if (!verification.verified) return refused();

  // A valid passkey is not enough: the account must still be authorised for the CRM.
  if (!(await isAuthorizedUser(admin, row.user_id))) return refused("This account isn't authorised for the CRM.", 403);

  await admin.from("passkeys").update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq("id", row.id);

  const user = await admin.auth.admin.getUserById(row.user_id);
  const email = user.data.user?.email;
  if (user.error || !email) return refused("Could not start your session. Use your password.", 500);

  // Start a normal session: a one-time sign-in token is generated server-side (no email is sent) and redeemed here, so the
  // session cookies are set exactly as a password sign-in would set them.
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) return refused("Could not start your session. Use your password.", 500);
  const supabase = await createClient();
  let redeemed = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (redeemed.error) redeemed = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (redeemed.error) return refused("Could not start your session. Use your password.", 500);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete({ name: CHALLENGE_COOKIE, path: "/api/passkey" });
  return response;
}

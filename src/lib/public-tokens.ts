import { createHash, randomBytes } from "node:crypto";

/** Tokens are kept in the URL for usability and hashed for lookup. */
export function createPublicToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashPublicToken(token) };
}

export function hashPublicToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * "JWT issued at future" (PGRST303) means the database's clock briefly sits behind the clock
 * that minted the sign-in token. It clears on its own within seconds, so a short retry turns a
 * scary error page into a one-second delay. Any other error is returned untouched.
 */
export function isClockSkewError(message: string | undefined | null): boolean {
  return /jwt issued at future|issued at future/i.test(message ?? "");
}

export async function retryOnClockSkew<T extends { error: { message: string } | null }>(
  run: () => PromiseLike<T>,
  { attempts = 4, delayMs = 1500 }: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  let result = await run();
  for (let i = 1; i < attempts && isClockSkewError(result.error?.message); i += 1) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    result = await run();
  }
  return result;
}

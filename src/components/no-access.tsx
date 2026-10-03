import Link from "next/link";
import { signOut } from "@/app/actions/auth";

/** Shown to a signed-in account that is not the owner or an authorised team member. */
export function NoAccess({ email }: { email: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency Zero</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">No access to this workspace</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {email ? <>You are signed in as {email}, but this account</> : <>This account</>} has not been authorised to use
        the Agency Zero CRM. Ask the owner to grant access, or sign in with a different account.
      </p>
      <div className="mt-8 flex items-center gap-6 text-sm">
        <form action={signOut}>
          <button type="submit" className="font-medium underline decoration-border underline-offset-4">
            Sign out
          </button>
        </form>
        <Link href="/" className="text-muted-foreground underline decoration-border underline-offset-4">
          Back to the website
        </Link>
      </div>
    </main>
  );
}

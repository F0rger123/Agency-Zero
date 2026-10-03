import Link from "next/link";

/** Global 404 — dark, on-brand, and useful for both the public site and the CRM. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-center bg-ink px-[clamp(1.25rem,4vw,3.5rem)] text-bone">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.17em] text-ash">404 — Page not found</p>
      <h1 className="mt-6 text-[clamp(3rem,10vw,9rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
        Nothing here.
      </h1>
      <p className="mt-8 max-w-md text-mist">This page doesn&apos;t exist or has moved.</p>
      <div className="mt-10 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-[0.15em]">
        <Link href="/" className="border border-rule-strong px-6 py-4 transition-colors hover:bg-bone hover:text-ink">
          Back to the website
        </Link>
        <Link href="/app" className="px-2 py-4 text-ash underline underline-offset-4 transition-colors hover:text-bone">
          Agency login
        </Link>
      </div>
    </div>
  );
}

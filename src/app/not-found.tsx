import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit items-center rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

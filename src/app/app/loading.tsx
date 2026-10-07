/**
 * Instant feedback while a section loads. Next.js shows this the moment a link is tapped (and can prefetch
 * it), so moving between sections never feels stuck. Quiet blocks, no spinner, no layout shift.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="h-7 w-48 rounded-md bg-muted" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-md bg-muted" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}

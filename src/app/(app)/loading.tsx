import { Skeleton } from "@/components/states";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-3 h-4 w-80" />
      <div className="mt-10 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-background p-6">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-14 space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

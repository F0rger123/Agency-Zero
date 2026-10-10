import { ZeroMark } from "@/components/zero-mark";

/**
 * Shown the instant a section is tapped, while its data loads. A thin bar sweeps across the top and the
 * zero draws itself in a loop. Quiet, centered, and it never shifts the layout.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" role="status">
      <div className="fixed inset-x-0 top-16 z-20 h-0.5 overflow-hidden">
        <div className="loader-bar h-full w-1/3 bg-foreground" />
      </div>
      <div className="flex min-h-[55vh] items-center justify-center">
        <ZeroMark className="size-14 text-foreground" draw loop />
      </div>
    </div>
  );
}

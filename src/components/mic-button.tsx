"use client";

import { Icon } from "@/components/icons";
import { VOICE_LANGUAGES, type Dictation } from "@/lib/use-dictation";

/** Round mic button. Fills while listening and ripples while you are talking. Renders nothing where voice typing is unsupported. */
export function MicButton({
  dictation,
  label = "voice typing",
  className = "",
  active,
  onClick,
  size = "md",
}: {
  dictation: Dictation;
  label?: string;
  className?: string;
  /** Override for several fields sharing one microphone. */
  active?: boolean;
  onClick?: () => void;
  /** "lg" is a big, easy target (Quick note). */
  size?: "md" | "lg";
}) {
  if (!dictation.supported) return null;
  const listening = active ?? dictation.listening;
  const { speaking } = dictation;
  return (
    <button
      type="button"
      onClick={onClick ?? dictation.toggle}
      aria-pressed={listening}
      aria-label={listening ? `Stop ${label}` : `Start ${label}`}
      className={`press ${className.includes("absolute") ? "" : "relative"} flex ${size === "lg" ? "size-20" : "size-10"} shrink-0 items-center justify-center rounded-full border transition-colors ${
        listening ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
      } ${className}`}
    >
      {listening ? <span aria-hidden className={`voice-ring ${speaking ? "voice-ring-fast" : ""}`} /> : null}
      <Icon name="mic" className={`relative ${size === "lg" ? "size-9" : "size-5"}`} />
    </button>
  );
}

/** Live caption, tips and language for a mic button. Put it under the field. */
export function DictationHint({ dictation, className = "" }: { dictation: Dictation; className?: string }) {
  if (!dictation.supported) {
    return <p className={`text-xs text-muted-foreground ${className}`}>Voice typing is not available in this browser. Use your keyboard&apos;s microphone key, or type.</p>;
  }
  return (
    <div className={`space-y-1 text-xs text-muted-foreground ${className}`}>
      {dictation.error ? (
        <p role="alert" className="font-medium text-foreground">{dictation.error}</p>
      ) : dictation.listening ? (
        <>
          <p role="status" aria-live="polite" className="min-h-4">
            <span className="font-medium text-foreground">Listening…</span> {dictation.interim ? <em className="not-italic opacity-70">{dictation.interim}</em> : "start talking"}
          </p>
          <p>Say “period”, “comma”, “question mark”, “new line” or “scratch that”.</p>
        </>
      ) : null}
      {dictation.listening ? null : (
        <label className="inline-flex items-center gap-2">
          Voice language
          <select
            value={dictation.lang}
            onChange={(event) => dictation.setLang(event.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
          >
            {VOICE_LANGUAGES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

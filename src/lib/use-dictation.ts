"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type Ctor = new () => Recognition;

function ctor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};
const LANG_KEY = "az-voice-lang";

export const VOICE_LANGUAGES = [
  ["en-US", "English (US)"],
  ["en-GB", "English (UK)"],
  ["es-ES", "Español"],
  ["fr-FR", "Français"],
  ["de-DE", "Deutsch"],
  ["pt-BR", "Português"],
] as const;

function savedLanguage(): string {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved && VOICE_LANGUAGES.some(([code]) => code === saved)) return saved;
  } catch {
    // Storage blocked: fall back to the browser language.
  }
  const browser = typeof navigator !== "undefined" ? navigator.language : "en-US";
  return VOICE_LANGUAGES.find(([code]) => code === browser)?.[0] ?? "en-US";
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser settings, or type instead.",
  "service-not-allowed": "Voice typing is not allowed in this browser. Type instead.",
  "audio-capture": "No microphone was found.",
  network: "Voice typing needs an internet connection.",
};

/**
 * Voice typing on the browser's speech recognition.
 *  - `onText` receives each finished phrase (run it through `applyDictation` to get punctuation and capitals).
 *  - `interim` is what is being heard right now, for a live caption; `speaking` is true while words are coming in.
 *  - It keeps listening through pauses (browsers stop on their own after silence, so it quietly restarts) until you stop it.
 * `supported` is false on the server, so the mic simply does not render until the page is in the browser.
 */
export function useDictation(onText: (phrase: string) => void) {
  const supported = useSyncExternalStore(noop, () => ctor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [lang, setLangState] = useState("en-US");
  const instance = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const restarts = useRef(0);
  const handler = useRef(onText);
  const langRef = useRef("en-US");
  const quiet = useRef<number | undefined>(undefined);
  const retry = useRef<number | undefined>(undefined);
  const beginRef = useRef<() => void>(() => {});
  const interimRef = useRef("");
  const lastFinal = useRef({ text: "", at: 0 });
  useEffect(() => {
    handler.current = onText;
  });

  /** Hands over a finished phrase, ignoring an exact repeat that arrives straight after (some phones send phrases twice). */
  const commit = useCallback((phrase: string) => {
    const text = phrase.trim();
    if (!text) return;
    const now = Date.now();
    if (text === lastFinal.current.text && now - lastFinal.current.at < 1200) return;
    lastFinal.current = { text, at: now };
    handler.current(text);
  }, []);

  const setLang = useCallback((code: string) => {
    langRef.current = code;
    setLangState(code);
    try {
      window.localStorage.setItem(LANG_KEY, code);
    } catch {
      // Storage blocked: the choice lasts until the page closes.
    }
  }, []);

  useEffect(() => {
    // Read the saved language once on the device (not during render, so the server and browser agree).
    const code = savedLanguage();
    langRef.current = code;
    const timer = window.setTimeout(() => setLangState(code), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const halt = useCallback((message = "") => {
    wanted.current = false;
    window.clearTimeout(retry.current);
    window.clearTimeout(quiet.current);
    // Fast talkers: whatever was still being worked out when you pressed stop is kept, not lost.
    const leftover = interimRef.current;
    interimRef.current = "";
    if (leftover.trim()) commit(leftover);
    const current = instance.current;
    instance.current = null;
    if (current && leftover.trim()) current.onresult = null; // already kept above; do not add it twice
    current?.stop();
    setListening(false);
    setSpeaking(false);
    setInterim("");
    setError(message);
  }, [commit]);

  const begin = useCallback(() => {
    const Recognizer = ctor();
    if (!Recognizer || !wanted.current) return;
    const rec = new Recognizer();
    rec.lang = langRef.current;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      restarts.current = 0;
      let heard = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          commit(result[0].transcript);
        } else {
          heard += result[0].transcript;
        }
      }
      interimRef.current = heard;
      setInterim(heard.trim());
      setSpeaking(true);
      window.clearTimeout(quiet.current);
      quiet.current = window.setTimeout(() => setSpeaking(false), 900);
    };
    rec.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return; // normal pauses; onend restarts
      halt(ERRORS[event.error] ?? "Voice typing stopped. Tap the mic to try again.");
    };
    rec.onend = () => {
      if (instance.current !== rec) return;
      if (interimRef.current.trim()) commit(interimRef.current);
      interimRef.current = "";
      setInterim("");
      if (!wanted.current || restarts.current >= 30) return halt();
      // The browser ended the session on its own (silence, time limit): carry on.
      restarts.current += 1;
      retry.current = window.setTimeout(() => beginRef.current(), 250);
    };
    instance.current = rec;
    try {
      rec.start();
    } catch {
      halt("Voice typing could not start. Tap the mic to try again.");
    }
  }, [halt, commit]);
  useEffect(() => {
    beginRef.current = begin;
  });

  const start = useCallback(() => {
    if (wanted.current || !ctor()) return;
    wanted.current = true;
    restarts.current = 0;
    setError("");
    setListening(true);
    begin();
  }, [begin]);

  const stop = useCallback(() => halt(), [halt]);
  const toggle = useCallback(() => (wanted.current ? halt() : start()), [halt, start]);

  useEffect(
    () => () => {
      wanted.current = false;
      window.clearTimeout(retry.current);
      window.clearTimeout(quiet.current);
      instance.current?.abort();
    },
    [],
  );

  return { supported, listening, speaking, interim, error, lang, setLang, toggle, start, stop };
}

export type Dictation = ReturnType<typeof useDictation>;

/**
 * One microphone shared by several fields on a screen: tapping a field's mic starts listening for that field
 * (and moves it if another field was listening). `apply` receives the field name and each heard phrase.
 */
export function useDictationTarget<T extends string>(apply: (target: T, phrase: string) => void) {
  const target = useRef<T | null>(null);
  const [active, setActive] = useState<T | null>(null);
  const dictation = useDictation((phrase) => {
    if (target.current) apply(target.current, phrase);
  });
  const { listening, stop, start } = dictation;
  const toggleFor = useCallback(
    (next: T) => {
      if (listening && target.current === next) {
        stop();
        target.current = null;
        setActive(null);
        return;
      }
      if (listening) stop();
      target.current = next;
      setActive(next);
      start();
    },
    [listening, stop, start],
  );
  return { dictation, toggleFor, activeTarget: listening ? active : null };
}

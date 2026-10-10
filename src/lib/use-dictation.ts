"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
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

/**
 * Voice typing with the browser's speech recognition. `onText` receives each finished phrase.
 * `supported` is only meaningful after mount (it reads `window`), so use it in client-only UI.
 */
export function useDictation(onText: (phrase: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const instance = useRef<Recognition | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  });

  const stop = useCallback(() => {
    instance.current?.stop();
    instance.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => instance.current?.stop(), []);

  const toggle = useCallback(() => {
    if (instance.current) return stop();
    const Recognizer = ctor();
    if (!Recognizer) return;
    setError("");
    const rec = new Recognizer();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      let phrase = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) phrase += event.results[i][0].transcript;
      }
      if (phrase.trim()) handler.current(phrase.trim());
    };
    rec.onerror = (event) => {
      setError(event.error === "not-allowed" ? "Microphone access was blocked. Allow it in your browser, or type." : "Voice typing stopped. Tap the mic to try again.");
      instance.current = null;
      setListening(false);
    };
    rec.onend = () => {
      instance.current = null;
      setListening(false);
    };
    instance.current = rec;
    rec.start();
    setListening(true);
  }, [stop]);

  return { supported: ctor() !== null, listening, error, toggle, stop };
}

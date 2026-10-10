"use client";

import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";

/** Lets any form inside a dialog close it once its action reports success (see FormMessage). */
export const ModalContext = createContext<{ close: () => void } | null>(null);

export function useModal() {
  return useContext(ModalContext);
}

/**
 * Centered dialog over a blurred backdrop. X, Escape and a click outside all cancel;
 * nothing is saved unless the form inside is submitted.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        aria-label="Cancel"
        tabIndex={-1}
        onClick={onClose}
        className="modal-backdrop absolute inset-0 cursor-default bg-foreground/30 backdrop-blur-sm"
      />
      <div className="modal-card relative flex max-h-[min(92dvh,46rem)] w-full max-w-2xl flex-col rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 id={titleId} className="text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="press -mr-2 rounded-md p-2 text-foreground transition-[background-color,transform] duration-200 hover:rotate-90 hover:bg-muted"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <div data-modal-body className="overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A button that opens `children` (a form) in a dialog; the dialog closes itself when the form succeeds. */
export function AddDialog({
  label,
  title,
  description,
  children,
  variant = "solid",
  className = "",
}: {
  label: string;
  title?: string;
  description?: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`press inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[opacity,transform,background-color] ${
          variant === "solid"
            ? "bg-inverted text-inverted-foreground hover:opacity-80"
            : "border border-border hover:bg-muted"
        } ${className}`}
      >
        <span aria-hidden className="text-base leading-none">+</span>
        {label}
      </button>
      <ModalContext.Provider value={{ close }}>
        <Modal open={open} onClose={close} title={title ?? label} description={description}>
          {children}
        </Modal>
      </ModalContext.Provider>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Engine, type Mode, type RemoteCursor, type Style, type Tool } from "@/lib/whiteboard/engine";
import { newId } from "@/lib/whiteboard/ids";
import { mergeBoards, parseBoard } from "@/lib/whiteboard/ops";
import { buildPdf, dataUrlToBytes } from "@/lib/whiteboard/pdf";
import { renderFrameCanvas } from "@/lib/whiteboard/render";
import { defaultBoard } from "@/lib/whiteboard/template";
import { openTransport, type Status, type Transport } from "@/lib/whiteboard/transport";
import { INK, NOTE_COLORS, PEN_WIDTHS, type BoardData, type Message, type Op, type ShapeKind } from "@/lib/whiteboard/types";
import { regenerateWhiteboardLinkAction, renameWhiteboardAction, saveWhiteboardAction, setWhiteboardShareAction } from "@/app/app/whiteboard/actions";
import { saveBoardFileAction } from "@/app/app/meetings/actions";
import { Notepad, type NotepadMeeting } from "./notepad";
import { WbIcon, type WbIconName } from "./wb-icons";
import { recoverIfStale } from "@/lib/stale-build";
import { HapticsListener } from "@/components/haptics-listener";

type Role = "owner" | "guest";
type ShareMode = "edit" | "view" | "off";
type Menu = null | "shapes" | "more" | "export" | "share";

const SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: "rect", label: "Rectangle" },
  { kind: "ellipse", label: "Circle" },
  { kind: "line", label: "Line" },
  { kind: "arrow", label: "Arrow" },
];
const TEXT_SIZES = [26, 40, 64];
const INK_NAMES = ["Ink", "Grey", "Red", "Orange", "Green", "Blue", "Purple"];
const NOTE_NAMES = ["Yellow", "Pink", "Blue", "Green"];
const WIDTH_NAMES = ["Thin", "Medium", "Thick"];
const TOOL_KEYS: Partial<Record<Tool, string>> = { select: "V", pen: "P", eraser: "E", shape: "S", text: "T", note: "N" };

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "board";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Merges neighbouring operations on the same element so a fast stroke is a few small messages, not hundreds. */
function coalesce(ops: Op[]): Op[] {
  const out: Op[] = [];
  for (const op of ops) {
    const last = out[out.length - 1];
    if (last && op.k === "ext" && last.k === "ext" && last.id === op.id && last.f === op.f) out[out.length - 1] = { ...last, pts: last.pts.concat(op.pts) };
    else if (last && op.k === "put" && last.k === "put" && last.el.id === op.el.id && last.f === op.f) out[out.length - 1] = op;
    else out.push(op);
  }
  return out;
}

export function BoardEditor({
  initial,
  boardId,
  token: initialToken,
  role,
  shareMode: initialShareMode,
  title: initialTitle,
  backHref,
  meeting: initialMeeting = null,
  canFile = false,
}: {
  initial: BoardData | null;
  boardId?: string;
  token: string;
  role: Role;
  shareMode: ShareMode;
  title: string;
  backHref?: string;
  /** The meeting this board belongs to (owner only); its notes are the notepad. */
  meeting?: NotepadMeeting | null;
  /** The board (or its meeting) has a customer, so exports can be saved to their files. */
  canFile?: boolean;
}) {
  const [data] = useState<BoardData>(() => initial ?? defaultBoard());
  const [selfId] = useState(() => newId());
  const [engine, setEngine] = useState<Engine | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>(role === "guest" && initialShareMode === "view" ? "select" : "pen");
  const [style, setStyle] = useState<Style>({ color: INK[0], width: PEN_WIDTHS[1], shape: "rect", noteColor: NOTE_COLORS[0], textSize: TEXT_SIZES[1] });
  const [frame, setFrame] = useState(0);
  const [present, setPresent] = useState(false);
  const [following, setFollowing] = useState(true);
  const [status, setStatus] = useState<Status>("connecting");
  const [peers, setPeers] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [hist, setHist] = useState({ undo: false, redo: false });
  const [menu, setMenu] = useState<Menu>(null);
  const [toast, setToast] = useState("");
  const [shareMode, setShareMode] = useState<ShareMode>(initialShareMode);
  const [token, setToken] = useState(initialToken);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [title, setTitle] = useState(initialTitle);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dock, setDock] = useState(false);
  const [notepad, setNotepad] = useState(false);
  const [meeting, setMeeting] = useState<NotepadMeeting | null>(initialMeeting);
  const [filing, setFiling] = useState(false);
  const [dockOffset, setDockOffset] = useState({ x: 0, y: 0 });
  const dockDrag = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null);
  const router = useRouter();

  const viewOnly = role === "guest" && shareMode === "view";
  const live = useRef({ frame: 0, following: true, present: false, dock: false, shareMode: initialShareMode, token: initialToken });
  const transport = useRef<Transport | null>(null);
  const outbox = useRef<Op[]>([]);
  const flushTimer = useRef<number | undefined>(undefined);
  const saveTimer = useRef<number | undefined>(undefined);
  const cursorAt = useRef(0);
  const peerSeen = useRef(new Map<string, number>());
  const cursors = useRef(new Map<string, RemoteCursor>());
  const zoomTimer = useRef<number | undefined>(undefined);
  const toastTimer = useRef<number | undefined>(undefined);
  const engineRef = useRef<Engine | null>(null);
  const goFrameRef = useRef<(index: number, manual?: boolean) => void>(() => {});

  useEffect(() => {
    live.current = { frame, following, present, dock, shareMode, token };
  });

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  /* ── Saving (owner) and sending (everyone) ─────────────────────────────────────────────── */

  const saveNow = useCallback(async () => {
    const current = engineRef.current;
    if (role !== "owner" || !boardId || !current) return;
    setSaveState("saving");
    const json = JSON.stringify(current.getData());
    let result: Awaited<ReturnType<typeof saveWhiteboardAction>>;
    try {
      result = await saveWhiteboardAction(boardId, json);
    } catch (error) {
      // The app was updated while the board was open: keep the drawing on this device, reload, and save it from there.
      const stash = () => {
        try {
          window.localStorage.setItem(`az-wb-rescue-${boardId}`, json);
        } catch {
          // Storage full or blocked.
        }
      };
      if (!recoverIfStale(error, stash)) showToast("Not saved: no connection. It retries on your next change.");
      setSaveState("error");
      return;
    }
    if (result.ok) {
      try {
        window.localStorage.removeItem(`az-wb-rescue-${boardId}`);
      } catch {
        // Nothing stashed.
      }
    }
    setSaveState(result.ok ? "saved" : "error");
    if (!result.ok && result.error) showToast(result.error);
  }, [role, boardId, showToast]);

  const scheduleSave = useCallback(() => {
    if (role !== "owner" || !boardId) return;
    setSaveState("saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void saveNow(), 1200);
  }, [role, boardId, saveNow]);

  const send = useCallback((message: Message) => transport.current?.send(message), []);

  const flush = useCallback(() => {
    flushTimer.current = undefined;
    const ops = coalesce(outbox.current);
    outbox.current = [];
    if (ops.length) send({ k: "ops", from: selfId, ops });
  }, [selfId, send]);

  const name = role === "owner" ? "Host" : "Guest";

  const onMessage = useCallback(
    (message: Message) => {
      if (message.from === selfId) return;
      const current = engineRef.current;
      if (!current) return;
      peerSeen.current.set(message.from, Date.now());
      switch (message.k) {
        case "ops": {
          // A "view only" link is a courtesy for guests: the host ignores drawing from anyone else in that case.
          if (role === "owner" && live.current.shareMode !== "edit") return;
          current.applyRemote(message.ops);
          scheduleSave();
          break;
        }
        case "frame": {
          if (role === "guest" && live.current.following && message.f !== current.getFrame()) {
            current.setFrame(message.f, message.f > current.getFrame() ? 1 : -1);
            setFrame(message.f);
          }
          break;
        }
        case "cur": {
          if (message.show) cursors.current.set(message.from, { name: message.name, x: message.x, y: message.y, f: message.f, at: Date.now() });
          else cursors.current.delete(message.from);
          current.setCursors(new Map(cursors.current));
          break;
        }
        case "hello": {
          if (role === "owner") {
            send({ k: "snap", from: selfId, to: message.from, data: current.getData() });
            send({ k: "frame", from: selfId, f: current.getFrame() });
          }
          break;
        }
        case "snap": {
          if (message.to === selfId && mergeBoards(current.getData(), message.data)) current.requestRender();
          break;
        }
        case "hb":
          break;
      }
    },
    [role, selfId, send, scheduleSave],
  );

  const attachCanvas = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (!node) return;
      const created = new Engine(node, data, {
        onOps: (ops) => {
          outbox.current.push(...ops);
          if (flushTimer.current === undefined) flushTimer.current = window.setTimeout(flush, 30);
          scheduleSave();
        },
        onEdit: () => {},
        onView: () => {
          window.clearTimeout(zoomTimer.current);
          zoomTimer.current = window.setTimeout(() => setZoom(Math.round(created.getView().s * 100)), 90);
        },
        onHistory: () => setHist({ undo: created.canUndo(), redo: created.canRedo() }),
        onCursor: (x, y, show) => {
          const now = performance.now();
          if (show && now - cursorAt.current < 40) return;
          cursorAt.current = now;
          transport.current?.send({ k: "cur", from: selfId, name, f: created.getFrame(), x, y, show });
        },
        onSwipe: (direction) => {
          const next = created.getFrame() + direction;
          if (next >= 0 && next < created.getData().frames.length) goFrameRef.current(next);
        },
      });
      engineRef.current = created;
      setEngine(created);
      return () => {
        created.destroy();
        engineRef.current = null;
      };
    },
    // The engine is created once per canvas; everything it calls goes through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  // A drawing kept on this device when an app update interrupted a save: merge it back in and save it.
  useEffect(() => {
    if (!engine || role !== "owner" || !boardId) return;
    let stashed: string | null = null;
    try {
      stashed = window.localStorage.getItem(`az-wb-rescue-${boardId}`);
    } catch {
      return;
    }
    if (!stashed) return;
    let board: BoardData | null = null;
    try {
      board = parseBoard(JSON.parse(stashed));
    } catch {
      board = null;
    }
    if (board && mergeBoards(engine.getData(), board)) engine.requestRender();
    const timer = window.setTimeout(() => void saveNow(), 300);
    return () => window.clearTimeout(timer);
  }, [engine, role, boardId, saveNow]);

  const goFrame = useCallback(
    (index: number, manual = true) => {
      const current = engineRef.current;
      if (!current || index === current.getFrame() || index < 0 || index >= current.getData().frames.length) return;
      current.setFrame(index, index > current.getFrame() ? 1 : -1);
      setFrame(index);
      if (role === "owner") send({ k: "frame", from: selfId, f: index });
      else if (manual) setFollowing(false);
    },
    [role, selfId, send],
  );
  useEffect(() => {
    goFrameRef.current = goFrame;
  });

  // Live connection.
  useEffect(() => {
    if (shareMode === "off" && role === "guest") return;
    const link = openTransport(token, onMessage, setStatus);
    transport.current = link;
    return () => {
      link?.close();
      transport.current = null;
    };
  }, [token, onMessage, shareMode, role]);

  // Say hello when the connection comes up, then keep a quiet heartbeat and count who is here.
  useEffect(() => {
    if (status !== "live") return;
    send({ k: "hello", from: selfId, name });
    const timer = window.setInterval(() => {
      send({ k: "hb", from: selfId, name });
      const cutoff = Date.now() - 9000;
      for (const [id, seen] of peerSeen.current) if (seen < cutoff) peerSeen.current.delete(id);
      setPeers(peerSeen.current.size);
    }, 3000);
    const quick = window.setTimeout(() => setPeers(peerSeen.current.size), 900);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(quick);
    };
  }, [status, selfId, name, send]);

  // Flush anything unsaved or unsent when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" || document.visibilityState === undefined) {
        if (flushTimer.current !== undefined) {
          window.clearTimeout(flushTimer.current);
          flush();
        }
        if (saveTimer.current !== undefined) {
          window.clearTimeout(saveTimer.current);
          void saveNow();
        }
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flush, saveNow]);

  // Engine mode follows presenting and the sharing mode.
  useEffect(() => {
    if (!engine) return;
    const mode: Mode = present ? "present" : viewOnly ? "view" : "edit";
    engine.setMode(mode);
  }, [engine, present, viewOnly]);

  // Tools in presentation mode: the camera stays on the page, but drawing and the other tools work.
  useEffect(() => {
    engine?.setAnnotate(present && dock && !viewOnly);
  }, [engine, present, dock, viewOnly]);

  // The board owns the screen: nothing behind it may scroll or bounce.
  useEffect(() => {
    const html = document.documentElement;
    const before = { html: html.style.overflow, body: document.body.style.overflow, overscroll: html.style.overscrollBehavior };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = before.html;
      document.body.style.overflow = before.body;
      html.style.overscrollBehavior = before.overscroll;
    };
  }, []);

  // Leave room for the header and the toolbar when fitting the page.
  const drawableNow = !viewOnly && !present;
  useEffect(() => {
    if (!engine) return;
    if (present) engine.setInsets(0, 0);
    else engine.setInsets(100, drawableNow ? 140 : 24);
  }, [engine, present, drawableNow]);

  useEffect(() => {
    engine?.setTool(tool);
  }, [engine, tool]);
  useEffect(() => {
    engine?.setStyle(style);
  }, [engine, style]);

  /* ── Presenting ─────────────────────────────────────────────────────────────────────────── */

  const startPresent = () => {
    setMenu(null);
    setPresent(true);
    void rootRef.current?.requestFullscreen?.().catch(() => {});
  };
  const endPresent = useCallback(() => {
    setPresent(false);
    setDock(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const onFullscreen = () => {
      if (!document.fullscreenElement && live.current.present) {
        setPresent(false);
        setDock(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  /* ── Keyboard ───────────────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
      if (!engine) return;
      if (live.current.present) {
        if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(event.key)) {
          event.preventDefault();
          goFrame(engine.getFrame() + 1, false);
          return;
        }
        if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key) || (event.key === "Backspace" && !live.current.dock)) {
          event.preventDefault();
          goFrame(engine.getFrame() - 1, false);
          return;
        }
        if (event.key === "Escape") {
          endPresent();
          return;
        }
        if (event.key === "+" || event.key === "=") return engine.zoomBy(1.25);
        if (event.key === "-") return engine.zoomBy(0.8);
        if (event.key === "0") return engine.fit();
        if (!live.current.dock) return;
      }
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) engine.redo();
        else engine.undo();
      } else if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        engine.redo();
      } else if (!meta && (event.key === "Delete" || event.key === "Backspace")) {
        engine.deleteSelected();
      } else if (!meta && !viewOnly) {
        const keys: Record<string, Tool> = { v: "select", p: "pen", e: "eraser", s: "shape", t: "text", n: "note" };
        const next = keys[event.key.toLowerCase()];
        if (next) setTool(next);
        if (event.key === "Escape") setMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine, goFrame, endPresent, viewOnly]);

  /* ── Export ─────────────────────────────────────────────────────────────────────────────── */

  const exportPng = () => {
    if (!engine) return;
    setMenu(null);
    const index = engine.getFrame();
    const canvas = renderFrameCanvas(engine.getData().frames[index], 2);
    canvas.toBlob((blob) => {
      if (blob) download(blob, `${slug(title)}-${index + 1}-${slug(engine.getData().frames[index].title)}.png`);
    }, "image/png");
  };
  const boardPdf = (current: Engine) => {
    const pages = current.getData().frames.map((entry) => {
      const canvas = renderFrameCanvas(entry, 2);
      return { jpeg: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92)), pxWidth: canvas.width, pxHeight: canvas.height, ptWidth: canvas.width / 4, ptHeight: canvas.height / 4 };
    });
    return new Blob([buildPdf(pages) as BlobPart], { type: "application/pdf" });
  };
  const exportPdf = () => {
    if (!engine) return;
    setMenu(null);
    download(boardPdf(engine), `${slug(title)}.pdf`);
  };
  /** All frames as a PDF, straight into the customer's files (tagged with the meeting when there is one). */
  const fileToCustomer = async () => {
    if (!engine || !boardId || filing) return;
    setMenu(null);
    setFiling(true);
    showToast("Saving to the customer's files…");
    try {
      await saveNow();
      const form = new FormData();
      form.set("board_id", boardId);
      form.set("file", new File([boardPdf(engine)], `${slug(title)}-${new Date().toISOString().slice(0, 10)}.pdf`, { type: "application/pdf" }));
      const result = await saveBoardFileAction(form);
      showToast(result.ok ? "Saved to the customer's files" : (result.error ?? "Could not save the file."));
    } catch {
      showToast("No connection. Try again in a moment.");
    } finally {
      setFiling(false);
    }
  };

  /* ── Share ──────────────────────────────────────────────────────────────────────────────── */

  const link = typeof window === "undefined" ? "" : `${window.location.origin}/w/${token}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Link copied");
    } catch {
      showToast("Select the link and copy it");
    }
  };
  const shareLink = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: link });
        return;
      } catch {
        // Cancelled: fall through to copying.
      }
    }
    void copyLink();
  };
  const changeShare = async (mode: ShareMode) => {
    if (!boardId) return;
    setShareMode(mode);
    const result = await setWhiteboardShareAction(boardId, mode);
    if (!result.ok) showToast(result.error ?? "Could not change sharing");
  };
  const newLink = async () => {
    if (!boardId) return;
    const result = await regenerateWhiteboardLinkAction(boardId);
    if (result.ok && result.token) {
      setToken(result.token);
      showToast("New link. The old one no longer works.");
    } else showToast(result.error ?? "Could not make a new link");
  };

  const frames = engine?.getData().frames ?? data.frames;
  const frameCount = frames.length;
  const drawable = !viewOnly && !present;
  const toolsVisible = !viewOnly && (!present || dock);
  const showStyle = toolsVisible && (tool === "pen" || tool === "shape" || tool === "text" || tool === "note");

  const toolButton = (key: Tool, icon: WbIconName, label: string, onClick?: () => void) => (
    <button
      key={key + label}
      type="button"
      aria-label={label}
      aria-pressed={tool === key}
      data-tip={TOOL_KEYS[key] ? `${label} · ${TOOL_KEYS[key]}` : label}
      onClick={onClick ?? (() => (setTool(key), setMenu(null)))}
      className={`wb-btn wb-tool ${tool === key ? "wb-btn-on" : ""}`}
    >
      <WbIcon name={icon} />
    </button>
  );

  const toolbar = (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          style={present ? { transform: `translate(${dockOffset.x}px, ${dockOffset.y}px)` } : undefined}
          data-wb-menu
        >
          {showStyle ? (
            <div className="wb-rise pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Colour">
                {(tool === "note" ? NOTE_COLORS : INK).map((color, index) => {
                  const chosen = (tool === "note" ? style.noteColor : style.color) === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      aria-label={(tool === "note" ? NOTE_NAMES : INK_NAMES)[index]}
                      data-tip={(tool === "note" ? NOTE_NAMES : INK_NAMES)[index]}
                      onClick={() => setStyle((value) => (tool === "note" ? { ...value, noteColor: color } : { ...value, color }))}
                      className={`wb-swatch size-7 rounded-full border ${chosen ? "wb-swatch-on border-foreground ring-2 ring-foreground/20" : "border-black/10"}`}
                      style={{ background: color }}
                    />
                  );
                })}
              </div>
              {tool === "pen" || tool === "shape" ? (
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Thickness">
                  {PEN_WIDTHS.map((width, index) => (
                    <button key={width} type="button" role="radio" aria-checked={style.width === width} aria-label={WIDTH_NAMES[index]} data-tip={WIDTH_NAMES[index]} onClick={() => setStyle((value) => ({ ...value, width }))} className={`wb-chip grid size-8 place-items-center rounded-full ${style.width === width ? "bg-muted" : ""}`}>
                      <span className="rounded-full bg-foreground" style={{ width: 4 + width, height: 4 + width }} />
                    </button>
                  ))}
                </div>
              ) : null}
              {tool === "text" ? (
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Text size">
                  {TEXT_SIZES.map((size, index) => (
                    <button key={size} type="button" role="radio" aria-checked={style.textSize === size} aria-label={`Text size ${["small", "medium", "large"][index]}`} data-tip={["Small", "Medium", "Large"][index]} onClick={() => setStyle((value) => ({ ...value, textSize: size }))} className={`wb-chip grid size-8 place-items-center rounded-full font-semibold ${style.textSize === size ? "bg-muted" : ""}`} style={{ fontSize: 11 + index * 4 }}>A</button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {menu === "shapes" ? (
            <div className="wb-rise pointer-events-auto flex items-center gap-1 rounded-2xl border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur" role="radiogroup" aria-label="Shape">
              {SHAPES.map((shape) => (
                <button key={shape.kind} type="button" role="radio" aria-checked={style.shape === shape.kind && tool === "shape"} aria-label={shape.label} data-tip={shape.label} onClick={() => (setStyle((value) => ({ ...value, shape: shape.kind })), setTool("shape"), setMenu(null))} className={`wb-btn wb-tool !size-11 ${style.shape === shape.kind && tool === "shape" ? "wb-btn-on" : ""}`}>
                  <WbIcon name={shape.kind} />
                </button>
              ))}
            </div>
          ) : null}
          {menu === "more" ? (
            <div className="wb-rise pointer-events-auto w-[min(92vw,16rem)] rounded-2xl border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur">
              {present ? null : (
                <>
                  <button type="button" className="wb-menu-item" onClick={() => (engine?.zoomBy(1.25), setMenu(null))}>Zoom in</button>
                  <button type="button" className="wb-menu-item" onClick={() => (engine?.zoomBy(0.8), setMenu(null))}>Zoom out</button>
                  <button type="button" className="wb-menu-item" onClick={() => (engine?.fit(), setMenu(null))}>Fit to screen</button>
                </>
              )}
              <button type="button" className="wb-menu-item text-red-600" onClick={() => (setConfirmClear(true), setMenu(null))}>Clear this frame…</button>
            </div>
          ) : null}
          <div className="pointer-events-auto flex w-full max-w-[33rem] items-center gap-0.5 rounded-[1.6rem] border border-border bg-background/95 p-1 shadow-xl backdrop-blur">
            {present ? (
              <button
                type="button"
                aria-label="Move the toolbar (double-click to put it back)"
                data-tip="Drag to move"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dockDrag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: dockOffset.x, oy: dockOffset.y };
                }}
                onPointerMove={(event) => {
                  const drag = dockDrag.current;
                  if (!drag || drag.id !== event.pointerId) return;
                  const limitX = window.innerWidth / 2 - 60;
                  setDockOffset({
                    x: Math.max(-limitX, Math.min(limitX, drag.ox + event.clientX - drag.x)),
                    y: Math.max(-(window.innerHeight - 140), Math.min(0, drag.oy + event.clientY - drag.y)),
                  });
                }}
                onPointerUp={() => (dockDrag.current = null)}
                onDoubleClick={() => setDockOffset({ x: 0, y: 0 })}
                className="wb-grip grid h-11 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-full text-muted-foreground active:cursor-grabbing"
              >
                <svg viewBox="0 0 8 16" className="h-4 w-2" fill="currentColor" aria-hidden>
                  {[2, 6, 10, 14].flatMap((y) => [<circle key={`a${y}`} cx="2" cy={y} r="1.2" />, <circle key={`b${y}`} cx="6" cy={y} r="1.2" />])}
                </svg>
              </button>
            ) : null}
            {toolButton("select", "select", "Move")}
            {toolButton("pen", "pen", "Pen")}
            {toolButton("eraser", "eraser", "Eraser")}
            {toolButton("shape", "shapes", "Shapes", () => (setMenu(menu === "shapes" ? null : "shapes"), tool !== "shape" && setTool("shape")))}
            {toolButton("text", "text", "Text")}
            {toolButton("note", "note", "Sticky note")}
            <button type="button" aria-label="Undo" data-tip="Undo · Ctrl Z" disabled={!hist.undo} onClick={() => engine?.undo()} className="wb-btn wb-tool disabled:opacity-30">
              <WbIcon name="undo" />
            </button>
            <button type="button" aria-label="Redo" data-tip="Redo · Ctrl Shift Z" disabled={!hist.redo} onClick={() => engine?.redo()} className="wb-btn wb-tool disabled:opacity-30">
              <WbIcon name="redo" />
            </button>
            <button type="button" aria-label="More" data-tip="More" aria-pressed={menu === "more"} onClick={() => setMenu(menu === "more" ? null : "more")} className={`wb-btn wb-tool ${menu === "more" ? "wb-btn-on" : ""}`}>
              <WbIcon name="more" />
            </button>
            {present ? (
              <button type="button" aria-label="Hide tools" data-tip="Hide tools" onClick={() => (setDock(false), setMenu(null))} className="wb-btn wb-tool !w-9 shrink-0 !flex-none text-muted-foreground">
                <WbIcon name="minimize" className="size-5" />
              </button>
            ) : null}
          </div>
        </div>
  );

  return (
    <div
      ref={rootRef}
      data-zoom={zoom}
      data-frame={frame}
      data-tool={tool}
      data-peers={peers}
      data-status={status}
      className="wb-root fixed inset-0 z-[45] h-dvh touch-manipulation select-none overflow-hidden overscroll-none bg-[#f4f4f5] text-foreground"
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (menu && !target.closest("[data-wb-menu]")) setMenu(null);
      }}
    >
      <canvas ref={attachCanvas} aria-label="Whiteboard" className="absolute inset-0 size-full" />
      {role === "guest" ? <HapticsListener /> : null}

      {/* Header */}
      {present ? null : (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]">
          <div className="pointer-events-auto mx-auto flex h-12 max-w-5xl items-center gap-1.5 px-2 sm:px-4">
            {backHref ? (
              <Link href={backHref} aria-label="Back to boards" className="wb-btn wb-pill !size-10">
                <WbIcon name="back" className="size-5" />
              </Link>
            ) : null}
            {role === "owner" && boardId ? (
              <input
                aria-label="Board name"
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => void renameWhiteboardAction(boardId, title)}
                className="wb-pill h-10 min-w-0 flex-1 rounded-full px-4 text-sm font-semibold tracking-tight outline-none focus:border-foreground sm:max-w-xs sm:flex-none"
              />
            ) : (
              <span className="wb-pill flex h-10 min-w-0 flex-1 items-center rounded-full px-4 text-sm font-semibold tracking-tight sm:max-w-xs sm:flex-none">
                <span className="truncate">{title}</span>
              </span>
            )}
            <span className="hidden flex-1 sm:block" />
            <span className="wb-pill hidden h-10 items-center gap-2 rounded-full px-3.5 text-xs text-muted-foreground sm:flex" role="status">
              <span className={`size-2 rounded-full ${status === "live" ? "bg-green-600" : status === "connecting" ? "bg-amber-500" : "bg-red-500"}`} />
              {status === "live" ? (peers > 0 ? `${peers + 1} here` : "Just you") : status === "connecting" ? "Connecting" : "Offline"}
              {role === "owner" ? <span className="text-faint-foreground">· {saveState === "saving" ? "Saving" : saveState === "error" ? "Not saved" : "Saved"}</span> : null}
            </span>
            {role === "guest" && !following ? (
              <button type="button" onClick={() => (setFollowing(true), engine && live.current.frame !== engine.getFrame() && send({ k: "hello", from: selfId, name }))} className="wb-pill h-10 rounded-full px-3.5 text-xs font-medium">
                Follow host
              </button>
            ) : null}
            <div className="relative" data-wb-menu>
              <button type="button" aria-label="Export" title="Export" onClick={() => setMenu(menu === "export" ? null : "export")} className="wb-btn wb-pill !size-10">
                <WbIcon name="download" className="size-5" />
              </button>
              {menu === "export" ? (
                <div className="wb-menu !fixed right-2 top-[calc(3.25rem+env(safe-area-inset-top))]">
                  <button type="button" className="wb-menu-item" onClick={exportPng}>This frame as image (PNG)</button>
                  <button type="button" className="wb-menu-item" onClick={exportPdf}>All frames as PDF</button>
                  {role === "owner" && boardId && canFile ? (
                    <button type="button" className="wb-menu-item" disabled={filing} onClick={() => void fileToCustomer()}>Save PDF to customer file</button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {role === "owner" && boardId ? (
              <button type="button" aria-label="Meeting notepad" title="Meeting notepad" aria-pressed={notepad} onClick={() => setNotepad((open) => !open)} className={`wb-btn wb-pill !size-10 ${notepad ? "wb-btn-on" : ""}`}>
                <WbIcon name="notepad" className="size-5" />
              </button>
            ) : null}
            {role === "owner" ? (
              <div className="relative" data-wb-menu>
                <button type="button" aria-label="Share" title="Share" onClick={() => setMenu(menu === "share" ? null : "share")} className="wb-btn wb-pill !size-10">
                  <WbIcon name="share" className="size-5" />
                </button>
                {menu === "share" ? (
                  <div className="wb-menu !fixed right-2 top-[calc(3.25rem+env(safe-area-inset-top))] w-[min(92vw,22rem)] p-4">
                    <p className="text-sm font-semibold tracking-tight">Share this board</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Send the link. They open it on any phone or computer and see your board live. No account needed.</p>
                    <div className="mt-3 flex gap-2">
                      <input readOnly value={link} aria-label="Link" onFocus={(event) => event.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-3 py-2 font-mono text-[11px]" />
                      <button type="button" onClick={copyLink} className="press rounded-lg bg-foreground px-3.5 text-sm font-medium text-background">Copy</button>
                    </div>
                    <button type="button" onClick={shareLink} className="press mt-2 w-full rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted">Share…</button>
                    <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-muted p-1 text-xs" role="radiogroup" aria-label="Who can do what">
                      {([["edit", "Can draw"], ["view", "View only"], ["off", "Off"]] as [ShareMode, string][]).map(([key, text]) => (
                        <button key={key} type="button" role="radio" aria-checked={shareMode === key} onClick={() => void changeShare(key)} className={`rounded-full py-2 transition-colors ${shareMode === key ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>{text}</button>
                      ))}
                    </div>
                    <button type="button" onClick={newLink} className="mt-3 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Make a new link (the old one stops working)</button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button type="button" aria-label="Present" title="Present full screen" onClick={startPresent} className="press inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-3.5 text-sm font-medium text-background">
              <WbIcon name="present" className="size-5" />
              <span className="hidden sm:inline">Present</span>
            </button>
          </div>
          {/* The four frames */}
          <nav aria-label="Frames" className="pointer-events-auto mx-auto mt-1.5 flex w-fit max-w-[calc(100%-1rem)] items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-sm backdrop-blur">
            {frames.map((entry, index) => {
              const active = index === frame;
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-current={active ? "step" : undefined}
                  aria-label={`Frame ${index + 1}: ${entry.title}`}
                  onClick={() => goFrame(index)}
                  className={`wb-frame press ${active ? "wb-frame-on" : ""}`}
                >
                  <span className="grid size-7 shrink-0 place-items-center text-[13px] font-semibold tabular-nums">{index + 1}</span>
                  <span className="wb-frame-label">{entry.title}</span>
                </button>
              );
            })}
          </nav>
        </header>
      )}

      {/* Toolbar (also in presentation mode, when the tools are expanded) */}
      {toolsVisible ? toolbar : null}
      {present && !dock && !viewOnly ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(0.9rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setDock(true)} aria-label="Show tools" className="wb-pill wb-lift wb-rise pointer-events-auto flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium">
            <WbIcon name="pen" className="size-4" />
            Tools
            <WbIcon name="expand" className="size-4 text-muted-foreground" />
          </button>
        </div>
      ) : null}

      {/* Zoom (desktop) */}
      {drawable || viewOnly || present ? (
        <div className="absolute bottom-4 right-4 z-30 hidden items-center gap-0.5 rounded-full border border-border bg-background/90 p-1 text-xs shadow-sm backdrop-blur md:flex">
          <button type="button" aria-label="Zoom out" className="wb-btn !size-8" onClick={() => engine?.zoomBy(0.8)}><WbIcon name="minus" className="size-4" /></button>
          <span className="w-10 text-center tabular-nums text-muted-foreground">{zoom}%</span>
          <button type="button" aria-label="Zoom in" className="wb-btn !size-8" onClick={() => engine?.zoomBy(1.25)}><WbIcon name="plus" className="size-4" /></button>
          <button type="button" aria-label="Fit to screen" className="wb-btn !size-8" onClick={() => engine?.fit()}><WbIcon name="fit" className="size-4" /></button>
        </div>
      ) : null}

      {/* Presenting */}
      {present ? (
        <>
          <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex items-center gap-2">
            <button type="button" onClick={endPresent} className="wb-pill wb-lift flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium">
              <WbIcon name="stop" className="size-4" />
              <span>Stop presenting</span>
            </button>
            {backHref ? (
              <button
                type="button"
                aria-label="Close the board"
                data-tip-below="Close the board"
                onClick={() => {
                  endPresent();
                  router.push(backHref);
                }}
                className="wb-pill wb-lift grid size-11 place-items-center rounded-full"
              >
                <WbIcon name="close" className="size-5" />
              </button>
            ) : null}
          </div>
          <button type="button" aria-label="Previous frame" disabled={frame === 0} onClick={() => goFrame(frame - 1, false)} className="wb-pill absolute left-3 top-1/2 z-30 hidden size-12 -translate-y-1/2 place-items-center rounded-full disabled:opacity-0 sm:grid">
            <WbIcon name="prev" />
          </button>
          <button type="button" aria-label="Next frame" disabled={frame === frameCount - 1} onClick={() => goFrame(frame + 1, false)} className="wb-pill absolute right-3 top-1/2 z-30 hidden size-12 -translate-y-1/2 place-items-center rounded-full disabled:opacity-0 sm:grid">
            <WbIcon name="next" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 shadow-sm backdrop-blur">
              {frames.map((entry, index) => (
                <button key={entry.id} type="button" aria-label={`Go to frame ${index + 1}: ${entry.title}`} onClick={() => goFrame(index, false)} className={`h-2 rounded-full transition-all duration-300 ${index === frame ? "w-7 bg-foreground" : "w-2 bg-foreground/25"}`} />
              ))}
              <span className="ml-2 text-xs font-medium tabular-nums text-muted-foreground">{frame + 1} / {frameCount}</span>
            </div>
          </div>
        </>
      ) : null}

      {notepad && role === "owner" && boardId ? <Notepad boardId={boardId} meeting={meeting} onClose={() => setNotepad(false)} onMeeting={setMeeting} /> : null}

      {confirmClear ? (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/25 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Clear this frame">
          <div className="wb-rise w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-2xl">
            <p className="text-base font-semibold tracking-tight">Clear this frame?</p>
            <p className="mt-1 text-sm text-muted-foreground">Everything you and others drew here is removed. The frame&apos;s heading stays. You can undo this.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => (engine?.clearFrame(), setConfirmClear(false))} className="press flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white">Clear</button>
              <button type="button" onClick={() => setConfirmClear(false)} className="press flex-1 rounded-xl border border-border py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div role="status" className="wb-rise pointer-events-none absolute left-1/2 top-[calc(7rem+env(safe-area-inset-top))] z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

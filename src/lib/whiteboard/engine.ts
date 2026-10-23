import { clampScale, hits, moved, pinch, toWorld, zoomAt, type Viewport } from "./geometry";
import { newId } from "./ids";
import { applyOp, inverseOf, ordered } from "./ops";
import { BACKDROP, drawElement, drawFrame, drawGrid, drawPage } from "./render";
import { SLIDE, type BoardData, type El, type NoteEl, type Op, type ShapeEl, type ShapeKind, type StrokeEl, type TextEl } from "./types";

export type Tool = "select" | "pen" | "eraser" | "shape" | "text" | "note";
export type Mode = "edit" | "view" | "present";
export type Style = { color: string; width: number; shape: ShapeKind; noteColor: string; textSize: number };
export type EditRequest = { id: string; kind: "text" | "note"; isNew: boolean };
export type RemoteCursor = { name: string; x: number; y: number; f: number; at: number };

export type Callbacks = {
  /** Every change made on this device, to send to the others and to save. */
  onOps(ops: Op[]): void;
  onEdit(request: EditRequest | null): void;
  onView(): void;
  onHistory(): void;
  onCursor(x: number, y: number, show: boolean): void;
  /** A horizontal swipe in presentation mode. */
  onSwipe(direction: -1 | 1): void;
};

type Pt = { x: number; y: number };
type Entry = { fwd: Op[]; inv: Op[] };
type Action =
  | { t: "stroke"; id: string; last: Pt }
  | { t: "shape"; id: string; x0: number; y0: number }
  | { t: "erase"; removed: Map<string, El>; last: Pt }
  | { t: "move"; id: string; orig: El; start: Pt; startScreen: Pt; dragged: boolean }
  | { t: "pan"; last: Pt; vx: number; vy: number; lastT: number; startScreen: Pt; startT: number; swiped: boolean }
  | { t: "create"; kind: "text" | "note"; at: Pt; startScreen: Pt; moved: boolean };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const TAP_SLOP = 6;

/**
 * The drawing surface. It owns the board, the camera (pan and pinch zoom), the pointer handling and the undo history, and draws
 * to one canvas. The React layer only holds the toolbar and sends it commands.
 *
 * Pointer mapping is exact: every event is converted with the canvas's own bounding box at the moment it happens, then through
 * the inverse of the camera, so a finger or cursor and the ink under it are always the same point at any zoom, pan or pixel density.
 */
export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: BoardData;
  private cb: Callbacks;
  private frame = 0;
  private views: Viewport[] = [];
  private view: Viewport = { x: 0, y: 0, s: 1 };
  private width = 0;
  private height = 0;
  private dpr = 1;
  private autoFit = true;
  private insets = { top: 0, bottom: 0 };
  private tool: Tool = "pen";
  private mode: Mode = "edit";
  private style: Style = { color: "#111827", width: 6, shape: "rect", noteColor: "#fde68a", textSize: 36 };
  private selectedId: string | null = null;
  private editingId: string | null = null;
  private pending = new Map<string, El>();
  private pointers = new Map<number, Pt>();
  private gesture: { a: number; b: number; start: Viewport; a0: Pt; b0: Pt } | null = null;
  private suppress = false;
  private action: Action | null = null;
  private spaceDown = false;
  private undoStack: Entry[] = [];
  private redoStack: Entry[] = [];
  private cursors = new Map<string, RemoteCursor>();
  private hover: Pt | null = null;
  private raf = 0;
  private anim: { from: Viewport; to: Viewport; start: number; ms: number } | null = null;
  private inertia: { vx: number; vy: number } | null = null;
  private observer: ResizeObserver;
  private destroyed = false;
  private removers: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, data: BoardData, callbacks: Callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.data = data;
    this.cb = callbacks;
    canvas.style.touchAction = "none";
    canvas.style.userSelect = "none";
    const vendor = canvas.style as CSSStyleDeclaration & { webkitUserSelect?: string; webkitTapHighlightColor?: string };
    vendor.webkitUserSelect = "none";
    vendor.webkitTapHighlightColor = "transparent";
    const listen = <K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) => {
      canvas.addEventListener(type, handler as EventListener, options);
      this.removers.push(() => canvas.removeEventListener(type, handler as EventListener, options));
    };
    listen("pointerdown", (event) => this.down(event));
    listen("pointermove", (event) => this.move(event));
    listen("pointerup", (event) => this.up(event));
    listen("pointercancel", (event) => this.cancel(event));
    listen("pointerleave", () => {
      this.hover = null;
      this.cb.onCursor(0, 0, false);
      this.requestRender();
    });
    listen("wheel", (event) => this.wheel(event), { passive: false });
    listen("contextmenu", (event) => event.preventDefault());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement)) this.spaceDown = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") this.spaceDown = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    this.removers.push(() => window.removeEventListener("keydown", onKeyDown), () => window.removeEventListener("keyup", onKeyUp));
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }

  /* ── Public commands ──────────────────────────────────────────────────────────────────── */

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    this.removers.forEach((remove) => remove());
  }

  getData() {
    return this.data;
  }
  getFrame() {
    return this.frame;
  }
  getView() {
    return this.view;
  }
  canUndo() {
    return this.undoStack.length > 0;
  }
  canRedo() {
    return this.redoStack.length > 0;
  }
  worldToScreen(x: number, y: number) {
    return { x: x * this.view.s + this.view.x, y: y * this.view.s + this.view.y };
  }

  setTool(tool: Tool) {
    this.finishText();
    this.tool = tool;
    this.selectedId = null;
    this.canvas.style.cursor = tool === "pen" || tool === "shape" ? "crosshair" : tool === "text" ? "text" : tool === "eraser" ? "none" : "default";
    this.requestRender();
  }
  setStyle(patch: Partial<Style>) {
    this.style = { ...this.style, ...patch };
  }
  setMode(mode: Mode) {
    this.mode = mode;
    if (mode !== "edit") this.finishText();
    if (mode === "present") this.fit(false);
    this.requestRender();
  }
  replaceData(data: BoardData) {
    this.data = data;
    this.undoStack = [];
    this.redoStack = [];
    this.cb.onHistory();
    this.requestRender();
  }

  setFrame(index: number, direction: -1 | 0 | 1 = 0) {
    if (index < 0 || index >= this.data.frames.length || index === this.frame) return;
    this.finishText();
    this.cancelAction();
    this.views[this.frame] = this.view;
    this.frame = index;
    this.selectedId = null;
    this.view = this.views[index] ?? this.defaultView();
    this.anim = null;
    this.cb.onView();
    this.requestRender();
    if (direction !== 0 && typeof this.canvas.animate === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.canvas.animate(
        [
          { opacity: 0, transform: `translateX(${direction * 36}px)` },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  }

  fit(animate = true) {
    const target = this.defaultView();
    this.autoFit = true;
    if (animate) this.animateTo(target);
    else {
      this.view = target;
      this.cb.onView();
      this.requestRender();
    }
  }
  zoomBy(factor: number) {
    this.autoFit = false;
    const target = zoomAt(this.view, this.width / 2, this.height / 2, factor);
    this.animateTo(target, 220);
  }

  /** Changes arriving from other people. */
  applyRemote(ops: Op[]) {
    let changed = false;
    for (const op of ops) {
      if (op.k === "del" && this.editingId && op.ids.includes(this.editingId)) this.finishText();
      if (applyOp(this.data, op)) changed = true;
    }
    if (changed) this.requestRender();
  }
  setCursors(cursors: Map<string, RemoteCursor>) {
    this.cursors = cursors;
    this.requestRender();
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;
    this.apply(entry.inv);
    this.redoStack.push(entry);
    this.cb.onHistory();
  }
  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return;
    this.apply(entry.fwd);
    this.undoStack.push(entry);
    this.cb.onHistory();
  }
  clearFrame() {
    const op: Op = { k: "clr", f: this.frame };
    const inv = inverseOf(this.data, op);
    if (inv.length === 0) return;
    this.commit({ fwd: [op], inv });
  }
  deleteSelected() {
    if (!this.selectedId) return;
    const op: Op = { k: "del", f: this.frame, ids: [this.selectedId] };
    const inv = inverseOf(this.data, op);
    this.selectedId = null;
    this.commit({ fwd: [op], inv });
  }

  /** The element being edited, with where it sits on screen, for the text box overlay. */
  getEditTarget(id: string): { el: TextEl | NoteEl; screen: { x: number; y: number; w: number; h: number }; scale: number } | null {
    const el = (this.pending.get(id) ?? this.data.frames[this.frame].els[id]) as El | undefined;
    if (!el || (el.t !== "text" && el.t !== "note")) return null;
    const p = this.worldToScreen(el.x, el.y);
    const w = el.t === "note" ? el.w : Math.max(160, el.s.length * el.size * 0.6 + 40);
    const h = el.t === "note" ? el.h : Math.max(el.size * 1.4, el.s.split("\n").length * el.size * 1.28 + 8);
    return { el, screen: { x: p.x, y: p.y, w: w * this.view.s, h: h * this.view.s }, scale: this.view.s };
  }

  commitText(id: string, text: string) {
    const frame = this.data.frames[this.frame];
    const pending = this.pending.get(id);
    this.pending.delete(id);
    if (this.editingId === id) this.editingId = null;
    this.cb.onEdit(null);
    if (pending && pending.t === "text") {
      if (!text.trim()) return this.requestRender();
      this.commit({ fwd: [{ k: "put", f: this.frame, el: { ...pending, s: text } }], inv: [{ k: "del", f: this.frame, ids: [id] }] });
      return;
    }
    const existing = frame.els[id];
    if (!existing || (existing.t !== "text" && existing.t !== "note")) return this.requestRender();
    if (existing.s === text) return this.requestRender();
    if (existing.t === "text" && !text.trim()) {
      this.commit({ fwd: [{ k: "del", f: this.frame, ids: [id] }], inv: inverseOf(this.data, { k: "del", f: this.frame, ids: [id] }) });
      return;
    }
    const next = { ...existing, s: text } as El;
    this.commit({ fwd: [{ k: "put", f: this.frame, el: next }], inv: inverseOf(this.data, { k: "put", f: this.frame, el: next }) });
  }

  /* ── Internals ────────────────────────────────────────────────────────────────────────── */

  private finishText() {
    if (this.editingId) {
      this.cb.onEdit(null);
      this.editingId = null;
    }
    this.pending.clear();
  }

  private commit(entry: Entry) {
    this.apply(entry.fwd);
    this.undoStack.push(entry);
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
    this.cb.onHistory();
  }
  private apply(ops: Op[]) {
    for (const op of ops) applyOp(this.data, op);
    this.cb.onOps(ops);
    this.requestRender();
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (rect.width === 0 || rect.height === 0) return;
    this.width = rect.width;
    this.height = rect.height;
    this.dpr = dpr;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    if (this.autoFit || this.mode === "present") this.view = this.defaultView();
    this.cb.onView();
    this.requestRender();
  }

  private point(event: PointerEvent): Pt {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  private world(p: Pt) {
    return toWorld(this.view, p.x, p.y);
  }

  private animateTo(target: Viewport, ms = 380) {
    this.inertia = null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.view = target;
      this.cb.onView();
      this.requestRender();
      return;
    }
    this.anim = { from: this.view, to: target, start: performance.now(), ms };
    this.requestRender();
  }

  /**
   * The starting camera: the whole page, centred in the space left between the header and the toolbar. On a portrait phone the
   * whole 16:9 page would be tiny, so it is shown larger (readable text) starting from its left edge; pan to see the rest.
   */
  private defaultView(): Viewport {
    const pad = this.mode === "present" ? 0 : 20;
    const availW = Math.max(this.width - pad * 2, 1);
    const availH = Math.max(this.height - this.insets.top - this.insets.bottom - pad * 2, 1);
    const fitW = availW / SLIDE.w;
    const fitH = availH / SLIDE.h;
    let s = Math.min(fitW, fitH);
    if (this.width < this.height * 0.9) s = Math.min(fitH, Math.max(fitW, 0.45));
    s = clampScale(s);
    const x = SLIDE.w * s <= availW ? (this.width - SLIDE.w * s) / 2 : pad;
    const y = this.insets.top + pad + (availH - SLIDE.h * s) / 2;
    return { s, x, y };
  }

  setInsets(top: number, bottom: number) {
    this.insets = { top, bottom };
    if (this.autoFit && this.width > 0) {
      this.view = this.defaultView();
      this.cb.onView();
      this.requestRender();
    }
  }

  private userMovedCamera() {
    this.autoFit = false;
    this.anim = null;
  }

  private cancelAction() {
    const action = this.action;
    this.action = null;
    if (!action) return;
    if (action.t === "stroke" || action.t === "shape") this.apply([{ k: "del", f: this.frame, ids: [action.id] }]);
    if (action.t === "erase") {
      const restore: Op[] = [...action.removed.values()].map((el) => ({ k: "put", f: this.frame, el }));
      if (restore.length) this.apply(restore);
    }
    if (action.t === "move") this.apply([{ k: "put", f: this.frame, el: action.orig }]);
  }

  private topHit(p: Pt): El | null {
    const w = this.world(p);
    const slop = 8 / this.view.s;
    const els = ordered(this.data.frames[this.frame]);
    for (let i = els.length - 1; i >= 0; i -= 1) if (hits(els[i], w.x, w.y, slop)) return els[i];
    return null;
  }

  private canDraw() {
    return this.mode === "edit";
  }

  private down(event: PointerEvent) {
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    const p = this.point(event);
    this.pointers.set(event.pointerId, p);

    if (this.pointers.size === 2 && this.mode !== "present") {
      // A second finger: whatever the first one started is not a drawing; switch to pinch and pan.
      this.cancelAction();
      const [aId, bId] = [...this.pointers.keys()];
      this.gesture = { a: aId, b: bId, start: this.view, a0: this.pointers.get(aId) as Pt, b0: this.pointers.get(bId) as Pt };
      this.suppress = true;
      this.inertia = null;
      return;
    }
    if (this.pointers.size > 1 || this.suppress) return;
    this.inertia = null;
    this.anim = null;

    const panning = event.button === 1 || (event.pointerType === "mouse" && this.spaceDown);
    const w = this.world(p);
    if (this.mode === "present") {
      this.action = { t: "pan", last: p, vx: 0, vy: 0, lastT: performance.now(), startScreen: p, startT: performance.now(), swiped: false };
      return;
    }
    if (panning || this.mode === "view") {
      this.action = { t: "pan", last: p, vx: 0, vy: 0, lastT: performance.now(), startScreen: p, startT: performance.now(), swiped: false };
      return;
    }
    if (event.button !== 0 && event.pointerType === "mouse") return;
    this.finishText();

    switch (this.tool) {
      case "pen": {
        const el: StrokeEl = { id: newId(), ts: Date.now(), t: "stroke", pts: [w.x, w.y], c: this.style.color, w: this.style.width };
        this.apply([{ k: "put", f: this.frame, el }]);
        this.action = { t: "stroke", id: el.id, last: p };
        break;
      }
      case "shape": {
        const el: ShapeEl = { id: newId(), ts: Date.now(), t: "shape", k: this.style.shape, x1: w.x, y1: w.y, x2: w.x, y2: w.y, c: this.style.color, w: Math.max(3, Math.min(this.style.width, 8)) };
        this.apply([{ k: "put", f: this.frame, el }]);
        this.action = { t: "shape", id: el.id, x0: w.x, y0: w.y };
        break;
      }
      case "eraser": {
        this.action = { t: "erase", removed: new Map(), last: p };
        this.eraseAt(p);
        break;
      }
      case "text":
      case "note":
        this.action = { t: "create", kind: this.tool, at: w, startScreen: p, moved: false };
        break;
      case "select": {
        const hit = this.topHit(p);
        if (hit) {
          this.selectedId = hit.id;
          this.action = { t: "move", id: hit.id, orig: JSON.parse(JSON.stringify(hit)) as El, start: w, startScreen: p, dragged: false };
        } else {
          this.selectedId = null;
          this.action = { t: "pan", last: p, vx: 0, vy: 0, lastT: performance.now(), startScreen: p, startT: performance.now(), swiped: false };
        }
        this.requestRender();
        break;
      }
    }
  }

  private move(event: PointerEvent) {
    const p = this.point(event);
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, p);
    if (event.pointerType === "mouse" || this.action) {
      this.hover = p;
      const w = this.world(p);
      this.cb.onCursor(w.x, w.y, true);
    }

    if (this.gesture) {
      const a = this.pointers.get(this.gesture.a);
      const b = this.pointers.get(this.gesture.b);
      if (a && b) {
        this.userMovedCamera();
        this.view = pinch(this.gesture.start, this.gesture.a0, this.gesture.b0, a, b);
        this.cb.onView();
        this.requestRender();
      }
      return;
    }
    if (this.pointers.size > 1 || this.suppress) return;
    if (this.tool === "eraser" && !this.action) this.requestRender();
    const action = this.action;
    if (!action) return;

    const samples = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
    const points: Pt[] = samples.length > 1 ? samples.map((sample) => this.point(sample)) : [p];

    switch (action.t) {
      case "stroke": {
        const fresh: number[] = [];
        for (const sample of points) {
          if (Math.hypot(sample.x - action.last.x, sample.y - action.last.y) < 1.2) continue;
          const w = this.world(sample);
          fresh.push(w.x, w.y);
          action.last = sample;
        }
        if (fresh.length) this.apply([{ k: "ext", f: this.frame, id: action.id, pts: fresh }]);
        break;
      }
      case "shape": {
        const w = this.world(p);
        const el = this.data.frames[this.frame].els[action.id] as ShapeEl | undefined;
        if (el) this.apply([{ k: "put", f: this.frame, el: { ...el, x2: w.x, y2: w.y } }]);
        break;
      }
      case "erase": {
        for (const sample of points) this.eraseLine(action.last, sample);
        action.last = p;
        break;
      }
      case "move": {
        if (!action.dragged && Math.hypot(p.x - action.startScreen.x, p.y - action.startScreen.y) < TAP_SLOP) break;
        action.dragged = true;
        const w = this.world(p);
        this.apply([{ k: "put", f: this.frame, el: moved(action.orig, w.x - action.start.x, w.y - action.start.y) }]);
        break;
      }
      case "pan": {
        const dx = p.x - action.last.x;
        const dy = p.y - action.last.y;
        const now = performance.now();
        if (this.mode === "present") {
          if (!action.swiped && now - action.startT < 700 && Math.abs(p.x - action.startScreen.x) > 70 && Math.abs(p.x - action.startScreen.x) > Math.abs(p.y - action.startScreen.y) * 1.5) {
            action.swiped = true;
            this.cb.onSwipe(p.x < action.startScreen.x ? 1 : -1);
          }
          break;
        }
        this.userMovedCamera();
        this.view = { ...this.view, x: this.view.x + dx, y: this.view.y + dy };
        const dt = Math.max(now - action.lastT, 1);
        action.vx = action.vx * 0.6 + (dx / dt) * 0.4;
        action.vy = action.vy * 0.6 + (dy / dt) * 0.4;
        action.last = p;
        action.lastT = now;
        this.cb.onView();
        this.requestRender();
        break;
      }
      case "create": {
        if (Math.hypot(p.x - action.startScreen.x, p.y - action.startScreen.y) > TAP_SLOP * 2) action.moved = true;
        break;
      }
    }
  }

  private eraseLine(from: Pt, to: Pt) {
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 6));
    for (let i = 1; i <= steps; i += 1) this.eraseAt({ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps });
  }
  private eraseAt(p: Pt) {
    const action = this.action;
    if (!action || action.t !== "erase") return;
    const w = this.world(p);
    const slop = 12 / this.view.s;
    const hitIds: string[] = [];
    for (const el of Object.values(this.data.frames[this.frame].els)) {
      if (hits(el, w.x, w.y, slop)) {
        hitIds.push(el.id);
        action.removed.set(el.id, JSON.parse(JSON.stringify(el)) as El);
      }
    }
    if (hitIds.length) this.apply([{ k: "del", f: this.frame, ids: hitIds }]);
  }

  private up(event: PointerEvent) {
    const p = this.point(event);
    this.pointers.delete(event.pointerId);
    if (this.gesture && this.pointers.size < 2) this.gesture = null;
    if (this.pointers.size === 0) {
      const wasSuppressed = this.suppress;
      this.suppress = false;
      if (wasSuppressed) return;
    } else {
      return;
    }
    const action = this.action;
    this.action = null;
    if (!action) return;
    if (event.pointerType !== "mouse") this.cb.onCursor(0, 0, false);

    switch (action.t) {
      case "stroke": {
        const el = this.data.frames[this.frame].els[action.id];
        if (el) {
          // A final full copy, so anyone who missed a piece along the way ends up with the exact stroke.
          this.cb.onOps([{ k: "put", f: this.frame, el: JSON.parse(JSON.stringify(el)) as El }]);
          this.undoStack.push({ fwd: [{ k: "put", f: this.frame, el }], inv: [{ k: "del", f: this.frame, ids: [action.id] }] });
          this.redoStack = [];
          this.cb.onHistory();
        }
        break;
      }
      case "shape": {
        const el = this.data.frames[this.frame].els[action.id] as ShapeEl | undefined;
        if (!el) break;
        if (Math.hypot(el.x2 - el.x1, el.y2 - el.y1) * this.view.s < 8) {
          this.apply([{ k: "del", f: this.frame, ids: [action.id] }]);
          break;
        }
        this.cb.onOps([{ k: "put", f: this.frame, el: JSON.parse(JSON.stringify(el)) as El }]);
        this.undoStack.push({ fwd: [{ k: "put", f: this.frame, el }], inv: [{ k: "del", f: this.frame, ids: [action.id] }] });
        this.redoStack = [];
        this.cb.onHistory();
        break;
      }
      case "erase": {
        if (action.removed.size) {
          const ids = [...action.removed.keys()];
          this.undoStack.push({ fwd: [{ k: "del", f: this.frame, ids }], inv: [...action.removed.values()].map((el) => ({ k: "put", f: this.frame, el })) });
          this.redoStack = [];
          this.cb.onHistory();
        }
        break;
      }
      case "move": {
        const current = this.data.frames[this.frame].els[action.id];
        if (action.dragged && current) {
          this.undoStack.push({ fwd: [{ k: "put", f: this.frame, el: JSON.parse(JSON.stringify(current)) as El }], inv: [{ k: "put", f: this.frame, el: action.orig }] });
          this.redoStack = [];
          this.cb.onHistory();
        } else if (!action.dragged && (action.orig.t === "text" || action.orig.t === "note")) {
          this.beginEdit(action.id, action.orig.t, false);
        }
        break;
      }
      case "pan": {
        if (this.mode === "present") break;
        const speed = Math.hypot(action.vx, action.vy);
        if (speed > 0.05 && performance.now() - action.lastT < 80) {
          this.inertia = { vx: action.vx, vy: action.vy };
          this.requestRender();
        }
        break;
      }
      case "create": {
        if (action.moved) break;
        const w = action.at;
        if (action.kind === "text") {
          const el: TextEl = { id: newId(), ts: Date.now(), t: "text", x: w.x, y: w.y - this.style.textSize / 2, s: "", size: this.style.textSize, c: this.style.color };
          this.pending.set(el.id, el);
          this.beginEdit(el.id, "text", true);
        } else {
          const el: NoteEl = { id: newId(), ts: Date.now(), t: "note", x: w.x - 120, y: w.y - 100, w: 240, h: 200, s: "", c: this.style.noteColor };
          this.commit({ fwd: [{ k: "put", f: this.frame, el }], inv: [{ k: "del", f: this.frame, ids: [el.id] }] });
          this.beginEdit(el.id, "note", true);
        }
        break;
      }
    }
    void p;
    this.requestRender();
  }

  private cancel(event: PointerEvent) {
    this.pointers.delete(event.pointerId);
    if (this.gesture && this.pointers.size < 2) this.gesture = null;
    if (this.pointers.size === 0) {
      this.suppress = false;
      this.cancelAction();
    }
  }

  private beginEdit(id: string, kind: "text" | "note", isNew: boolean) {
    this.editingId = id;
    this.selectedId = null;
    this.cb.onEdit({ id, kind, isNew });
    this.requestRender();
  }

  private wheel(event: WheelEvent) {
    event.preventDefault();
    if (this.mode === "present") return;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.userMovedCamera();
    this.inertia = null;
    if (event.ctrlKey || event.metaKey) {
      const unit = event.deltaMode === 1 ? 16 : 1;
      this.view = zoomAt(this.view, x, y, Math.exp((-event.deltaY * unit) * 0.01));
    } else {
      const unit = event.deltaMode === 1 ? 16 : 1;
      this.view = { ...this.view, x: this.view.x - event.deltaX * unit, y: this.view.y - event.deltaY * unit };
    }
    this.cb.onView();
    this.requestRender();
  }

  /* ── Drawing ──────────────────────────────────────────────────────────────────────────── */

  requestRender() {
    if (this.raf || this.destroyed) return;
    this.raf = requestAnimationFrame((time) => {
      this.raf = 0;
      this.render(time);
    });
  }

  private render(time: number) {
    if (this.destroyed || this.width === 0) return;
    let again = false;
    if (this.anim) {
      const t = Math.min(1, (time - this.anim.start) / this.anim.ms);
      const k = easeOut(t);
      const { from, to } = this.anim;
      this.view = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, s: clampScale(from.s + (to.s - from.s) * k) };
      if (t >= 1) this.anim = null;
      else again = true;
      this.cb.onView();
    }
    if (this.inertia) {
      const { vx, vy } = this.inertia;
      this.view = { ...this.view, x: this.view.x + vx * 16, y: this.view.y + vy * 16 };
      this.inertia = { vx: vx * 0.93, vy: vy * 0.93 };
      if (Math.hypot(vx, vy) < 0.02) this.inertia = null;
      else again = true;
      this.cb.onView();
    }

    const ctx = this.ctx;
    const { view, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = this.mode === "present" ? "#ffffff" : BACKDROP;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.setTransform(dpr * view.s, 0, 0, dpr * view.s, dpr * view.x, dpr * view.y);
    if (this.mode !== "present") {
      drawGrid(ctx, view, this.width, this.height);
      drawPage(ctx);
    }
    const frame = this.data.frames[this.frame];
    if (this.editingId) {
      for (const el of ordered(frame)) if (el.id !== this.editingId) drawElement(ctx, el);
    } else {
      drawFrame(ctx, frame, this.selectedId, view.s);
    }

    // Screen-space overlays: other people's pointers and the eraser ring.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nowMs = Date.now();
    for (const [id, cursor] of this.cursors) {
      if (cursor.f !== this.frame || nowMs - cursor.at > 5000) continue;
      const sx = cursor.x * view.s + view.x;
      const sy = cursor.y * view.s + view.y;
      const hue = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
      ctx.fillStyle = `hsl(${hue} 70% 45%)`;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
      const label = cursor.name;
      const width = ctx.measureText(label).width + 14;
      ctx.beginPath();
      ctx.roundRect(sx + 10, sy + 6, width, 22, 11);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(label, sx + 17, sy + 17);
    }
    if (this.tool === "eraser" && this.hover && this.mode === "edit") {
      ctx.strokeStyle = "rgba(17,24,39,0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.hover.x, this.hover.y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (again) this.requestRender();
  }
}

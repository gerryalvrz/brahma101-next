"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";
import { localQuickFix } from "@/lib/hydra/quick-fix";
import styles from "./HydraAssistChat.module.css";

export type AssistMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  suggestedCode?: string;
  source?: "local" | "venice";
};

type Props = {
  code: string;
  error: string | null;
  audioOn: boolean;
  uiVisible: boolean;
  onApply: (code: string) => void;
};

type Size = { w: number; h: number };
type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const MIN_W = 240;
const MIN_H = 220;
const MAX_W = 520;
const MAX_H = 640;

const RESIZE_EDGES: ResizeEdge[] = [
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
];

const RESIZE_STYLE: Record<ResizeEdge, string> = {
  n: "resizeN",
  s: "resizeS",
  e: "resizeE",
  w: "resizeW",
  ne: "resizeNE",
  nw: "resizeNW",
  se: "resizeSE",
  sw: "resizeSW",
};

export default function HydraAssistChat({
  code,
  error,
  audioOn,
  uiVisible,
  onApply,
}: Props) {
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState<Size>({ w: 300, h: 360 });
  const [placed, setPlaced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragMode = useRef<"move" | "resize" | null>(null);
  const resizeEdge = useRef<ResizeEdge>("se");
  const resizeStart = useRef({
    x: 0,
    y: 0,
    w: 300,
    h: 360,
    left: 24,
    top: 24,
  });
  const [messages, setMessages] = useState<AssistMessage[]>([
    {
      id: "welcome",
      role: "system",
      content: "brahma101 · your helper. welcome to hydra.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = 300;
    const h = 360;
    setSize({ w, h });
    setPos({
      x: Math.max(12, window.innerWidth - w - 20),
      y: Math.max(12, window.innerHeight - h - 20),
    });
    setPlaced(true);
  }, []);

  useEffect(() => {
    if (!uiVisible) setMinimized(true);
  }, [uiVisible]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || minimized) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, minimized]);

  function onMovePointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    dragMode.current = "move";
    setDragging(true);
    el.setPointerCapture(e.pointerId);
  }

  function onResizePointerDown(
    edge: ResizeEdge,
    e: PointerEvent<HTMLDivElement>
  ) {
    e.stopPropagation();
    e.preventDefault();
    const el = panelRef.current;
    if (!el) return;
    dragMode.current = "resize";
    resizeEdge.current = edge;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.w,
      h: size.h,
      left: pos.x,
      top: pos.y,
    };
    setResizing(true);
    el.setPointerCapture(e.pointerId);
  }

  function onPanelPointerMove(e: PointerEvent<HTMLElement>) {
    if (!dragMode.current) return;
    if (dragMode.current === "move") {
      const x = Math.min(
        Math.max(0, e.clientX - dragOffset.current.x),
        Math.max(0, window.innerWidth - 80)
      );
      const y = Math.min(
        Math.max(0, e.clientY - dragOffset.current.y),
        Math.max(0, window.innerHeight - 40)
      );
      setPos({ x, y });
      return;
    }
    if (dragMode.current === "resize") {
      const edge = resizeEdge.current;
      const start = resizeStart.current;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;

      let nextW = start.w;
      let nextH = start.h;
      let nextX = start.left;
      let nextY = start.top;

      if (edge.includes("e")) {
        nextW = Math.min(MAX_W, Math.max(MIN_W, start.w + dx));
      }
      if (edge.includes("s")) {
        nextH = Math.min(MAX_H, Math.max(MIN_H, start.h + dy));
      }
      if (edge.includes("w")) {
        nextW = Math.min(MAX_W, Math.max(MIN_W, start.w - dx));
        nextX = start.left + (start.w - nextW);
      }
      if (edge.includes("n")) {
        nextH = Math.min(MAX_H, Math.max(MIN_H, start.h - dy));
        nextY = start.top + (start.h - nextH);
      }

      setSize({ w: nextW, h: nextH });
      setPos({ x: Math.max(0, nextX), y: Math.max(0, nextY) });
    }
  }

  function onPanelPointerUp(e: PointerEvent<HTMLElement>) {
    if (!dragMode.current) return;
    dragMode.current = null;
    setDragging(false);
    setResizing(false);
    try {
      panelRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  async function askVenice(message: string) {
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-6)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const res = await fetch("/api/hydra/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        code,
        error,
        history,
      }),
    });

    const data = (await res.json()) as {
      reply?: string;
      suggestedCode?: string;
      error?: string;
      detail?: string;
    };

    if (!res.ok) {
      throw new Error(
        [data.error, data.detail].filter(Boolean).join(" — ") ||
          `Assist failed (${res.status})`
      );
    }

    return {
      reply: data.reply ?? "",
      suggestedCode: data.suggestedCode,
    };
  }

  async function submit(question: string, mode: "ask" | "fix") {
    const q = question.trim();
    if (!q || busy) return;

    setBusy(true);
    setInput("");
    setMinimized(false);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: q },
    ]);

    try {
      const local = localQuickFix({ code, error, audioOn });
      const hasLocal = Boolean(local.fixedCode) || local.tips.length > 0;

      if (hasLocal && (mode === "fix" || Boolean(local.fixedCode))) {
        const tipText = local.tips.map((t) => `• ${t}`).join("\n");
        const content = local.fixedCode
          ? `${tipText ? `${tipText}\n\n` : ""}Suggested sketch:\n\`\`\`js\n${local.fixedCode}\n\`\`\``
          : tipText;

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content,
            suggestedCode: local.fixedCode,
            source: "local",
          },
        ]);

        if (local.fixedCode) return;
        if (mode === "ask") return;
      }

      const { reply, suggestedCode } = await askVenice(q);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: reply || "(empty reply)",
          suggestedCode,
          source: "venice",
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Assist failed";
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: `Could not reach Venice: ${msg}`,
          source: "venice",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(input, "ask");
  }

  function onFix() {
    void submit(
      error
        ? `Fix this Hydra sketch. Runtime error: ${error}`
        : "Fix or improve this Hydra sketch so it runs and shows something on screen.",
      "fix"
    );
  }

  function openHelper() {
    setMinimized(false);
    // dock to bottom-right when opening from chip
    setPos({
      x: Math.max(12, window.innerWidth - size.w - 20),
      y: Math.max(12, window.innerHeight - size.h - 20),
    });
  }

  if (!placed) return null;

  return (
    <aside
      ref={panelRef}
      className={
        [
          styles.float,
          minimized ? styles.floatMinimized : "",
          dragging || resizing ? styles.floatDragging : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
      style={
        minimized
          ? undefined
          : {
              left: pos.x,
              top: pos.y,
              width: size.w,
              height: size.h,
            }
      }
      aria-label="brahma101 hydra helper"
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerUp}
      onPointerCancel={onPanelPointerUp}
    >
      {minimized ? (
        <button
          type="button"
          className={styles.dockChip}
          onClick={openHelper}
          aria-label="Open brahma101 helper"
        >
          <span className={styles.dragTitle}>brahma101</span>
          <span className={styles.dragSub}>helper</span>
        </button>
      ) : (
        <>
          <div
            className={styles.dragBar}
            onPointerDown={onMovePointerDown}
            title="Drag helper"
          >
            <span className={styles.dragTitle}>brahma101</span>
            <span className={styles.dragSub}>helper</span>
            <button
              type="button"
              className={styles.minimizeBtn}
              onClick={() => setMinimized(true)}
              aria-label="Minimize helper"
            >
              min
            </button>
          </div>

          <div className={styles.bodyWrap}>
            <div className={styles.messages} ref={listRef}>
              {messages.map((m) => (
                <article
                  key={m.id}
                  className={
                    m.role === "user"
                      ? `${styles.bubble} ${styles.bubbleUser}`
                      : m.role === "system"
                        ? `${styles.bubble} ${styles.bubbleSystem}`
                        : `${styles.bubble} ${styles.bubbleAssistant}`
                  }
                >
                  <div className={styles.meta}>
                    {m.role === "user"
                      ? "you"
                      : m.source === "local"
                        ? "local"
                        : m.source === "venice"
                          ? "venice"
                          : "brahma101"}
                  </div>
                  <pre className={styles.body}>{m.content}</pre>
                  {m.suggestedCode ? (
                    <button
                      type="button"
                      className={styles.applyBtn}
                      onClick={() => onApply(m.suggestedCode!)}
                    >
                      apply to editor
                    </button>
                  ) : null}
                </article>
              ))}
              {busy ? <p className={styles.thinking}>thinking…</p> : null}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.fixBtn}
                onClick={onFix}
                disabled={busy}
              >
                fix this
              </button>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Hydra…"
                disabled={busy}
                aria-label="Helper question"
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={busy || !input.trim()}
              >
                ask
              </button>
            </form>
          </div>

          {RESIZE_EDGES.map((edge) => (
            <div
              key={edge}
              className={`${styles.resizeEdge} ${styles[RESIZE_STYLE[edge]]}`}
              onPointerDown={(e) => onResizePointerDown(edge, e)}
              aria-hidden
            />
          ))}
        </>
      )}
    </aside>
  );
}

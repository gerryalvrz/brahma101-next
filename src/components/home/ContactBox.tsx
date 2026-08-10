"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  submitContactMessage,
  type ContactFormState,
} from "@/app/actions/contact";
import type { WorkContent, WorkProject } from "@/data/home";
import homeStyles from "@/app/(site)/home.module.css";
import styles from "./ContactBox.module.css";

const initialState: ContactFormState = { ok: false };

const SHELL_MESSAGES = [
  "Wake up, Neo...",
  "Follow the white rabbit...",
  "(R)evolve... you are the voice of the revolution.",
  "Buidl the hidden patterns of reality...",
  "Reality's structure is not static...",
  "The Universe is Mental.",
];

type Field = "name" | "email" | "phone" | "subject" | "message" | "confirm";

type Line =
  | { kind: "blank" }
  | { kind: "system"; text: string }
  | { kind: "input"; prompt: string; text: string }
  | { kind: "error"; text: string }
  | { kind: "ok"; text: string };

type Draft = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const emptyDraft: Draft = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const INSTRUCTIONS = [
  "open channel — leave a signal",
  "* required · enter skips optional",
  "/reset anytime to start over · ctrl+c clears",
] as const;

const FIELD_META: Record<
  Exclude<Field, "confirm">,
  { prompt: string; optional: boolean }
> = {
  name: { prompt: "name", optional: true },
  email: { prompt: "email*", optional: false },
  phone: { prompt: "phone", optional: true },
  subject: { prompt: "subject", optional: true },
  message: { prompt: "message*", optional: false },
};

const FIELD_ORDER: Exclude<Field, "confirm">[] = [
  "name",
  "email",
  "phone",
  "subject",
  "message",
];

const SITE_PAGES = [
  { id: "research", label: "research", href: "/research" },
  { id: "art", label: "art", href: "/art" },
  { id: "music", label: "music", href: "/music" },
  { id: "locognitive", label: "locognitive", href: "/locognitive" },
  { id: "e8sel", label: "e8sel", href: "/e8sel" },
  { id: "hack", label: "hack", href: "/hack" },
  {
    id: "prophet",
    label: "prophet-and-the-fool",
    href: "/prophet-and-the-fool",
  },
  { id: "writing", label: "writing", href: "/writing" },
] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function useShellTyper(messages: readonly string[]) {
  const [display, setDisplay] = useState("");
  const msgIdx = useRef(0);
  const charIdx = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const msg = messages[msgIdx.current];
      if (charIdx.current === 0) setDisplay("");

      if (charIdx.current < msg.length) {
        setDisplay(msg.slice(0, charIdx.current + 1));
        charIdx.current++;
        timer = setTimeout(tick, 100);
      } else {
        charIdx.current = 0;
        msgIdx.current = (msgIdx.current + 1) % messages.length;
        timer = setTimeout(tick, 1500);
      }
    }

    tick();
    return () => clearTimeout(timer);
  }, [messages]);

  return display;
}

function TreeLeafLink({
  project,
  isLast,
  prefix,
}: {
  project: WorkProject;
  isLast: boolean;
  prefix: string;
}) {
  const className = styles.treeLink;
  const content = (
    <>
      {project.label}
      {project.external ? (
        <span className={styles.treeExt} aria-hidden>
          ↗
        </span>
      ) : null}
    </>
  );

  return (
    <li className={styles.treeItem}>
      <span className={styles.treeGuide} aria-hidden>
        {prefix}
        {isLast ? "└── " : "├── "}
      </span>
      {project.external ? (
        <a
          className={className}
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          title={project.label}
        >
          {content}
        </a>
      ) : (
        <Link className={className} href={project.href} title={project.label}>
          {content}
        </Link>
      )}
    </li>
  );
}

type ContactBoxProps = {
  title: string;
  subtitle: string;
  work: WorkContent;
};

export default function ContactBox({ title, subtitle, work }: ContactBoxProps) {
  const [state, formAction, pending] = useActionState(
    submitContactMessage,
    initialState
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [field, setField] = useState<Field>("name");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [value, setValue] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [done, setDone] = useState(false);
  const [promptFocused, setPromptFocused] = useState(false);
  const [showTree, setShowTree] = useState(true);
  const [openFolders, setOpenFolders] = useState({
    site: true,
    now: true,
    pages: true,
    groups: Object.fromEntries(work.now.map((g) => [g.id, false])) as Record<
      string,
      boolean
    >,
  });
  const lastResultRef = useRef<ContactFormState>(initialState);
  const shellText = useShellTyper(SHELL_MESSAGES);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines, field, pending]);

  useEffect(() => {
    if (state === lastResultRef.current) return;
    lastResultRef.current = state;

    if (state.ok) {
      setDone(true);
      setLines((prev) => [
        ...prev,
        { kind: "ok", text: "signal received. I'll get back to you." },
      ]);
      return;
    }

    if (state.error) {
      setLines((prev) => [
        ...prev,
        { kind: "error", text: `error: ${state.error}` },
        { kind: "system", text: "fix and type send to retry, or /reset" },
      ]);
      setField("confirm");
    }
  }, [state]);

  function focusInput() {
    inputRef.current?.focus();
  }

  function append(...next: Line[]) {
    setLines((prev) => [...prev, ...next]);
  }

  function resetSession() {
    lastResultRef.current = initialState;
    setLines([{ kind: "system", text: "session cleared." }, { kind: "blank" }]);
    setField("name");
    setDraft(emptyDraft);
    setValue("");
    setDone(false);
  }

  function promptFor(next: Field) {
    setField(next);
    setValue("");
    if (next === "confirm") {
      append(
        { kind: "blank" },
        { kind: "system", text: "ready to transmit." },
        { kind: "system", text: "type send · or /reset to rewrite" }
      );
    }
  }

  function advanceFrom(current: Exclude<Field, "confirm">) {
    const idx = FIELD_ORDER.indexOf(current);
    const next = FIELD_ORDER[idx + 1];
    if (!next) {
      promptFor("confirm");
      return;
    }
    promptFor(next);
  }

  function submitDraft(current: Draft) {
    append({ kind: "system", text: "transmitting…" });
    const fd = new FormData();
    fd.set("name", current.name);
    fd.set("email", current.email);
    fd.set("phone", current.phone);
    fd.set("subject", current.subject);
    fd.set("message", current.message);
    fd.set("website", honeypot);
    startTransition(() => {
      formAction(fd);
    });
  }

  function handleLine(raw: string) {
    const trimmed = raw.trim();
    const display = raw;

    if (trimmed === "/reset") {
      append({ kind: "input", prompt: "$", text: display });
      resetSession();
      return;
    }

    if (field === "confirm") {
      append({ kind: "input", prompt: "$", text: display });
      if (trimmed === "send" || trimmed === "y" || trimmed === "yes") {
        submitDraft(draft);
        setValue("");
        return;
      }
      append({
        kind: "system",
        text: "unknown command — type send or /reset",
      });
      setValue("");
      return;
    }

    const meta = FIELD_META[field];
    append({ kind: "input", prompt: meta.prompt, text: display });

    if (!trimmed && !meta.optional) {
      append({ kind: "error", text: `${meta.prompt} is required` });
      setValue("");
      return;
    }

    if (field === "email" && trimmed && !isValidEmail(trimmed)) {
      append({ kind: "error", text: "need a valid email" });
      setValue("");
      return;
    }

    if (field === "message" && trimmed.length < 3) {
      append({ kind: "error", text: "message too short" });
      setValue("");
      return;
    }

    const next = { ...draft, [field]: trimmed };
    setDraft(next);
    setValue("");
    advanceFrom(field);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending || done) return;
    handleLine(value);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (pending || done) return;
      handleLine(value);
      return;
    }
    if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      append({ kind: "input", prompt: "", text: "^C" });
      resetSession();
    }
  }

  function toggleFolder(key: "site" | "now" | "pages") {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleGroup(id: string) {
    setOpenFolders((prev) => ({
      ...prev,
      groups: { ...prev.groups, [id]: !prev.groups[id] },
    }));
  }

  const canSend = field === "confirm" && !pending && !done;
  const activePrompt =
    field === "confirm" ? "$" : FIELD_META[field].prompt;

  const nowGroups = work.now;
  const lastGroupIdx = nowGroups.length - 1;

  return (
    <section
      id="contact"
      className={`${homeStyles.section} ${styles.contactBox}`}
      aria-labelledby="contact-heading"
    >
      <h2 id="contact-heading">{title}</h2>
      <p className={homeStyles.muted}>{subtitle}</p>

      <div className={styles.terminal} aria-label="Site terminal">
        <div className={styles.titleBar}>
          <span className={styles.titleGrip} aria-hidden>
            ⋮⋮
          </span>
          <span className={styles.titleLabel}>navigate</span>
          <span className={styles.titleHint}>worktree site menu · Contact form</span>
        </div>

        <div
          className={
            showTree
              ? styles.body
              : `${styles.body} ${styles.bodyEditorOnly}`
          }
        >
          {showTree ? (
            <aside className={styles.treePane} aria-label="Site worktree">
              <div className={styles.treeRoot}>
                <button
                  type="button"
                  className={styles.treeFolderBtn}
                  onClick={() => toggleFolder("site")}
                  aria-expanded={openFolders.site}
                >
                  <span className={styles.treeCaret} aria-hidden>
                    {openFolders.site ? "▼" : "▶"}
                  </span>
                  <span className={styles.treeRootLabel}>site/</span>
                </button>
              </div>

              {openFolders.site ? (
                <>
                  <div className={styles.treeBranch}>
                    <button
                      type="button"
                      className={styles.treeFolderBtn}
                      onClick={() => toggleFolder("now")}
                      aria-expanded={openFolders.now}
                    >
                      <span className={styles.treeGuide} aria-hidden>
                        ├──{" "}
                      </span>
                      <span className={styles.treeCaret} aria-hidden>
                        {openFolders.now ? "▼" : "▶"}
                      </span>
                      <span className={styles.treeFolderLabel}>
                        {work.nowLabel.toLowerCase()}/
                      </span>
                    </button>

                    {openFolders.now
                      ? nowGroups.map((group, gi) => {
                          const groupOpen = openFolders.groups[group.id];
                          const isLastGroup = gi === lastGroupIdx;
                          return (
                            <div key={group.id} className={styles.treeBranch}>
                              <button
                                type="button"
                                className={styles.treeFolderBtn}
                                onClick={() => toggleGroup(group.id)}
                                aria-expanded={groupOpen}
                              >
                                <span className={styles.treeGuide} aria-hidden>
                                  │   {isLastGroup ? "└── " : "├── "}
                                </span>
                                <span className={styles.treeCaret} aria-hidden>
                                  {groupOpen ? "▼" : "▶"}
                                </span>
                                <span className={styles.treeFolderLabel}>
                                  {group.label}/
                                </span>
                              </button>
                              {groupOpen ? (
                                <ul className={styles.treeList}>
                                  {group.projects.map((project, pi) => (
                                    <TreeLeafLink
                                      key={project.id}
                                      project={project}
                                      isLast={pi === group.projects.length - 1}
                                      prefix={
                                        isLastGroup ? "│       " : "│   │   "
                                      }
                                    />
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          );
                        })
                      : null}
                  </div>

                  <div className={styles.treeBranch}>
                    <button
                      type="button"
                      className={styles.treeFolderBtn}
                      onClick={() => toggleFolder("pages")}
                      aria-expanded={openFolders.pages}
                    >
                      <span className={styles.treeGuide} aria-hidden>
                        ├──{" "}
                      </span>
                      <span className={styles.treeCaret} aria-hidden>
                        {openFolders.pages ? "▼" : "▶"}
                      </span>
                      <span className={styles.treeFolderLabel}>pages/</span>
                    </button>
                    {openFolders.pages ? (
                      <ul className={styles.treeList}>
                        {SITE_PAGES.map((page, i) => (
                          <li key={page.id} className={styles.treeItem}>
                            <span className={styles.treeGuide} aria-hidden>
                              │   {i === SITE_PAGES.length - 1 ? "└── " : "├── "}
                            </span>
                            <Link className={styles.treeLink} href={page.href}>
                              {page.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className={styles.treeBranch}>
                    <div className={styles.treeItem}>
                      <span className={styles.treeGuide} aria-hidden>
                        └──{" "}
                      </span>
                      <button
                        type="button"
                        className={`${styles.treeLink} ${styles.treeLinkActive}`}
                        onClick={focusInput}
                      >
                        contact
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </aside>
          ) : null}

          <div className={styles.editorPane}>
            <div className={styles.panelBar}>
              <p className={styles.hint}>enter to confirm · /reset clears</p>
              <button
                type="button"
                className={styles.sendBtn}
                disabled={!canSend}
                onClick={() => {
                  if (!canSend) return;
                  append({ kind: "input", prompt: "$", text: "send" });
                  submitDraft(draft);
                }}
              >
                {pending ? "…" : "send"}
              </button>
            </div>

            <div className={styles.repl} onClick={focusInput}>
              <div className={styles.replHeader}>
                <p className={styles.shellLine} aria-live="polite">
                  <span className={styles.shellUser}>brahma101</span>
                  <span className={styles.shellAt}>@</span>
                  <span className={styles.shellHost}>cyou</span>
                  <span className={styles.shellColon}>: </span>
                  <span className={styles.shellPct}>%</span>
                  <span className={styles.shellMsg}> {shellText}</span>
                  <span className="blinking-cursor" aria-hidden />
                </p>

                <div className={styles.instructions}>
                  {INSTRUCTIONS.map((line) => (
                    <p key={line} className={styles.comment}>
                      <span className={styles.commentHash}>#</span> {line}
                    </p>
                  ))}
                </div>
              </div>

              <div ref={scrollRef} className={styles.log} aria-live="polite">
                {lines.map((line, i) => {
                  if (line.kind === "blank") {
                    return (
                      <p key={`blank-${i}`} className={styles.lineBlank}>
                        {"\u00A0"}
                      </p>
                    );
                  }
                  if (line.kind === "input") {
                    return (
                      <p key={`${i}-input`} className={styles.lineInput}>
                        {line.prompt ? (
                          <span className={styles.linePrompt}>
                            {line.prompt}
                          </span>
                        ) : null}
                        {line.prompt ? " " : null}
                        <span className={styles.lineValue}>{line.text}</span>
                      </p>
                    );
                  }
                  return (
                    <p
                      key={`${i}-${line.kind}-${line.text.slice(0, 32)}`}
                      className={
                        line.kind === "error"
                          ? styles.lineError
                          : line.kind === "ok"
                            ? styles.lineOk
                            : styles.lineSystem
                      }
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>

              {!done ? (
                <form className={styles.promptForm} onSubmit={onSubmit}>
                  <label className={styles.promptLabel}>
                    <span className={styles.promptName}>{activePrompt}</span>
                    <span className={styles.promptEditor}>
                      <span className={styles.promptValue} aria-hidden>
                        {value}
                      </span>
                      {promptFocused && !pending ? (
                        <span
                          className={`blinking-cursor ${styles.promptCaret}`}
                          aria-hidden
                        />
                      ) : null}
                      <input
                        ref={inputRef}
                        className={styles.promptInput}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={onKeyDown}
                        onFocus={() => setPromptFocused(true)}
                        onBlur={() => setPromptFocused(false)}
                        disabled={pending}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={field === "message" ? 4000 : 254}
                        aria-label={
                          field === "confirm"
                            ? "Type send to transmit"
                            : `Enter ${FIELD_META[field].prompt}`
                        }
                      />
                    </span>
                  </label>
                  <input
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    className={styles.honeypot}
                    aria-hidden="true"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                  <button type="submit" hidden tabIndex={-1} aria-hidden="true">
                    submit
                  </button>
                </form>
              ) : (
                <p className={styles.promptIdle}>
                  <button
                    type="button"
                    className={styles.restart}
                    onClick={resetSession}
                  >
                    open another channel
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.creditRow}>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => setShowTree((v) => !v)}
            aria-pressed={showTree}
          >
            {showTree ? "hide tree" : "show tree"}
          </button>
          <p className={styles.credit}>
            site worktree · same routes as NOW · type send when ready
          </p>
        </div>
      </div>
    </section>
  );
}

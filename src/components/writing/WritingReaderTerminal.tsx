"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/(site)/writing/writing.module.css";

type WritingReaderTerminalProps = {
  slug: string;
  title: string;
  children: ReactNode;
  fileLabel?: string;
  hint?: string;
  indexHref?: string;
  indexLabel?: string;
};

export default function WritingReaderTerminal({
  slug,
  title,
  children,
  fileLabel = `${slug}.md`,
  hint = "writing · read",
  indexHref = "/writing",
  indexLabel = "Writing",
}: WritingReaderTerminalProps) {
  const router = useRouter();
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <main className={`${styles.shell} ${styles.shellDocked}`}>
        <div className={styles.bgVeil} aria-hidden />
        <button
          type="button"
          className={styles.dockChip}
          onClick={() => setMinimized(false)}
          aria-label={`Restore reading: ${title}`}
        >
          <span className={styles.titleGrip} aria-hidden>
            ⋮⋮
          </span>
          <span className={styles.dockLabel}>{fileLabel}</span>
          <span className={styles.dockRestore}>restore</span>
        </button>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.bgVeil} aria-hidden />

      <div className={styles.terminal}>
        <div className={styles.scanLine} aria-hidden />

        <header className={styles.titleBar}>
          <span className={styles.titleGrip} aria-hidden>
            ⋮⋮
          </span>
          <span className={styles.titleLabel}>{fileLabel}</span>
          <span className={styles.titleHint}>{hint}</span>
          <div className={styles.titleActions}>
            <button
              type="button"
              className={styles.titleAction}
              onClick={() => setMinimized(true)}
              aria-label="Minimize reading"
              title="Minimize"
            >
              _
            </button>
            <button
              type="button"
              className={styles.titleAction}
              onClick={() => router.push(indexHref)}
              aria-label={`Close to ${indexLabel} index`}
              title="Close"
            >
              ×
            </button>
          </div>
        </header>

        <div className={styles.terminalBody}>
          <Link href={indexHref} className={styles.back}>
            ← {indexLabel}
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}

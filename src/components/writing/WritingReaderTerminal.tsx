"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/(site)/writing/writing.module.css";

type WritingReaderTerminalProps = {
  slug: string;
  title: string;
  children: ReactNode;
};

export default function WritingReaderTerminal({
  slug,
  title,
  children,
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
          <span className={styles.dockLabel}>{slug}.md</span>
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
          <span className={styles.titleLabel}>{slug}.md</span>
          <span className={styles.titleHint}>writing · read</span>
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
              onClick={() => router.push("/writing")}
              aria-label="Close to writing index"
              title="Close"
            >
              ×
            </button>
          </div>
        </header>

        <div className={styles.terminalBody}>
          <Link href="/writing" className={styles.back}>
            ← Writing
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}

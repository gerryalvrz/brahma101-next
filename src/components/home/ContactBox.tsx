"use client";

import { useActionState } from "react";
import {
  submitContactMessage,
  type ContactFormState,
} from "@/app/actions/contact";
import styles from "@/app/(site)/home.module.css";

const initialState: ContactFormState = { ok: false };

type ContactBoxProps = {
  title: string;
  subtitle: string;
};

export default function ContactBox({ title, subtitle }: ContactBoxProps) {
  const [state, formAction, pending] = useActionState(
    submitContactMessage,
    initialState
  );

  return (
    <section
      id="contact"
      className={`${styles.section} ${styles.contactBox}`}
      aria-labelledby="contact-heading"
    >
      <h2 id="contact-heading">{title}</h2>
      <p className={styles.muted}>{subtitle}</p>

      {state.ok ? (
        <p className={styles.contactSuccess} role="status">
          Signal received. I&apos;ll get back to you.
        </p>
      ) : (
        <form action={formAction} className={styles.contactForm}>
          <label className={styles.contactField}>
            <span>Name</span>
            <input
              name="name"
              type="text"
              autoComplete="name"
              maxLength={120}
              placeholder="your name"
            />
          </label>

          <label className={styles.contactField}>
            <span>Email *</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              placeholder="you@domain.xyz"
            />
          </label>

          <label className={styles.contactField}>
            <span>Phone</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              placeholder="+52 …"
            />
          </label>

          <label className={styles.contactField}>
            <span>Subject</span>
            <input
              name="subject"
              type="text"
              maxLength={160}
              placeholder="what's this about"
            />
          </label>

          <label className={`${styles.contactField} ${styles.contactMessage}`}>
            <span>Message *</span>
            <textarea
              name="message"
              required
              rows={4}
              maxLength={4000}
              placeholder="drop a line…"
            />
          </label>

          {/* Honeypot */}
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            className={styles.honeypot}
            aria-hidden="true"
          />

          {state.error ? (
            <p className={styles.contactError} role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.button}
            disabled={pending}
          >
            {pending ? "Transmitting…" : "Send signal"}
          </button>
        </form>
      )}
    </section>
  );
}

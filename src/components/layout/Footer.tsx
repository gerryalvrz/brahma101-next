"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <footer className="text-center mt-8 text-sm text-[#0a0] text-shadow-neon py-4">
        <p>
          <span
            className="text-neon no-underline cursor-pointer hover:text-neon-hover"
            onClick={() => setShowModal(true)}
          >
            Lunarpunk
          </span>{" "}
          ☥ |{" "}
          <Link
            href="/music"
            className="text-neon no-underline hover:text-neon-hover"
          >
            Dance
          </Link>{" "}
          |{" "}
          <Link
            href="/hack"
            className="text-neon no-underline hover:text-neon-hover"
          >
            Hack
          </Link>{" "}
          |{" "}
          <Link
            href="/locognitive"
            className="text-neon no-underline hover:text-neon-hover"
          >
            Transform
          </Link>
        </p>
      </footer>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowModal(false)}
        >
          <div
            className="border-2 border-neon bg-black/90 p-6 rounded-lg shadow-neon text-neon font-mono text-center max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg mb-4">
              This is the beginning of the Lunarpunk World!
            </p>
            <button
              className="px-4 py-2 border-2 border-neon bg-transparent text-neon font-vt323 cursor-pointer hover:bg-neon hover:text-black transition-colors"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

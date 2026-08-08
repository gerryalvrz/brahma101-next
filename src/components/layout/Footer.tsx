"use client";

import Link from "next/link";
import { useState } from "react";

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <footer
        className={
          className ??
          "text-center mt-10 text-sm text-[#0a0] text-shadow-neon py-4"
        }
      >
        <p>
          <span className="footerLink" onClick={() => setShowModal(true)}>
            Lunarpunk
          </span>{" "}
          ☥ |{" "}
          <Link href="/music" className="footerLink">
            Dance
          </Link>{" "}
          |{" "}
          <Link href="/hack" className="footerLink">
            Hack
          </Link>{" "}
          |{" "}
          <Link href="/locognitive" className="footerLink">
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
            className="border-2 border-[#0f0] bg-black/85 p-6 rounded-[5px] shadow-neon text-[#0f0] font-mono text-center max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg mb-4">
              This is the beginning of the Lunarpunk World!
            </p>
            <button
              className="px-4 py-2 rounded-[5px] border-2 border-[#0f0] bg-transparent text-[#0f0] font-vt323 cursor-pointer hover:bg-[#0f0] hover:text-black transition-colors duration-300"
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

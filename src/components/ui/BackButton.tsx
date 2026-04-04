import Link from "next/link";

export default function BackButton() {
  return (
    <Link
      href="/"
      className="fixed top-5 left-5 z-[1000] bg-[rgba(0,20,0,0.8)] text-neon px-5 py-3 rounded-[10px] no-underline text-base border-2 border-neon cursor-pointer transition-all duration-300 shadow-[0_0_5px_rgba(0,255,0,0.6)] font-vt323 hover:bg-[rgba(0,40,0,0.9)] hover:scale-105 hover:shadow-neon-strong hover:text-shadow-neon"
    >
      ← Back to Menu
    </Link>
  );
}

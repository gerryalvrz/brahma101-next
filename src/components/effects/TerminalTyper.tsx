"use client";

import { useEffect, useState, useRef } from "react";

const MESSAGES = [
  "Wake up, Neo...",
  "Follow the white rabbit...",
  "(R)evolve... you are the voice of the revolution.",
  "Buidl the hidden patterns of reality...",
  "Reality's structure is not static...",
  "The Universe is Mental.",
];

export default function TerminalTyper() {
  const [display, setDisplay] = useState("");
  const msgIdx = useRef(0);
  const charIdx = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const msg = MESSAGES[msgIdx.current];
      if (charIdx.current === 0) setDisplay("");

      if (charIdx.current < msg.length) {
        setDisplay(msg.slice(0, charIdx.current + 1));
        charIdx.current++;
        timer = setTimeout(tick, 100);
      } else {
        charIdx.current = 0;
        msgIdx.current = (msgIdx.current + 1) % MESSAGES.length;
        timer = setTimeout(tick, 1500);
      }
    }

    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-4/5 max-w-[800px] mx-auto my-12 p-5 text-center border-2 border-neon bg-black/80 text-neon font-mono text-lg leading-relaxed shadow-neon">
      <p>
        {display}
        <span className="blinking-cursor" />
      </p>
    </div>
  );
}

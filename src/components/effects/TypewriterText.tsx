"use client";

import { useEffect, useState, useRef } from "react";

interface TypewriterTextProps {
  words: string[];
  speed?: number;
  pauseMs?: number;
  className?: string;
}

export default function TypewriterText({
  words,
  speed = 100,
  pauseMs = 2000,
  className = "",
}: TypewriterTextProps) {
  const [display, setDisplay] = useState("");
  const wordIdx = useRef(0);
  const charIdx = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const word = words[wordIdx.current];

      if (!deleting.current) {
        if (charIdx.current < word.length) {
          charIdx.current++;
          setDisplay(word.slice(0, charIdx.current));
          timer = setTimeout(tick, speed);
        } else {
          deleting.current = true;
          timer = setTimeout(tick, pauseMs);
        }
      } else {
        if (charIdx.current > 0) {
          charIdx.current--;
          setDisplay(word.slice(0, charIdx.current));
          timer = setTimeout(tick, speed);
        } else {
          deleting.current = false;
          wordIdx.current = (wordIdx.current + 1) % words.length;
          timer = setTimeout(tick, 500);
        }
      }
    }

    tick();
    return () => clearTimeout(timer);
  }, [words, speed, pauseMs]);

  return (
    <span className={`typewriter-cursor inline-block whitespace-nowrap overflow-hidden ${className}`}>
      {display}
    </span>
  );
}

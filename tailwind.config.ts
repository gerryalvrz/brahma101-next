import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: "var(--color-primary)",
        "neon-dim": "rgba(0, 255, 0, 0.35)",
        "neon-hover": "var(--color-accent)",
        "neon-glow": "rgba(0, 255, 0, 0.5)",
        "bg-dark": "var(--bg-dark)",
        "bg-gradient-1": "#0f0c29",
        "bg-gradient-2": "#032B2D",
        "bg-gradient-3": "#24243e",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Courier New", "monospace"],
        vt323: ["var(--font-display)", "monospace"],
        display: ["var(--font-display)", "monospace"],
        body: ["var(--font-body)", "Courier New", "monospace"],
      },
      boxShadow: {
        neon: "0 0 15px rgba(0, 255, 0, 0.5)",
        "neon-strong":
          "0 0 5px 2px #0f0, 0 0 10px 3px #0f0, 0 0 15px 5px #0f0",
        "neon-thin":
          "0 0 3px 1px rgb(2, 87, 2), 0 0 6px 2px rgb(45, 169, 45), 0 0 10px 3px rgb(18, 226, 18)",
      },
      textShadow: {
        neon: "0 0 10px rgba(0, 255, 0, 0.75)",
        "neon-strong": "0 0 15px rgba(0, 255, 0, 0.9)",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        pulse: {
          "0%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1.1)" },
        },
      },
      animation: {
        blink: "blink 0.75s step-end infinite",
        "blink-slow": "blink 0.8s linear infinite",
        pulse: "pulse 6s infinite alternate",
      },
    },
  },
  plugins: [],
};
export default config;

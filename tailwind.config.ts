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
        neon: "#00ff00",
        "neon-dim": "#004400",
        "neon-hover": "#ff33cc",
        "neon-glow": "rgba(0, 255, 0, 0.5)",
        "bg-dark": "#000000",
        "bg-gradient-1": "#0f0c29",
        "bg-gradient-2": "#032B2D",
        "bg-gradient-3": "#24243e",
      },
      fontFamily: {
        mono: ["'Courier New'", "Courier", "monospace"],
        vt323: ["var(--font-vt323)", "monospace"],
      },
      boxShadow: {
        neon: "0 0 15px rgba(0, 255, 0, 0.5)",
        "neon-strong": "0 0 25px rgba(0, 255, 0, 0.8)",
        "neon-thin":
          "0 0 3px 1px rgb(2, 87, 2), 0 0 6px 2px rgb(45, 169, 45), 0 0 10px 3px rgb(18, 226, 18)",
      },
      textShadow: {
        neon: "0 0 10px #0f0",
        "neon-strong": "0 0 15px #0f0",
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
        scanline: {
          "0%": { transform: "translateY(-100vh)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      animation: {
        blink: "blink 0.75s step-end infinite",
        "blink-slow": "blink 0.8s linear infinite",
        pulse: "pulse 6s infinite alternate",
        scanline: "scanline 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

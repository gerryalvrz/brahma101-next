/**
 * Load @strudel/web via a same-origin script tag.
 * Turbopack cannot resolve Strudel's SharedWorker `new URL(...import.meta.url)`
 * pattern, so we never import the package through the bundler.
 */

export type StrudelApi = {
  initStrudel: (options?: {
    prebake?: () => void | Promise<void>;
  }) => Promise<unknown>;
  evaluate: (code: string, autoplay?: boolean) => Promise<unknown>;
  hush: () => void;
  samples: (map: string) => Promise<unknown>;
};

declare global {
  interface Window {
    initStrudel?: StrudelApi["initStrudel"];
    strudel?: StrudelApi;
  }
}

const SCRIPT_ID = "brahma101-strudel-web";
/** Copied from node_modules/@strudel/web/dist via scripts/copy-strudel.mjs */
const SCRIPT_SRC = "/vendor/strudel/index.js";

let loadPromise: Promise<StrudelApi> | null = null;

function readApi(): StrudelApi | null {
  const fromWindow = window.strudel;
  if (
    fromWindow &&
    typeof fromWindow.initStrudel === "function" &&
    typeof fromWindow.evaluate === "function" &&
    typeof fromWindow.hush === "function" &&
    typeof fromWindow.samples === "function"
  ) {
    return fromWindow;
  }

  if (typeof window.initStrudel === "function") {
    // IIFE also stamps window.initStrudel; pull the rest from the UMD export.
    const umd = window.strudel;
    if (umd) return umd;
  }

  return null;
}

export function loadStrudel(): Promise<StrudelApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Strudel only runs in the browser"));
  }

  const existing = readApi();
  if (existing) return Promise.resolve(existing);

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<StrudelApi>((resolve, reject) => {
    const done = () => {
      const api = readApi();
      if (!api) {
        reject(new Error("Strudel script loaded but API not found on window"));
        return;
      }
      // Prefer the UMD namespace; fall back to window.initStrudel only.
      if (!api.evaluate && typeof window.initStrudel === "function") {
        reject(new Error("Strudel evaluate() missing from UMD export"));
        return;
      }
      resolve(api);
    };

    const prior = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (prior) {
      if (readApi()) {
        done();
        return;
      }
      prior.addEventListener("load", done, { once: true });
      prior.addEventListener(
        "error",
        () => reject(new Error("Failed to load Strudel script")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", done, { once: true });
    script.addEventListener(
      "error",
      () => {
        loadPromise = null;
        reject(
          new Error(
            `Failed to load ${SCRIPT_SRC} — run \`npm run copy:strudel\``
          )
        );
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return loadPromise;
}

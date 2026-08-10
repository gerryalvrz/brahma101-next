#!/usr/bin/env node
/**
 * Copy @strudel/web IIFE + SharedWorker clock into public/ so the browser
 * can load them same-origin (Turbopack cannot bundle the npm ESM build).
 */
import { cpSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules/@strudel/web/dist");
const destDir = join(root, "public/vendor/strudel");

if (!existsSync(join(srcDir, "index.js"))) {
  console.error("Missing @strudel/web — run npm install first");
  process.exit(1);
}

mkdirSync(join(destDir, "assets"), { recursive: true });
cpSync(join(srcDir, "index.js"), join(destDir, "index.js"));

const assets = join(srcDir, "assets");
for (const name of readdirSync(assets)) {
  if (name.startsWith("clockworker") && name.endsWith(".js")) {
    cpSync(join(assets, name), join(destDir, "assets", name));
  }
}

console.log("Copied @strudel/web → public/vendor/strudel/");

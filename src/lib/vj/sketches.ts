const STORAGE_KEY = "brahma101.vj.sketches";
const MAX_NAME = 48;
const MAX_CODE = 20_000;

export type VjStoredSketch = {
  id: string;
  name: string;
  code: string;
  updatedAt: string;
};

function isSketch(value: unknown): value is VjStoredSketch {
  if (!value || typeof value !== "object") return false;
  const sketch = value as Partial<VjStoredSketch>;
  return (
    typeof sketch.id === "string" &&
    typeof sketch.name === "string" &&
    typeof sketch.code === "string" &&
    typeof sketch.updatedAt === "string"
  );
}

export function readVjSketches(): VjStoredSketch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("sketches" in parsed)) return [];
    const sketches = (parsed as { sketches?: unknown }).sketches;
    if (!Array.isArray(sketches)) return [];
    return sketches.filter(isSketch);
  } catch {
    return [];
  }
}

function persist(sketches: VjStoredSketch[]) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ v: 1, sketches }),
  );
  return sketches;
}

export function saveVjSketch(
  name: string,
  code: string,
  existing: VjStoredSketch[],
): VjStoredSketch[] {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name the sketch before saving.");
  if (trimmed.length > MAX_NAME) {
    throw new Error(`Sketch names stay under ${MAX_NAME} characters.`);
  }
  if (code.length > MAX_CODE) {
    throw new Error("Sketch is too long to store in this browser.");
  }
  const now = new Date().toISOString();
  const next = existing.slice();
  const index = next.findIndex(
    (sketch) => sketch.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (index >= 0) {
    const current = next[index]!;
    next[index] = { ...current, name: trimmed, code, updatedAt: now };
  } else {
    next.unshift({
      id: crypto.randomUUID(),
      name: trimmed,
      code,
      updatedAt: now,
    });
  }
  try {
    return persist(next);
  } catch {
    throw new Error("Could not save. Browser storage is full.");
  }
}

export function deleteVjSketch(id: string, existing: VjStoredSketch[]) {
  const next = existing.filter((sketch) => sketch.id !== id);
  try {
    return persist(next);
  } catch {
    throw new Error("Could not update saved sketches.");
  }
}

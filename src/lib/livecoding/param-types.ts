/** Typed function catalog entry for livecoding param dashboards. */

export type ParamArgDef = {
  name: string;
  min: number;
  max: number;
  step: number;
  /** Skip non-numeric args (textures, callbacks, strings). */
  skip?: boolean;
};

export type ParamFnDef = {
  /** Function / method name as written in code (`osc`, `gain`, `setcpm`). */
  name: string;
  /** `call` = `name(`, `method` = `.name(`. */
  kind: "call" | "method";
  category: string;
  args: ParamArgDef[];
};

export type DetectedParam = {
  id: string;
  fnName: string;
  category: string;
  argName: string;
  /** 1-based occurrence of this function name in the source. */
  callIndex: number;
  argIndex: number;
  value: number;
  min: number;
  max: number;
  step: number;
  start: number;
  end: number;
  label: string;
};

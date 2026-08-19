import { NextResponse } from "next/server";
import { strudelAssistDocs } from "@/data/strudelAssistDocs";

export const runtime = "nodejs";

type ChatTurn = { role: "user" | "assistant"; content: string };

type AssistBody = {
  message?: string;
  code?: string;
  error?: string | null;
  history?: ChatTurn[];
};

const VENICE_URL = "https://api.venice.ai/api/v1/chat/completions";
const MAX_CODE = 8000;
const MAX_HISTORY = 6;
const MAX_MESSAGE = 2000;

function extractSuggestedCode(reply: string): string | undefined {
  const fences = [
    ...reply.matchAll(/```(?:js|javascript|strudel)?\s*([\s\S]*?)```/gi),
  ];
  if (fences.length === 0) return undefined;
  const last = fences[fences.length - 1][1]?.trim();
  return last || undefined;
}

function buildSystemPrompt(): string {
  return [
    "You are Strudel Assist on brahma101.cyou/create-music — a concise tutor for @strudel/web livecoding.",
    "Help the user fix patterns, explain mini-notation, and suggest working Strudel code.",
    "When correcting code, give a short explanation then a complete runnable pattern in a ```js fence.",
    "Do not invent APIs that are not in the reference below. Do not suggest Hydra video APIs.",
    "",
    strudelAssistDocs,
  ].join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.VENICE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "VENICE_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  let body: AssistBody;
  try {
    body = (await request.json()) as AssistBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = (body.message ?? "").trim().slice(0, MAX_MESSAGE);
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const code = (body.code ?? "").slice(0, MAX_CODE);
  const error = (body.error ?? "")?.toString().slice(0, 1000) || null;
  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (t) =>
            t &&
            (t.role === "user" || t.role === "assistant") &&
            typeof t.content === "string"
        )
        .slice(-MAX_HISTORY)
        .map((t) => ({
          role: t.role,
          content: t.content.slice(0, MAX_MESSAGE),
        }))
    : [];

  const contextBlock = [
    "## Current pattern",
    "```js",
    code || "// (empty)",
    "```",
    error ? `## Last runtime error\n${error}` : "## Last runtime error\n(none)",
    "## User question",
    message,
  ].join("\n");

  const model = process.env.VENICE_MODEL?.trim() || "qwen3-5-9b";

  try {
    const veniceRes = await fetch(VENICE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...history,
          { role: "user", content: contextBlock },
        ],
        temperature: 0.3,
      }),
    });

    if (!veniceRes.ok) {
      const detail = await veniceRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Venice API error (${veniceRes.status})`,
          detail: detail.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const data = (await veniceRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return NextResponse.json(
        { error: "Empty response from Venice" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply,
      suggestedCode: extractSuggestedCode(reply),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Venice request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

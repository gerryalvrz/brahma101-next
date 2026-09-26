import { NextResponse } from "next/server";
import { discoverCinema } from "@/lib/cinema/discover";
import { cinemaDiscoverQuerySchema } from "@/lib/cinema/filters";
import { getTmdbApiKey, TmdbError } from "@/lib/tmdb/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!getTmdbApiKey()) {
    return NextResponse.json(
      {
        error:
          "TMDB_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value.trim() !== "") raw[key] = value;
  }
  const parsed = cinemaDiscoverQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = await discoverCinema(parsed.data);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    if (err instanceof TmdbError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[cinema/discover]", err);
    return NextResponse.json(
      { error: "Failed to discover films" },
      { status: 500 }
    );
  }
}

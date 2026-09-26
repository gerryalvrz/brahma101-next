import { NextResponse } from "next/server";
import { listCinemaGenres } from "@/lib/cinema/discover";
import { getTmdbApiKey, TmdbError } from "@/lib/tmdb/client";

export const runtime = "nodejs";

export async function GET() {
  if (!getTmdbApiKey()) {
    return NextResponse.json(
      {
        error:
          "TMDB_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  try {
    const genres = await listCinemaGenres();
    return NextResponse.json(
      { genres },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (err) {
    if (err instanceof TmdbError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[cinema/genres]", err);
    return NextResponse.json(
      { error: "Failed to load genres" },
      { status: 500 }
    );
  }
}

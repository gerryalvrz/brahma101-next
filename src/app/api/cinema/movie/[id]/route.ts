import { NextResponse } from "next/server";
import { getCinemaMovieDetail } from "@/lib/cinema/discover";
import { getTmdbApiKey, TmdbError } from "@/lib/tmdb/client";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!getTmdbApiKey()) {
    return NextResponse.json(
      {
        error:
          "TMDB_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid movie id" }, { status: 400 });
  }

  try {
    const movie = await getCinemaMovieDetail(id);
    return NextResponse.json(movie, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    if (err instanceof TmdbError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[cinema/movie]", err);
    return NextResponse.json(
      { error: "Failed to load movie" },
      { status: 500 }
    );
  }
}

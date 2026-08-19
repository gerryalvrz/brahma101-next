import HomeView from "@/components/home/HomeView";
import { getVisibleWritingPostMetas } from "@/lib/writing";
import type { ArchiveEntry } from "@/data/home";

export default function HomePage() {
  // Server side: read posts from content/writing/ and hand the client a
  // serializable slice (no filesystem paths, no body content).
  const archive: ArchiveEntry[] = getVisibleWritingPostMetas().map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    draft: post.draft,
  }));

  return <HomeView archive={archive} />;
}

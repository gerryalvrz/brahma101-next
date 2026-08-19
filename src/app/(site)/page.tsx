import HomeView from "@/components/home/HomeView";
import { getVisibleWritingPostMetas } from "@/lib/writing";
import { getVisiblePaperMetas } from "@/lib/papers";
import type { ArchiveEntry } from "@/data/home";

export default function HomePage() {
  const archive: ArchiveEntry[] = getVisibleWritingPostMetas().map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    draft: post.draft,
  }));

  const papers: ArchiveEntry[] = getVisiblePaperMetas().map((paper) => ({
    slug: paper.slug,
    title: paper.title,
    date: paper.date,
    draft: paper.draft,
  }));

  return <HomeView archive={archive} papers={papers} />;
}

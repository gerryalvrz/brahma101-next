# Research papers

Git is the source of truth for ARCHIVE → Research papers.

| Rule | Detail |
|------|--------|
| PDF | `public/papers/{slug}.pdf` |
| Catalog | `content/papers/{slug}.md` (same slug) |
| Slug | kebab-case filename stem |
| Format | YAML frontmatter; optional markdown abstract |

```yaml
---
title: "Paper title"
date: "2026-08-19"
summary: "One or two sentences for the ARCHIVE list and OG."
tags:
  - research
draft: false
---

Optional abstract (GFM). The PDF is served from `/papers/{slug}.pdf`.
```

`README.md` in this folder is not a paper.

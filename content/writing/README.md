# Writing content

Git + Markdown is the source of truth for `/writing`.

Supabase `posts` is **not** used. Hermes / `/studio` may publish into this folder later; for now an agent or human drops `.md` files here.

## Contract

| Rule | Detail |
|------|--------|
| File | `content/writing/{slug}.md` |
| Slug | Filename stem only (kebab-case: `my-post.md` → `/writing/my-post`) |
| Format | Plain Markdown + GFM (not MDX) |
| Frontmatter | Required YAML keys below |

```yaml
---
title: "Post title"
date: "2026-08-16"   # YYYY-MM-DD
summary: "One or two sentences for the index and OG description."
tags:
  - agents
  - web3
draft: false         # true = hidden when NODE_ENV=production
---

Body in Markdown (GFM).
```

### Visibility

- `draft: true` → shown in local/dev, **hidden in production**
- `draft: false` → published everywhere

### Ignored files

- `README.md` in this folder is documentation only (not a post)

## Agent publish flow

1. Validate frontmatter against the contract.
2. Write `content/writing/{slug}.md` (slug = filename).
3. Commit / PR / deploy — no CMS DB write.

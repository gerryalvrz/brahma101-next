---
name: writing-archive
description: >-
  Publish and edit file-based writing posts for brahma101.cyou. Use when the
  user asks to write, draft, publish, or edit a blog post, essay, ARCHIVE
  entry, or anything under /writing or content/writing/.
disable-model-invocation: true
---

# Writing archive

Git + Markdown is the source of truth. There is no CMS write and **Supabase `posts` is unused**. A new `.md` file is the post.

Do not commit unless the user asks.

## Create or edit a post

1. Slug = filename stem only. Kebab-case: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
2. Write `content/writing/{slug}.md`.
3. Use **plain Markdown + GFM**, not MDX. No React in the body.
4. Required YAML frontmatter (all keys required; `draft` is a boolean, not a string):

```yaml
---
title: "Post title"
date: "2026-08-17"
summary: "One or two sentences for the index, OG description, and homepage ARCHIVE."
tags:
  - example
draft: false
---

Body.
```

5. `README.md` in that folder is docs only — never a post.

### Visibility

| `draft` | Local / `next dev` | Production |
|---------|--------------------|------------|
| `true`  | listed + readable  | hidden (`notFound`) |
| `false` | listed + readable  | listed + readable |

Invalid slug or frontmatter **throws at load time** and can break `/`, `/writing`, and `/writing/[slug]`. Validate before saving.

`date` must be a real calendar day as `YYYY-MM-DD`. Use today's date unless the user specifies otherwise. Newest date sorts first.

### What the site actually uses

Loader: `src/lib/writing/` (`schema.ts` + `load.ts`). Renderer: `marked` GFM (`markdown.ts`).

Rendered on the post page: `title`, `date`, `summary`, `tags`, `draft` badge (dev only), body HTML.

Homepage ARCHIVE list shows only `title`, `date`, and a draft badge. It does **not** show `summary` or tags.

Extra YAML keys (existing posts have `series` and `part`) are **ignored by the schema**. Do not add them expecting UI. Do not strip them from existing files unless asked.

## Where the post appears

No extra wiring. After the file is valid:

- `/` ARCHIVE → **Writing** (Xbox media-player list of blogs & articles) — server `src/app/(site)/page.tsx` maps metas → `ArchiveEntry[]` → `HomeView` → `WorkLinks`. **Research papers** is a separate ARCHIVE blade (`content/papers/` + `public/papers/`). Images / Videos are empty library blades. Do not put essays in the papers library.
- `/writing` index
- `/writing/{slug}` terminal reader (`WritingReaderTerminal`)

Do not edit `src/data/home.ts` to add archive rows. Do not add routes by hand.

## Voice and body

- Write in the language the user asks for. Current archive posts are Spanish essays.
- `summary` is public metadata (index + Open Graph). Keep it one or two sentences, no spoilers required, no markdown.
- Tags: lowercase kebab-ish words; existing series uses `building-while-human`, `brahma101`, plus topic tags.
- Body: GFM (headings, lists, quotes, fenced code, links). Images only if they already live under `public/` (or the user provides a path). Prefer relative site paths like `/images/...`.

## Checklist

- [ ] Filename = slug, kebab-case, `.md`
- [ ] Frontmatter: `title`, `date`, `summary`, `tags`, `draft`
- [ ] `draft: true` until the user says publish
- [ ] No `README.md` overwrite
- [ ] Did not touch `public/experiments/` or DES HTML
- [ ] Did not commit unless asked

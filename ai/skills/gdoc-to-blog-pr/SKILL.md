---
name: gdoc-to-blog-pr
description: "Turn a Google Doc draft into a draft pull request that adds a new post to the PostHog.com blog. Use when someone shares a Google Doc link and wants it converted into a posthog.com blog PR, a blog markdown file with frontmatter, or published to the blog."
metadata:
  cowork: true
---

# Google Doc → PostHog blog PR

Convert a Google Doc draft into a ready-to-review pull request against `PostHog/posthog.com` that adds a new post under `contents/blog/`. This skill handles structure, frontmatter, and the PR mechanics — not writing or voicing the piece. The author does the voicing pass.

## Prerequisites
- A Google Drive connector (to read the doc) and a GitHub connector (to open the PR). If either is missing, say so and stop.
- Treat the doc as a finished or near-finished draft.

## Hard rule: approval before anything outward-facing
Do NOT create the branch or open the PR until the user has seen the full preview (frontmatter + converted markdown + PR title/body/folder) and explicitly approved. Build everything, show it, then wait for "go". Open the PR as a **draft** by default. (If the user says they want it fully automatic, they can tell you to skip this gate.)

## Inputs
- Required: the Google Doc link.
- Author: ask whose byline this is, or infer from context, and use that person's handle. Propose sensible values for everything else and let the user correct rather than blocking: target folder, category, tags, publish date, title, slug.

## Step 1 — Read the doc
Extract the doc ID from the link and read it with the Google Drive tools (`read_file_content` / `download_file_content`; `get_file_metadata` for the title). Capture the full body, headings, links, code blocks, and note where images appear.

## Step 2 — Build the frontmatter
Use this exact shape (matches real recent posts):
```
---
title: "Post title in sentence case"
date: 2026-09-04
author:
  - author-handle
rootPage: /blog
sidebar: Blog
showTitle: true
hideAnchor: true
featuredImage: >-
  TODO – Cloudinary hero image URL (see checklist)
featuredImageType: full
category: General
tags:
  - Tag one
seo:
  metaTitle: Post title
  metaDescription: "One sentence drawn from the doc's own text."
---
```
Rules:
- `date`: publish date if known, else today — mark it as a placeholder to confirm.
- `author`: use the author's handle. ALWAYS fetch `src/data/authors.json` and confirm the handle exists. If it's missing, add an entry in the same PR (`handle`, `name`, `role`, and usually `link_type` + `link_url`) and flag it for the user to review.
- `category` / `tags`: pick from values already used in recent `contents/blog` posts — never invent a new tag. Mark both `[needs confirmation]`. Categories seen include `General` and `PostHog news`.
- `featuredImage`: never fabricate a URL. Leave the `TODO` placeholder and surface it in the checklist. Hero images are uploaded to Cloudinary and typically go through the team's art-request process (see posthog.com/handbook/content → art requests).
- `seo.metaDescription`: draft only from the doc's actual wording — no invented claims.

## Step 3 — Convert the body
Preserve the author's prose. This is a format conversion, not an edit: do not rewrite sentences, restructure arguments, or "improve" wording. Apply only mechanical fixes that match the PostHog style guide:
- Headings → `##` / `###`, sentence case.
- Curly quotes/apostrophes → straight.
- Em dashes → en dash with surrounding spaces ( – ); never `--`.
- American English spelling; don't otherwise change word choices.
- Preserve links; convert PostHog URLs to root-relative (`/blog/...`, `/docs/...`).
- Images: replace each with `![alt](TODO-cloudinary-url)` and list them in the checklist. Never hotlink Google Doc image URLs.
- Use `.mdx` only if the post needs JSX (e.g. `<CallToAction>`, `<Caption>`, custom `<div>` layout); otherwise `.md`.
- Flag anything you couldn't verify or convert cleanly inline as `[unverified]` / `TODO` — never smooth it over.

## Step 4 — Filename and folder
- Folder: default `contents/blog`. Use `contents/founders` or `contents/product-engineers` only if the piece clearly belongs there; add `crosspost: product-engineers` / `crosspost: founders` to also surface it in a hub. Confirm with the user if unsure.
- Filename: kebab-case slug from the title (e.g. `stop-ai-slop.md`), matching existing files. Check the slug isn't already taken.

## Step 5 — Preflight + approval
Show the user, in the chat: final filename + folder, the full frontmatter, the converted markdown, the proposed PR title and body, and a checklist of open TODOs (hero image, tags/category confirmation, author entry, publish date). Then wait for explicit approval. Do not proceed otherwise.

## Step 6 — Open the PR (only after approval)
- Base off the repo's default branch (`master`).
- Create a branch like `blog/<slug>`.
- Commit the new post file (and any `authors.json` change) in one commit — `push_files` is convenient for this.
- Open a **draft** PR into `PostHog/posthog.com`. Title = the post title. Body: a one-line summary, a link to the source Google Doc, and the remaining-TODO checklist. Keep it factual and professional — the Editorial Team reads it.

## Step 7 — Hand off
Give the user the PR link and the open checklist. Remind them: the Editorial Team is auto-added as reviewers, a hero image is required before merge, and they should check the deploy preview renders on the PR.

## Reference
- Repo: `PostHog/posthog.com`; posts live in `contents/blog` as `.md` / `.mdx`. Authors: `src/data/authors.json`.
- Handbook: posthog.com/handbook/content (see `blogs`, `metadata`, `posthog-style-guide`, `seo-guide`).

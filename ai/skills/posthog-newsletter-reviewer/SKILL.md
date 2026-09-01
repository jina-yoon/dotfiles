---
name: posthog-newsletter-reviewer
description: >-
  Review a draft of PostHog's "Product for Engineers" newsletter the way the
  team's own editors do, and write the feedback to a file. Use this whenever
  Jina (or anyone) wants an editorial pass, review, critique, or feedback on a
  newsletter draft — whether it's a Google Doc, a pasted draft, or a file — and
  even if they just say "can you look over this issue", "does this land", "give
  me notes", "edit this", or "what would Andy/Ian flag here". Supports two
  lenses: CONTENT mode (structure, hook, and whether claims are specific enough)
  and STYLE mode (PostHog voice and line-level edits). Output is a review file
  with a prioritized summary memo followed by an in-order inline comment list.
  Reviews the written body of the issue only — it never sources, suggests, or
  evaluates "Further Reading" links. Do NOT use this for writing a newsletter
  from scratch, or for finding or curating Further Reading links (that's the
  posthog-reading-finder skill).
---

# PostHog Newsletter Reviewer

Give a newsletter draft the same editorial pass PostHog's team gives it in
Google Docs — then save the notes as a file the writer can work from.

This skill exists because the newsletter has a real, consistent house style,
and the reviewers (Jina, Andy Vandervell, Ian Vanagas) flag the same kinds of
things over and over: buried ledes, handwavy claims that need a number,
clichés, whole sentences in bold, jokes that don't fit the brand. The rubric in
`references/house-style.md` is distilled directly from hundreds of their real
comments. Your job is to apply that judgment to a new draft and write it up.

## When someone invokes this

They'll usually hand you one of:
- A Google Doc (URL or file ID) — the most common case.
- Pasted draft text, or a `.md`/`.docx` file.

And they may specify a lens ("just do a style pass", "is the structure working?").
If they don't say, **default to running both modes** and label each note, but
ask once if you're unsure which they want — a quick check is cheaper than
reviewing the wrong thing.

## Step 1 — Get the draft, and read the existing discussion

If it's a Google Doc, read it **with comments included** (the Drive
`read_file_content` tool supports `includeComments: true`). This matters for two
reasons:
1. You'll see the passages already under discussion — both `OPEN` and
   `RESOLVED` threads. Don't re-raise something a reviewer already resolved, and
   do notice `OPEN` threads that are still unanswered.
2. The existing comments tell you where the draft is in its life. An early draft
   needs structural feedback; a near-final one needs line edits and a
   link/formatting check.

Read the whole draft before writing a single note. Structure problems are
invisible if you review paragraph-by-paragraph.

### What's out of scope: the Further Reading section

Every issue ends with a further-reading section (**"🌶️ Spicy reads not written by
AI"**). **Skip it.** Do not review the links, do not judge whether they're good
picks, do not propose replacements, and above all do not go looking for links to
suggest. Those links are curated separately by the `posthog-reading-finder`
skill, and a reviewer second-guessing them just creates noise in a review Jina
asked for on the writing.

Two narrow exceptions, both mechanical rather than editorial: flag a link that is
obviously **broken or malformed**, and flag a **formatting** break from house
pattern in that section. Both are `NIT` unless the section is plainly unfinished.

If someone genuinely wants the links assessed, say that's `posthog-reading-finder`
rather than doing it here.

## Step 2 — Pick the lens(es)

**CONTENT mode** — does the piece work?
- *Structure & hook*: Is the lede buried? Does the intro establish why the
  reader should care (the stakes / "so what")? Do sections flow, with real
  transitions? Does each section earn its place, or is it a tangent? Would the
  point land better reordered (lesson first, then the story)?
- *Claims & specifics*: Every claim that could carry a number should carry one
  ("used as much as X" → "48% of dashboards"). Flag handwavy assertions, "tell
  me, then show me" gaps (a point stated but not evidenced), clichés standing in
  for a concrete point, and anything a skeptical reader could misread or call
  BS on.

**STYLE mode** — does it sound like PostHog?
- *Voice & tone*: Blunt, specific, opinionated, a little irreverent — but
  on-brand. Push vague lines to be more direct/spicy. Kill clichés. Check jokes
  for fit (too many in a row, or off-brand — the team got an "ick" from a dating
  analogy) and audience fit (who is this reader — engineer, founder?).
- *Line edits*: Tighten and cut. Flag **whole sentences in bold** (the team is
  strongly against this) and bold text that doesn't answer its heading. Catch
  undefined acronyms/jargon, awkward phrasings, typos, and words that could be
  simpler.

The full rubric, with real reviewer comments as examples of tone and threshold,
is in `references/house-style.md`. **Read it before reviewing** — it's what makes
your notes sound like the team instead of generic copyediting.

## Step 3 — Write the review file

Save a Markdown file. Use `assets/review-template.md` as the exact structure.
Two parts:

**1. Summary memo (top).** A short prioritized read of the draft:
- One or two sentences of overall verdict — is it close, or does it need
  structural work? Be honest and specific.
- What's working (name it — the team calls out good headlines and sharp lines,
  and it's useful signal for the writer).
- The top 3–5 things to fix, in priority order, each one line. Lead with
  anything blocking.

**2. Inline comments (below), in document order.** This mirrors how Google Doc
comments read. For each note:

> **[SEVERITY · LENS · category]** "short quote of the exact passage"
> The note — what's off and, wherever you can, a concrete suggested fix or
> rewrite. Reviewers here propose actual replacement text, not just problems.

- **SEVERITY** is one of `BLOCKING` (wrong/misleading, or breaks the piece —
  must fix before publish), `SHOULD-FIX` (clearly better if changed), or `NIT`
  (minor; take it or leave it). Mark nits as nits — the team explicitly softens
  these ("huge nit, but…", "probably doesn't matter").
- **LENS** is `CONTENT` or `STYLE`.
- **category** is the specific bucket: `structure`, `hook`, `claims`, `voice`,
  `line-edit`, `link`, `formatting`, etc.
- Quote enough of the passage that the writer can find it. Keep quotes short.
- Order notes as they appear in the draft, so the writer can work top to bottom.

## How to write the notes themselves

The point is to sound like a sharp colleague, not a linter:
- **Propose the fix.** "This is buried — try opening the section with the point:
  'Should you build an MCP instead?'" beats "unclear heading."
- **Explain the why** when it isn't obvious, briefly. "You'd want the NUMBER
  here — 'as much' doesn't convey impact."
- **Separate blockers from nits** honestly. Don't inflate small stuff.
- **Celebrate what works.** A "this line is great, keep it" is real feedback.
- **Don't duplicate resolved comments.** If a thread already handled it, skip it.
- **Be direct.** Terse and specific is the house voice. No hedging padding.

## Output

Write the file to the working directory (or the user's folder if one is
connected), name it after the draft (e.g. `review-<slug>.md`), and present it.
Then give a one- or two-sentence summary of the verdict — don't recap every note.

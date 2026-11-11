---
description: Research 10+ real, quotable examples for a Product for Engineers newsletter from a notes file
---

# Newsletter research

Find at least 10 specific, quotable, sourced examples to back up a newsletter. The user passes a notes file — a wikilink like `[[future of UI newsletter]]` or a path: $ARGUMENTS

Do NOT use subagents for the searches — run the API/grep calls directly with parallel Bash calls. It's faster and avoids permission issues. (A subagent per channel is fine only if a run returns hundreds of hits to sift.)

## Step 1: Read the notes and lock the thesis

- Resolve the argument. A `[[name]]` wikilink → `~/Documents/base/<name>.md`. A bare name → same folder. A path → use as-is.
- Read the notes file. Extract:
  - The **topic** and the **contrarian thesis** (what conventional wisdom does this challenge?)
  - The **audience takeaway** (what should a product engineer / technical founder do differently?)
  - Any companies, people, or links already named in the notes — chase these first, they're the strongest leads.
- Skim `~/Documents/posthog.com/contents/handbook/content/newsletter.md` once to keep the bar in mind: examples must be concrete, attributable, and prove a point. "It's easy to say things, examples prove them."

State the thesis back in one sentence before searching, so the examples stay on-target.

## What counts as a good example

Each example must be:
- **From a credible source.** Successful companies (raised from a tier-1 VC, went through YC, or are clearly category-defining), PostHog itself, or a recognized practitioner. Note the success signal.
- **Specific.** A named company doing a named thing — not "many startups do X."
- **Quotable.** Pull an actual sentence you can drop into the newsletter.
- **Sourced.** A real URL the reader can open. Never invent a quote or a link. If you can't find the source, drop the example.
- **On-thesis.** It either supports the contrarian take or is a sharp counterexample worth arguing against.

## Step 2: Search the channels (run in parallel)

Build 3–5 query variations from the thesis before searching. Cover the affirmative ("companies doing X"), the tension ("why X is wrong / hard"), and adjacent practitioners.

**Channels A–D and G always run in parallel. Channel E (Semble) runs as a second pass, after A, D, and G return** — it searches for links *related to ones already found*, so it needs their URLs as seeds; run it whenever `SEMBLE_API_KEY` is set. **Channel F (Slack) runs only when the topic relates to PostHog** — i.e. it's about PostHog products, how PostHog works, or a practice where PostHog engineers have first-hand experience (agents, coding workflows, dev tooling, remote work, etc.). When in doubt, run it: PostHog's internal Slack is full of named-engineer anecdotes the public channels can't surface, and those are the strongest first-party examples.

**What each channel is best at** (learned from real runs — lean on the right one):
- **Exa** → funded companies, founders, and their engineering blogs. This is the channel that surfaces the tier-1/YC success-signal sources the others miss. If you need "a successful company said X," start here.
- **Hacker News** → practitioner threads, canonical contrarian essays, and "is this real" signal via points.
- **Own web search** → named canonical essays you already half-remember, and chasing a specific person's primary source.
- **Local repos** → PostHog's own first-party published examples (the strongest, most defensible ones).
- **Semble** → links other people have already curated around your sources and topic — good for the adjacent source you wouldn't have thought to search for. Its per-link save count doubles as a credibility signal.
- **Slack (PostHog topics only)** → unpublished first-party gold: named PostHog engineers describing their actual workflow, organic adoption, and candid counterpoints. Often fills the "for example, at PostHog…" blank nothing else can.
- **Linkup** → the primary source behind a paraphrase, and pages the other channels can't read. Its `deep` mode chases "find the founder's own post, then read it" in a single call, and its `/fetch` endpoint reads the pages that 403 WebFetch (and PDFs). Broad-web, so it has no funded-company signal — pair it with Exa rather than using it instead.

### Channel A — exa.ai (successful companies, blogs, interviews)
`EXA_API_KEY` is available in the environment — just use `$EXA_API_KEY`. Run a few queries; prefer `highlights` for quotable excerpts (≈ $0.007/query). Bias toward primary sources (company engineering blogs, founder essays, interviews).

```bash
curl -s -X POST "https://api.exa.ai/search" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $EXA_API_KEY" \
  -d '{
    "query": "<natural-language query describing the example you want>",
    "type": "auto",
    "numResults": 10,
    "contents": { "highlights": true, "summary": true }
  }'
```

- For company-specific lookups, add `"category": "company"` (note: this disables date and `excludeDomains` filters).
- `"category": "news"` is good for surfacing funded-company commentary and founder interviews (e.g. it's what turned up the Sierra/Bret Taylor and Figma sources on the future-of-UI run).
- `highlights` returns the most quotable excerpts with the least token cost — use it as the default. The highlight is usually enough to decide if a source is worth a full WebFetch for the exact quote.
- If `EXA_API_KEY` is unset, tell the user and fall back to the Exa MCP tool (search `select:` via ToolSearch) or WebSearch — but flag that exa was skipped.

### Channel B — Hacker News (Algolia, no key needed)
Search both stories (the articles) and comments (where practitioners share real experience). HN points are a credibility signal — favor high-point stories and threads.

**Use `https://`, not `http://`** — the `http://` endpoint returns an empty body in this environment and the JSON parse silently fails.

**Do NOT use `numericFilters=points>N` (or `num_comments>N`).** The HN Algolia index no longer lists `points`/`num_comments` as filterable attributes, so those filters return a `{"code":400,"message":"invalid numeric attribute(points)…"}` error object with **no `hits` key** — which is why a `points>40` query silently yields nothing (the parser hits `KeyError: 'hits'`). Only `created_at_i` is still server-side filterable. So **fetch unfiltered with `hitsPerPage=30` and filter/sort by points client-side** in Python:

```bash
enc() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }
# hn <query> <story|comment> <min_points>
hn() { curl -s -m 25 "https://hn.algolia.com/api/v1/search?query=$(enc "$1")&tags=$2&hitsPerPage=30" | python3 -c "
import sys,json
mp=int('$3')
d=json.load(sys.stdin)
if 'hits' not in d:                      # API returned an error object, not results
    print('  API_ERR:', d.get('message')); sys.exit()
rows=[h for h in d['hits'] if (h.get('points') or 0)>=mp]
rows.sort(key=lambda h:-(h.get('points') or 0))
for h in rows[:8]:
    u=h.get('url') or 'https://news.ycombinator.com/item?id='+h['objectID']
    t=h.get('title') or h.get('story_title') or (h.get('comment_text') or h.get('author') or '')[:70]
    print(f\"  {h.get('points')}p | {h.get('num_comments')}c | {t} | {u}\")"; }

hn "<query>" story 40      # high-point articles (filtered client-side)
hn "<query>" comment 20    # practitioner comments for first-hand quotes
```

If a query returns junk (Algolia does loose OR-matching, so "death of the dashboard" can surface unrelated "death" stories), tighten it: append `&restrictSearchableAttributes=title` to match the title only, or use a more distinctive phrase.

When a comment looks promising, fetch the full thread to quote accurately: `curl -s "https://hn.algolia.com/api/v1/items/<objectID>"`. Quote HN comments by author + permalink.

### Channel C — local PostHog repos (for PostHog's own examples)
These are the strongest examples because they're first-party. Grep for the topic across:

```bash
# Newsletters and blog (posthog.com)
grep -rli "<keyword>" ~/Documents/posthog.com/contents/newsletter ~/Documents/posthog.com/contents/blog 2>/dev/null

# RFCs — internal (and public if checked out locally)
grep -rli "<keyword>" ~/Documents/request-for-comments-internal 2>/dev/null
grep -rli "<keyword>" ~/Documents/request-for-comments-public 2>/dev/null
```

Read the strongest matches and pull a quotable line. For posthog.com content, cite the live URL (`https://posthog.com/<path-without-contents-or-extension>`); for RFCs, cite the GitHub PR/file URL. Either RFC repo may not be checked out locally — the greps fail silently, so just skip whichever is absent.

### Channel D — your own web search
Use WebSearch to fill gaps the other channels miss — founder essays, YC company blogs, conference talks, primary interviews. Then WebFetch the page for the exact quote. Notes from real runs:
- **Go to the primary source for the verbatim quote.** Secondary news write-ups frequently *paraphrase* a founder without quotation marks (this happened with the Sierra/Bret Taylor coverage) — when a fetch returns only paraphrase, search for the person's own post, the original interview, or the publication that did the interview (e.g. TechCrunch) and quote from there.
- **WebFetch returns cross-host redirects instead of following them** (e.g. `blog.langchain.com` → `langchain.com`). When you get a redirect notice, just call WebFetch again with the redirect URL.
- **Some sites 403 WebFetch.** Try Linkup `/fetch` (Channel G) before giving up — it renders JS and handles PDFs. If that fails too, drop the source and find another for the same point.

### Channel E — Semble (related links other people have saved)
Semble surfaces links *other people* have saved that relate to your topic and to the sources the other channels already turned up — discovered through Semble's own graph, not a web search. Run it **after Exa (A) and web search (D)** so you can feed their strongest hits in as seeds for the similar-links search.

`SEMBLE_API_KEY` is available in the environment as `$SEMBLE_API_KEY`. If it's unset, tell the user Semble was skipped and move on — don't block the run.

- **Base URL:** `https://api.semble.so/xrpc`. **Auth:** `Authorization: Bearer $SEMBLE_API_KEY` on every request. Define the helper once:
  ```bash
  sget() { curl -s -G "https://api.semble.so/xrpc/$1" -H "Authorization: Bearer $SEMBLE_API_KEY" "${@:2}"; }
  ```

Two searches, run in parallel (background + `wait`):
1. **Semantic — once for the thesis.** A natural-language query built from the thesis, `limit=10`:
   ```bash
   sget network.cosmik.search.semantic --data-urlencode "query=<thesis as a search phrase>" -d "limit=10"
   ```
2. **Similar — per seed URL.** Take the 3–5 strongest URLs Exa/web already surfaced and find their neighbours, `limit=6` each:
   ```bash
   sget network.cosmik.search.getSimilarUrls --data-urlencode "url=<seed URL>" -d "limit=6"
   ```

Both return `{"urls":[{"url","metadata":{title,description,author,siteName,type},urlLibraryCount,urlConnectionCount}], ...}`.
- **Sort the whole pool by `urlLibraryCount` (how many people saved the link) and only work the top ~5 on-thesis hits.** This is the whole point of using Semble here — save count is a ready-made credibility filter, so don't hand-analyze the long tail. Pool all results, drop URLs the other channels already found and X/Twitter (can't fetch), then rank by save count and take the most-saved handful that are actually on-thesis. Skip the rest.
- Treat `urlLibraryCount` like HN points, and cite the count as the success signal when the source isn't otherwise a known name.
- A Semble hit is a **lead, not a source.** For each of the few you keep, WebFetch it for the real quote and verify it on the page (Step 3) like every other channel.

### Channel F — PostHog Slack (only when the topic relates to PostHog)
Search PostHog's Slack for named-engineer examples the public web can't surface. Use the Slack MCP tool `mcp__claude_ai_Slack__slack_search_public_and_private` (load its schema via `ToolSearch` with `select:mcp__claude_ai_Slack__slack_search_public_and_private` first; the read-thread tool `mcp__claude_ai_Slack__slack_read_thread` is useful for pulling full context on a promising hit).

- **Keep responses small.** A bare keyword search can blow past the token limit. Pass `response_format: "concise"`, `include_context: false`, and `limit: 20`. Re-run with context only on the specific threads worth quoting. (On the worktree run, a parallel detailed search exceeded the limit and had to be retried.)
- **`concise` does NOT return permalinks** — it returns a trailing `ts-like` id, not a usable URL. The default `detailed` format DOES include a `Permalink`. So: scout with `concise`, then **re-run a narrow detailed search (default format, `limit: 3-5`, `include_context: false`) for every message you intend to quote, to capture its real permalink.** Every Slack example in the output must carry a working thread link — never ship `internal (#channel)` with no URL.
- **Don't trust `from:@Name` to identify the author** — it fuzzy-matches and will silently return a *different* person with a similar name (on the 2030 run it returned "Charles Cook" for "Charles Vien" and "Cory Watilo" for "Cory Slater"). When you need a specific person's message, search by a **distinctive phrase + `in:#channel`** instead, and confirm the `From:` name on the hit matches who you're citing before quoting.
- **Run 2–3 query variations:** the affirmative keyword (e.g. `worktree`), the workflow phrasing (e.g. `running multiple agents parallel`), and a `from:@person`/`in:#channel` filter once you spot a prolific voice or the right channel.
- **Best channels are the `#team-*` and `#dev`/`#devel-random` ones** — that's where engineers describe real workflows. Threads in `#tell-posthog-anything` / `#ask-posthog-anything` also surface candid takes.
- **Quote by author + permalink.** Every result includes a `posthog.slack.com` permalink — capture it as the source.
- **Keep the full permalink, including the `?thread_ts=…&cid=…` query string.** The search tool returns the full form for threaded replies (e.g. `…/archives/C0368RPHLQH/p1780903797208479?thread_ts=1780903797.208479&cid=C0368RPHLQH`). Copy it verbatim — do NOT trim it down to the bare `…/archives/<CID>/p<TS>` form. In the Slack web app the bare form often fails to open the thread, while the full form (with `thread_ts` and `cid`) opens it reliably. If a hit comes back as a bare permalink, reconstruct the query string: `thread_ts` is the parent message's ts and `cid` is the channel ID.
- **These are INTERNAL links.** They're great as proof and to quote *with the person's permission*, but they are not public URLs. In the output, flag the Slack section clearly and note the quotes should be paraphrased (or permission obtained) before publishing — never drop a raw Slack permalink into the live newsletter.
- **Mine for counterpoints too.** Slack is candid — engineers will say what doesn't work. Those make the sharpest "argue against this" examples (e.g. PostHog migrating off worktrees toward cloud runs).

### Channel G — Linkup (primary sources, and pages nothing else can read)
Linkup is a web search API built for agents. **Read [the Linkup reference](linkup.md) before writing a query** — pick `depth` and `outputType` first, then write the query as a retrieval plan. Don't guess the API's behaviour from memory.

`LINKUP_API_KEY` must be available in the environment — use `$LINKUP_API_KEY`, never an inline key. If it's unset, tell the user Linkup was skipped and move on; don't block the run.

Define the helpers once (the trimmer is not optional — a bare `searchResults` call can return 70+ hits with 3–4k characters of page content each):

```bash
lk() { curl -s -m 180 -X POST "https://api.linkup.so/v1/$1" \
  -H "Authorization: Bearer $LINKUP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$2"; }

lktrim() { python3 -c "
import sys, json
d = json.load(sys.stdin)
rows = d.get('results') or d.get('sources') or []
if 'answer' in d: print('ANSWER:', d['answer'][:1200], chr(10) + '---')
print(f'{len(rows)} results')
for r in rows[:15]:
    print('-', (r.get('name') or '')[:90], '|', r.get('url',''))
    body = (r.get('content') or r.get('snippet') or '')[:350].replace(chr(10),' ')
    if body: print('   ', body)
"; }
```

Run two or three calls, in this order of usefulness:

1. **Facet sweep (`standard`, `searchResults`)** — one call covers the affirmative, the tension, and the practitioners. Always cap with `maxResults` (8–10):
   ```bash
   lk search '{
     "q": "Find named companies and founders who <thesis claim>. Run separate web searches for: company engineering blogs, founder essays and interviews, and practitioner counterarguments. Return the company name, the specific thing they did, a quotable sentence, and the source URL for each.",
     "depth": "standard", "outputType": "searchResults", "maxResults": 10
   }' | lktrim
   ```
2. **Primary-source chase (`deep`)** — this is what Linkup is best at here. When Exa or web search turned up a *paraphrase* of a founder, have Linkup find and read the original in one call: `"First find <person>'s own post or the original interview where they said <claim>. Then scrape it. Extract the verbatim sentence, the date, and the source URL."`
3. **Thesis pre-test (`deep`, `sourcedAnswer`)** — cheap sanity check before investing in a search: *"Which named startups have publicly said <claim>? Cite the company blog or founder post for each. If no source makes that claim, say so."* Linkup reports a null result rather than inventing one, so "nobody says this" is real signal about the thesis — note it as a gap in the output.

- **Every Linkup hit is a lead, not a source.** It searches the broad web, so SEO blogspam comes back alongside the real thing. Apply the credibility bar above unchanged, and WebFetch the page for the exact quote (Step 3).
- **Escalate, don't reword.** If a `standard` call returns junk, switch to `deep` with ordered "first … then …" wording rather than rephrasing the same search three more ways.
- **Never use date filters, and only set `includeDomains`/`excludeDomains` for a domain you can name exactly.** Don't infer a filter from "prefer primary sources" — say that in the query text instead.
- `/v1/research` (async, minutes, $0.25–$2.50 per call) is deliberately out of scope for a normal run. Reach for it only when the notes describe a topic no other channel can crack, and say in the output that a paid research call was used.

## Step 3: Verify and assemble

- **Verify quotes.** Every quote must appear on the cited page. If you pulled it from a highlight or snippet and aren't certain, fetch the URL and confirm. Drop anything you can't verify.
- **When WebFetch can't read the page, use Linkup `/fetch`** — it renders JS and handles PDFs, so it's the way to confirm a quote in an annual report, a slide deck, or a site that 403s:
  ```bash
  lk fetch '{"url":"<url>"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['markdown'][:6000])"
  ```
- **De-dupe and diversify.** Don't let one company dominate, and don't let one channel dominate. Aim for a spread: a few PostHog examples (published + Slack), several outside companies, at least one strong counterexample.
- **Keep going until ≥10 verified examples.** If a channel comes up dry, run more query variations rather than padding with weak examples.

## Step 4: Write the output

Write to `~/Documents/base/output/research-<slug>.md` where `<slug>` is derived from the notes topic (e.g. `research-future-of-ui.md`).

Structure:

```markdown
# Research: <topic>

**Thesis:** <one-sentence contrarian thesis the examples support>
**Audience takeaway:** <what the reader should do differently>
**Notes:** <path to the source notes file>

## Examples

### 1. <Company / source> — <one-line what the example shows>
- **Success signal:** <YC / tier-1 VC / category leader / PostHog / etc.>
- **The example:** <2–3 sentences on the specific, relevant thing they did>
- **Quote:** "<verbatim quotable line, ≤40 words>" — <attribution>
- **Source:** <URL>
- **How to use it:** <which part of the thesis this proves, or counters>

### 2. ...
(continue to at least 10)

## PostHog Slack — first-party voices (internal links)
(Include this section only when Channel F ran. Add a one-line caveat that these are internal `posthog.slack.com` links to paraphrase or clear before publishing. Same per-example format as above; the success signal is the engineer's name/role. **Every entry's `Source:` MUST be the full thread permalink** — `https://posthog.slack.com/archives/<CID>/p<TS>?thread_ts=<...>&cid=<CID>`, including the query string so it opens the thread — plus the `#channel` and date in parentheses. If you only have a `concise` hit with no permalink, re-run a detailed search to fetch it before writing the entry.)

## Angle suggestions
- 3–5 newsletter angles these examples unlock, each with a candidate title (≤40 chars where possible)
- Note any gaps — claims in the notes you could NOT find good examples for (so the user knows what's still unproven)
```

## Output rules
- At least 10 verified examples. More is fine if they're strong.
- Never fabricate a quote or URL. Real source or it doesn't go in.
- Keep quotes short (≤40 words) and attributed.
- Label inferences as "Inference:" — don't dress up a guess as a sourced fact.
- Prefer primary sources (company blogs, founder essays, interviews) over listicles and aggregators.
- For PostHog topics, run Slack (Channel F) and keep its examples in a clearly-labeled section with the internal-link caveat. Every Slack example must include its full thread permalink (with `?thread_ts=…&cid=…`) — no bare `internal (#channel)` references.
- Print the output file path and a one-line summary (how many examples, channel breakdown incl. Slack and Linkup, plus any channel that was skipped for a missing key) to the console when done.
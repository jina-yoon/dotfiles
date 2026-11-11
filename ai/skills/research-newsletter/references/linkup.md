---
description: How to use the Linkup web search API inside the newsletter research workflow
---

# Linkup for newsletter research

Linkup (`https://api.linkup.so`) is a web search API built for agents. In this workflow it is
Channel G in [the workflow](workflow.md). Read this file before writing a Linkup query — do not
guess its behaviour from memory.

Distilled from [LinkupPlatform/linkup-for-agents](https://github.com/LinkupPlatform/linkup-for-agents).
Fetch these upstream files when you need more than this page covers:

- `knowledge/LINKUP_API_REFERENCE.md` — endpoints, output types, auth, domain controls
- `knowledge/LINKUP_AGENT_QUERY_MENTAL_MODEL.md` — choosing the request shape
- `knowledge/LINKUP_PROMPT_OPTIMIZER_KNOWLEDGE.md` — exact depth rules, templates, bad patterns
- `knowledge/LINKUP_SPECIALIZED_ENDPOINTS.md` — when to use `/research` and `/extract`
- `workflows/marketing/content_research_brief.md` — the recipe closest to this workflow

## Credentials

Read the key from the environment as `$LINKUP_API_KEY` — never from a settings file and never
inline in a command. If it is unset, tell the user Linkup was skipped and carry on with the other
channels; do not block the run.

## Core rules (these apply to every call)

- **Optimize for retrieval, not prose.** A Linkup query is an instruction to a retrieval system.
  Make the plan obvious: what to find, where to look, which fields to extract, what counts as
  enough evidence.
- **Choose the request shape first** — `depth` and `outputType` — then write the query text.
- **Only filter sources you can name exactly.** Use `includeDomains` / `excludeDomains` solely for
  URLs or domains the user gave you or a previous result surfaced. Never infer a filter from a
  preference like "official sources", and **never use date filters** — put any time scope in `q`.
- **Never invent URLs, domains, or entities.** If a URL has to be discovered before it can be
  read, use `depth: deep` and say "first find, then scrape".
- **Preserve source URLs** on every claim, so Step 3 can verify it.
- **Use the smallest capable endpoint.** `fast`/`standard` for lookups, `deep` for
  discover-then-scrape, `/research` for a multi-source investigation that can take minutes.

## Choosing the shape

`depth`:

| Depth | Latency | Use for |
|---|---|---|
| `fast` | sub-second, keyword-only, no LLM | one simple lookup where snippets suffice. Rare here. |
| `standard` | ~1–3s, one planning turn | the default. Parallel independent searches planned upfront, or scraping a URL **already in the query**. |
| `deep` | ~5–30s, up to 10 iterations | sequential work — find the source, then read it; verify a claim across several discovered pages. |

`standard` cannot reliably discover a URL and then scrape that discovered URL in the same request.
If the query needs "find X then read X", use `deep` or split it into two calls.

`outputType`:

- `searchResults` → `{results: [{name, url, content, favicon, type}]}`. The default for this
  workflow: you want to judge sources yourself.
- `sourcedAnswer` → `{answer, sources: [{name, url, snippet}]}`. Good for a quick "has anyone
  actually said this?" check before committing to a search. It reports when it found nothing rather
  than inventing a source — a null answer is a real signal about the thesis, not a failed call.
- `structured` → JSON matching `structuredOutputSchema` (required). Use when you want a clean table
  of examples rather than pages to read.

## Token discipline

**Always pipe Linkup through a trimmer.** A `searchResults` call can return 70+ results, each with
3–4k characters of page content — enough to swallow the context window in one call. Cap with
`maxResults` (5–10 is plenty per query) and print only what you need to triage.

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

## Query templates

Write the query as a retrieval plan. Name the target, the retrieval action, the scope, the fields,
and the evidence rule.

**Independent facets (`standard`)** — the workhorse. One call covers the affirmative, the tension,
and the practitioners:

```bash
lk search '{
  "q": "Find named companies and founders who <thesis claim>. Run separate web searches for: company engineering blogs, founder essays and interviews, and practitioner counterarguments. Return the company name, the specific thing they did, a quotable sentence, and the source URL for each.",
  "depth": "standard",
  "outputType": "searchResults",
  "maxResults": 10
}' | lktrim
```

**Discover then read (`deep`)** — when you know the person or company but not the page:

```bash
lk search '{
  "q": "First find <person>'"'"'s own post or the original interview where they said <claim>. Then scrape it. Extract the verbatim sentence, the date, and the source URL. If the page links to a fuller write-up, scrape that too.",
  "depth": "deep",
  "outputType": "searchResults"
}' | lktrim
```

This is the fix for the recurring "the news write-up only paraphrases the founder" problem in
Channel D — `deep` chases the primary source in one call.

**Does anyone actually claim this? (`sourcedAnswer`)** — cheap thesis pre-test:

```bash
lk search '{
  "q": "Which named startups have publicly said <thesis claim>? Cite the company blog or founder post for each. If no source makes that claim, say so.",
  "depth": "deep",
  "outputType": "sourcedAnswer"
}' | lktrim
```

**Structured example table (`structured`)** — when you want rows, not reading:

```bash
lk search '{
  "q": "Find companies that <thesis claim>. For each: company name, what they specifically did, a verbatim quotable line, and the source URL.",
  "depth": "deep",
  "outputType": "structured",
  "structuredOutputSchema": {
    "type": "object",
    "properties": {
      "examples": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "company": {"type": "string"},
            "what_they_did": {"type": "string"},
            "quote": {"type": "string"},
            "source_url": {"type": "string"}
          }
        }
      }
    }
  }
}' | python3 -c "import sys,json;print(json.dumps(json.load(sys.stdin),indent=2)[:4000])"
```

A `structured` quote is still a **lead, not a verified quote**. Confirm it on the page (Step 3)
before it goes in the output.

## Reading a page: `/fetch`

`POST /v1/fetch` with `{"url": "..."}` returns `{markdown, favicon}` — clean Markdown, with JS
rendering and PDF support.

```bash
lk fetch '{"url":"<url>"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['markdown'][:6000])"
```

**Use this as the fallback whenever WebFetch fails** — the 403s and the cross-host redirects called
out in Channel D. It is also the reliable way to pull the exact sentence out of a PDF (annual
reports, conference slides) for Step 3 verification.

## `/research` — only when the topic is cold

`POST /v1/research` is an asynchronous agent that runs for **minutes** and costs $0.25–$2.50 per
call, set by `reasoningDepth` (`S`/`M`/`L`/`XL`). Set `mode` explicitly: `answer` for one precise
verifiable question, `investigate` for one entity in depth, `research` for a broad landscape.

Skip it for a normal run — Channels A–G plus a couple of `deep` calls get to ten examples faster
and cheaper. Reach for it only when the notes describe a topic none of the other channels can
crack, and say in the output that a paid research call was used.

## Caveats learned from real calls

- **Linkup searches the broad web, so it returns SEO blogspam alongside the good stuff.** It has no
  equivalent of Exa's funding/company signal — for "a successful company said X", still start with
  Exa (Channel A) and use Linkup for the primary-source chase and the pages WebFetch can't read.
- Every hit is a lead. The credibility bar in Step 2 ("What counts as a good example") applies
  unchanged: named company, success signal, verbatim quote, working URL.
- Escalate rather than reword. If a `standard` call returns junk, the fix is usually `deep` with
  ordered "first … then …" wording, not the same search phrased three more ways.
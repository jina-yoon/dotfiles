# X recipes, queries, and sources

Everything here is a direct URL navigation. Never type into X's search box — build
the URL and navigate to it.

## Jina's List

```
LIST_ID: 1883934942175854910
URL:     https://x.com/i/lists/1883934942175854910
```

This is @dejavucoder's "ai team" list. To find a different one's ID: open the List
on x.com and read it out of the address bar.

**Known bias:** this List is almost entirely AI/LLM accounts. A run against it
alone produces an all-AI brief — frontend, databases, and general product
engineering do not appear. Hacker News is currently carrying that load. If Jina
wants the newsletter's non-AI surface covered from X, say so and suggest adding
15–20 accounts who post about shipping product rather than about models.

**If this is unset**, run searches only and tell Jina at the end that a curated
List is the single biggest quality upgrade available, and offer to help build one.

### Building the List (one-time, ~15 minutes)

Aim for **40–80 accounts**. Fewer than 30 and it's too thin to show consensus;
more than 100 and it's the For You feed again. Criteria for including someone:

- They ship things and talk about the shipping, not the strategy.
- They post their own opinions rather than reposting others'.
- They'd disagree with at least one other person on the List. Homogeneity is the
  failure mode — a List where everyone agrees will never surface an argument.

Starter names, all long-standing developer accounts. **Verify each before adding**
— people move to Bluesky and Mastodon, go quiet, or change handles, and this list
is a starting point rather than a vetted roster:

`@simonw` `@b0rk` `@antirez` `@mitchellh` `@rauchg` `@GergelyOrosz` `@karpathy`
`@dan_abramov` `@jessfraz` `@patio11` `@tenderlove` `@swyx` `@kentcdodds`

Better sources than any list I can give you: the people Jina already replies to,
the bylines on posts that made it into past newsletter issues, and the handles that
keep showing up in the search sweeps below. Add the recurring ones after each run.

## Reading a timeline — the harvest loop

These four facts are load-bearing. All were established by testing against a live
logged-in session; don't rediscover them the hard way.

1. **`get_page_text` returns exactly one post.** It targets the first `<article>`
   element. It is useless for timelines. `read_page` does return every rendered
   post, but truncates post text at ~100 characters.
2. **`window.scrollBy()` does not drive X's virtualizer.** `scrollY` increases,
   but the timeline stops rendering and you end up staring at a blank page with
   the same 11 posts still in the DOM. You must use `computer` → `scroll`, which
   sends real wheel events.
3. **Navigation wipes injected functions.** Re-inject the harvester after every
   `navigate`.
4. **Keep any single `javascript_tool` call under ~40 seconds.** The CDP bridge
   times out at 45s, and a long scroll-and-wait loop inside one call will blow it.
   Put the waiting in `computer` actions instead.

The loop that works, batched with `browser_batch`:

```
navigate → wait 4s → inject harvester + grab
  → computer scroll (down, amount 10) → wait 2s → __grab()
  → computer scroll (down, amount 10) → wait 2s → __grab()
  → ... 3–4 rounds for a search, ~10 for the List
  → dump
```

The harvester. Inject this after each navigation; it dedupes by status ID into
`window.__h`, so calling `__grab()` repeatedly just accumulates:

```js
window.__h={};
window.__grab=function(){
  let n=0;
  document.querySelectorAll('article').forEach(a=>{
    const link=[...a.querySelectorAll('a[href*="/status/"]')]
      .find(l=>/^\/[^/]+\/status\/\d+$/.test(l.getAttribute('href')||''));
    if(!link) return;
    const m=link.getAttribute('href').match(/^\/([^/]+)\/status\/(\d+)/);
    if(!m||window.__h[m[2]]) return;
    const time=a.querySelector('time');
    const txt=a.querySelector('[data-testid="tweetText"]');
    const grp=a.querySelector('[role="group"]');
    window.__h[m[2]]={
      h:m[1],
      t:time?time.getAttribute('datetime').slice(0,10):null,
      x:txt?txt.innerText.replace(/\s+/g,' ').slice(0,400):'',
      e:grp?(grp.getAttribute('aria-label')||''):'',
      u:'https://x.com/'+m[1]+'/status/'+m[2],
      l:[...a.querySelectorAll('a[href^="https://t.co"]')]
        .map(z=>z.innerText.replace(/\s+/g,'')).filter(Boolean).slice(0,1)
    };
    n++;
  });
  return n;
};
window.__grab();
```

Dump with:

```js
JSON.stringify(Object.values(window.__h).map(p=>[p.h,p.t,p.e,p.x,p.l[0]||'']))
```

The `e` field is the engagement aria-label — "974 replies, 342 reposts, 3978
likes, 3324116 views". Keep it. The reply-to-like ratio is the best argument
detector available, and it's free.

If a dump comes back truncated, re-dump with a shorter `slice()` on the text or
map to fewer fields.

**Depth expectations.** On an active List, ~10 scroll rounds covers roughly six
hours and yields ~30 posts. Scrolling a week is not feasible. Searches cover the
window; the List covers today.

The **Following** tab has no stable URL — it's a client-side tab. Navigate to
`https://x.com/home`, `find` "Following tab", click it. Only worth it if the List
is unset.

## Search URL format

```
https://x.com/search?q=<URL-ENCODED QUERY>&f=live
```

- `f=live` → Latest, chronological. Use this for windowed sweeps.
- `f=top` → Top, engagement-ranked. Use when you want the loudest take on a topic.
- URL-encode the query: spaces → `%20`, `"` → `%22`, `:` → `%3A`, `#` → `%23`.

### Operators that work (verified for 2026)

| Operator | Does |
|---|---|
| `min_faves:N` | at least N likes — your main noise filter |
| `min_retweets:N` | at least N reposts |
| `min_replies:N` | at least N replies — good proxy for *argument* |
| `-filter:replies` | exclude replies |
| `-filter:retweets` | exclude reposts |
| `filter:links` | only posts containing a URL |
| `since:YYYY-MM-DD` / `until:YYYY-MM-DD` | date range |
| `from:handle` | one account |
| `url:domain.com` | posts linking to a domain |
| `lang:en` | English only |

Dead: `near:`, `within:`, `geocode:`, `source:`, `min_followers:`.

**`list:<id>` does not work.** It's widely documented as a valid operator, and it
returns a clean "No results" every time — tested against a List that was actively
serving posts in the UI at that moment. Don't build a query around it and don't
report its emptiness as "the List was quiet." Scroll the List UI instead.

**Scope every query to dev.** Bare phrase queries leak badly — `"hot take"` alone
returns anime fan accounts and Marvel plot leaks well above the `min_faves` floor.
Always pair the phrase group with a topic group (`agents OR LLM OR engineers OR
Postgres OR React …`). Expect maybe 60% relevance even then; discard the rest
without comment.

### Threshold guidance

`min_faves` is the dial that decides whether you drown or starve.

- Broad topic (AI tooling, LLMs): **300–500**
- Normal dev topic (databases, TypeScript, testing): **150–250**
- Niche topic or a specific tool's name: **40–80**

If a query returns nothing, halve the threshold once and retry. If it returns
hundreds of near-identical engagement-bait posts, double it.

## The standard sweep

Substitute the window start date for `<SINCE>`. Run these against `f=top` — with a
`min_faves` floor, Top surfaces the window's best posts immediately, where Latest
buries them under volume. Queries 1 and 2 below are the two that earned their keep
on the first live run.

**1. Arguments — the highest-value query.** High replies relative to likes means
people are disagreeing, not applauding.

```
(agents OR LLM OR "coding agent" OR engineers OR developers) ("hot take" OR "hard disagree" OR overrated OR "unpopular opinion" OR "everyone is wrong") min_faves:200 -filter:replies lang:en since:<SINCE>
```

**2. Migrations and reversals.**

```
("moved off" OR "migrated from" OR "switched from" OR "ripped out" OR "went back to" OR "replaced our") (Postgres OR React OR AWS OR Cursor OR Claude OR Copilot OR TypeScript OR Kubernetes OR agents OR Codex) min_faves:80 -filter:replies lang:en since:<SINCE>
```

**3. Regret and retrospect — where the real lessons live.**

```
("in hindsight" OR "wish we had" OR "biggest mistake" OR "would not do again" OR postmortem) min_faves:150 -filter:replies lang:en since:<SINCE>
```

**4. AI/agent tooling in practice**, filtered to people using it rather than
announcing it.

```
(agents OR "coding agent" OR "context window" OR evals OR MCP) ("in production" OR "we shipped" OR "we tried" OR "we replaced") min_faves:250 -filter:replies lang:en since:<SINCE>
```

**5. Product engineering practice.**

```
("product engineer" OR "shipping fast" OR "feature flags" OR "we deleted" OR "rewrote our") min_faves:150 -filter:replies lang:en since:<SINCE>
```

**6. Technique write-ups.**

```
("how we" OR "what I learned" OR "deep dive" OR "under the hood") filter:links min_faves:200 -filter:replies lang:en since:<SINCE>
```

**7. Traction check, not launch noise** — a week after a tool ships, who's still
talking about it.

```
("been using" OR "week with" OR "replaced my" OR "actually good") min_faves:200 -filter:replies lang:en since:<SINCE>
```

**8. Chase the story you found.** After the sweep, one theme will usually be
clearly biggest. Run a targeted query on it — this is where the disagreement
actually lives, and it's what separates a brief from a link list:

```
("<the thing>" OR <related term>) min_faves:100 -filter:replies lang:en since:<SINCE>
```

Doing this on the dominant story is what surfaces the split between wire-service
amplification and practitioner pushback. Worth the extra page load every time.

### Topic-specific runs

When Jina asks about one thing ("what's the discourse on <tool>?"), skip the sweep
and build three queries instead:

```
"<tool>" min_replies:25 -filter:replies since:<SINCE>          → the argument
"<tool>" ("moved off" OR "switched to" OR "replaced") since:<SINCE>   → direction of travel
"<tool>" filter:links min_faves:80 since:<SINCE>               → the artifacts
```

Run the first at `f=top` as well as `f=live` — for a single topic you want the
loudest take, not just the latest.

## Off-platform cross-checks

No browser needed — use `WebFetch`.

### Hacker News (Algolia API, free, no key)

Front-page-grade stories in the window (`>` must be encoded as `%3E`):

```
https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points%3E150,created_at_i%3E<UNIX_TS>&hitsPerPage=60
```

Search a specific topic across the window:

```
https://hn.algolia.com/api/v1/search?query=<TOPIC>&tags=story&numericFilters=created_at_i%3E<UNIX_TS>&hitsPerPage=40
```

Get `<UNIX_TS>` with `date -d '7 days ago' +%s`. Verified working — returns JSON
with `nbHits` and a `hits` array carrying `title`, `url`, `points`, `objectID`.

The comments are often better signal than the post. For a story worth reporting,
fetch `https://news.ycombinator.com/item?id=<objectID>` and read what people
actually objected to.

### GitHub Trending

```
https://github.com/trending?since=weekly
https://github.com/trending/python?since=weekly
https://github.com/trending/typescript?since=weekly
```

Use it to check whether talk translates into stars, and to catch tools with real
traction that never made it to the timeline.

### Optional additions

- `https://lobste.rs/top/1w` — smaller, less hype-driven than HN
- `https://www.reddit.com/r/ExperiencedDevs/top.json?t=week&limit=40` — practitioner
  grumbling, good for catching things X is too polite to say

## Cadence note

Weekly is the right rhythm — daily is mostly noise, monthly and you're reading
history. If Jina wants this automatic, it needs the desktop app open when it fires,
so a weekday-morning schedule works and an overnight one does not.

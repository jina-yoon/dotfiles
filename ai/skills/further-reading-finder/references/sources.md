# Source fetch recipes

Exact ways to pull each source. Reach for `web_fetch` where an API or feed exists
(precise, dated, filterable); fall back to `WebSearch` where it doesn't. Never use
curl/wget/bash to fetch URLs — use the `web_fetch` and `WebSearch` tools.

First, get the window's start as a Unix timestamp. If the window is "last 14 days,"
that's `now - 14*86400`. You can compute it with `date -d '14 days ago' +%s` in bash
(computing a number is fine; just don't fetch URLs from the shell).

---

## Hacker News — reliable, via web_fetch

Use the Algolia HN Search API. It supports date and points filters, so you can grab
high-signal stories from the window in one call.

```
https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=created_at_i>START_TS,points>100&hitsPerPage=50
```

- Replace `START_TS` with the window-start Unix timestamp.
- `points>100` keeps you to stories the community actually rated. Lower to `>75` if a
  quiet window returns too little; raise to `>200` if you're flooded.
- Response is JSON. For each hit you care about: `title`, `url` (external link;
  null for Ask/Show text posts — use `https://news.ycombinator.com/item?id=OBJECTID`
  then), `points`, `num_comments`, `objectID`, `created_at`.
- Also worth a second call with `tags=show_hn` for tools/projects specifically.
- High comment counts on a technical piece often mean a good discussion worth the
  reader's time — note it, but don't let pure controversy (drama, outrage) sneak
  something past the hard-reject filter.

## PostHog blog — read from the repo, not the RSS feed

Do NOT use `https://posthog.com/rss.xml` — it comes back gzipped/binary through the
fetch tool and silently fails. Read the blog posts from the `PostHog/posthog.com`
repo instead, where every post is a markdown file with an authoritative `date:` in
its frontmatter. Two ways in; prefer the first.

**Primary — the local clone (what Jina asked for).** The repo is cloned on her
machine (default path `~/posthog.com`; the handbook source files live under
`~/posthog.com/contents/`). Pull the latest, then find posts published in the window:

```bash
git -C ~/posthog.com pull --ff-only
# blog posts are individual .md / .mdx files here:
git -C ~/posthog.com log --since="WINDOW_START" --diff-filter=AM \
  --name-only --pretty=format: -- contents/blog/ \
  | grep -E 'contents/blog/.*\.mdx?$' | sort -u
```

That lists blog files added or modified in the window. Open each one, read the
frontmatter `date:` and `title:`, and keep the posts whose `date:` is actually inside
the window (a file can be touched by an edit commit without being newly published).
Read enough of the body to judge whether it teaches something, then annotate. Running
git and reading files is fine — this is local, not a URL fetch.

If `~/posthog.com` isn't where the repo lives, check for it under the selected
project folder or ask Jina for the path once, rather than guessing repeatedly.

**Fallback — the GitHub repo over the API** (use only if no local clone is reachable).
`web_fetch` these; both return JSON:

```
# commits that touched the blog dir since the window start:
https://api.github.com/repos/PostHog/posthog.com/commits?path=contents/blog&since=WINDOW_START_ISO&per_page=20
# a specific post's raw markdown (read its frontmatter date + body):
https://raw.githubusercontent.com/PostHog/posthog.com/master/contents/blog/<slug>.md
```

From the commits response, collect the added `.md`/`.mdx` paths under
`contents/blog/`, fetch each raw file, confirm the frontmatter `date:` is in-window,
and annotate. This avoids the RSS feed entirely.

Whichever path you use: include the posts that teach something (engineering
deep-dives, product-eng lessons, hard-won write-ups), skip release notes, changelog
posts, and company updates.

## Reddit — do a real pass, via WebSearch (+ fetch the linked article)

Reddit's own JSON and HTML are blocked to the fetch tool, so you can't read threads
directly — but that's not a reason to phone it in. Reddit surfaces good long-form
writing that never hits HN, and Jina wants genuine coverage here. Work it properly:

1. **Run a broad sweep, not one query.** Search each of these subreddits, and add the
   current month/year to bias toward fresh threads:
   `r/programming`, `r/ExperiencedDevs`, `r/webdev`, `r/devops`, `r/rust`,
   `r/golang`, `r/MachineLearning`, `r/LocalLLaMA`, `r/datascience`, `r/SoftwareEngineering`.
   Example queries (run several — vary the intent):
   - `site:reddit.com/r/ExperiencedDevs <Month Year>`
   - `site:reddit.com/r/programming <Month Year> (deep dive OR postmortem OR "how we")`
   - `site:reddit.com/r/LocalLLaMA <Month Year> (guide OR benchmark OR "lessons")`
   - `reddit r/devops best of <Month Year>`
2. **Chase the underlying article, not the thread.** Most high-value Reddit posts link
   out to a blog/write-up. From the search result title, identify that article, then
   `WebSearch` or `web_fetch` the article itself (it's usually not reddit-hosted, so it
   fetches fine) and judge *it* against the good-pick criteria. Self-posts
   ("text posts") that are pure discussion rarely make good newsletter links — skip
   unless the discussion itself is the value.
3. **Aim to actually surface 2-4 Reddit-originated candidates** that HN didn't already
   have. If after a genuine multi-query pass there truly is nothing, say so and show
   the queries you ran — but don't declare it thin after a single search.

## X / developer Twitter — do a real pass, via WebSearch

X is the hardest source and results are noisy, but "hard" isn't "skip." Put in a
structured effort and report what you actually tried.

1. **Search by topic AND by author.** Take the 4-5 topics/tools that are hot on HN
   this window and search each with an X scope, e.g.
   `<topic> (site:x.com OR site:twitter.com) <Month Year>` and
   `<topic> developer thread`.
2. **Check high-signal dev accounts** who reliably post teaching threads — search their
   handles plus the window, e.g.
   `simonw`, `antirez`, `karpathy`, `swyx`, `kelseyhightower`, `mitchellh`, `rakyll`,
   `b0rk` (Julia Evans), `eatonphil`, `thorstenball`. Query like
   `simonw x.com <Month Year>` and look for a substantive thread or linked post.
3. **Prefer threads that link to or amount to a real write-up.** A good X find is
   usually a thread that teaches something or points to one — verify by fetching the
   linked piece where possible.
4. If a real pass genuinely turns up nothing linkable, say so and list the searches
   you ran. The bar is: Jina should be able to see you actually looked.

## Slack — highest signal, needs the connector

Channels: `#dev-ai`, `#devel-random`, `#industry-news`.

If the Slack tools are available (e.g. `slack_search_public`, `slack_read_channel`):

- Search each channel for messages in the window that contain links
  (`has:link` style queries, or read the channel and extract URLs).
- A link a teammate shared already passed a human filter, so weight these highly —
  but still apply the hard-reject rules (someone may have shared a funding headline).
- Capture who shared it and any comment they made; that context helps Jina.

If the Slack tools are NOT available, skip Slack and note at the end of the run that
the connector needs authorizing. Don't block the rest of the run on it.

---

## De-duplication

The same URL routinely appears on HN, Reddit, and Slack. Normalize URLs (strip
tracking params, trailing slashes) and merge. When a link shows up in multiple
sources, keep one entry and list all the sources — cross-source interest is a genuine
signal it's worth the reader's time.

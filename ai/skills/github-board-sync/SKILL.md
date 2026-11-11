---
name: github-board-sync
description: Find recent GitHub issues and PRs that belong on Jina's personal project board ("Jina's Stuff", PostHog org project 217) and add them via Chrome. Use when she asks what's missing from her board, to sync or top up her board, or to catch up on issues and PRs assigned to or awaiting review from her.
---

# GitHub board sync

Find GitHub issues and PRs that belong on Jina's personal project board and add them.

**The board:** "Jina's Stuff" – org project 217 in the PostHog org.
`https://github.com/orgs/PostHog/projects/217/views/1`
Jina's GitHub login is `jina-yoon`.

## 1. Find candidates (GitHub MCP tools, not the gh CLI)

Get today's date (`date -u +%Y-%m-%d`) and compute `CUTOFF` as today minus 7 days, unless the user asks for a different window. Run these four searches:

1. **Issues she created** – `search_issues`:
   `is:issue is:open author:jina-yoon org:PostHog -project:PostHog/217 created:>=CUTOFF`
2. **PRs she created** – `search_pull_requests`:
   `is:pr is:open author:jina-yoon org:PostHog -project:PostHog/217 created:>=CUTOFF`
3. **PRs awaiting her review personally** – `search_pull_requests`:
   `is:pr is:open user-review-requested:jina-yoon org:PostHog -project:PostHog/217 updated:>=CUTOFF`
4. **Issues assigned to her she didn't create** – `search_issues`:
   `is:issue is:open assignee:jina-yoon -author:jina-yoon org:PostHog -project:PostHog/217 updated:>=CUTOFF`

`-project:PostHog/217` is what excludes items already on the board. It is verified to work – trust it. The 7-day window exists so a missed run self-heals; the project filter does the real work.

**Search 4 filters on `updated:`, not `created:`, on purpose.** Someone can assign her a months-old issue today, and assignment bumps the updated timestamp. `created:` would silently miss exactly the case the search exists for. `-author:jina-yoon` prevents double-counting items from search 1.

**Critical on search 3:** use `user-review-requested:`, never `review-requested:`. Jina is in the `PostHog/editors` team, and `review-requested:jina-yoon` also returns every PR requested from that team, which she explicitly does not want on her board. Verified at setup: `review-requested:` returned 2 team-requested PRs, `user-review-requested:` correctly returned 0.

Request only the fields you need (number, title, html_url, created_at, state, repository_url).

If all four return zero, say so in one line and stop. Don't open a browser, don't run extra verification queries. A zero result is the normal outcome on a quiet day.

## 2. Add them to the board via Chrome

Only if there is at least one candidate. Invoke the `claude-in-chrome` skill first, then load the browser tools in a single ToolSearch call.

1. New tab → `https://github.com/orgs/PostHog/projects/217/views/1`
2. Screenshot to confirm the board loaded (title "Jina's Stuff", a table view, bottom row reading "You can use Control + Space to add an item").
3. For each candidate:
   - `ctrl+space` to open the add-item input at the bottom of the table
   - type `#` – a repository picker appears
   - type the repo name to filter, select it, then the issue/PR number or a distinctive phrase from the title, and select the item
   - screenshot and confirm the new row has the right title and number before moving on
4. Screenshot the full board once, close the tab you created.

**Never press Enter on a raw pasted URL.** If it fails to resolve, GitHub creates a junk draft item titled with the URL. Always use the `#` repository-picker path.

## Fallback – this matters

The final "commit the add" keystroke may be refused by a permission classifier, and the browser bridge only works while Chrome is running. If the browser is unreachable, or an add is blocked or fails twice, **stop automating**. Do not retry in a loop. Output the items that still need adding – title, number, repo, full URL, one per line, grouped as "Created by you", "Review requested from you", "Assigned to you" – so she can add them with two clicks. A clear list is a fine outcome; a silent failure is not.

If the GitHub tools return auth errors, say so plainly and tell her to reconnect the GitHub connector in claude.ai under Customize → Connectors. Do not fall back to the `gh` CLI – its token in this environment is not valid.

## Report

How many items were found, which were added (with numbers), which still need manual adding and why. A few lines.

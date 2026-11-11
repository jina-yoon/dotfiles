---
name: work-log-update
description: Update Jina's living work log at ~/misc/work-log.md – append this week's evidence-linked entry and rewrite the themed bullets from the whole log. Use when she asks to update her work log, log the week, record what she shipped, or refresh the bullets she keeps for performance and review conversations.
---

# Work log update

Update Jina's living work log for a sprint week. Treat each run as standalone – read the file, don't assume what a previous run did.

## The file

`~/misc/work-log.md` on her Mac. In `device_bash` that is `$HOME/mnt/misc/work-log.md`. If the folder isn't connected, try `device_list_dir` on `/Users/jinayoon/misc`. If you still can't reach it, **do all the work anyway** and print the full entry and updated bullets in your output so nothing is lost – say clearly at the top that the file couldn't be written.

Two sections:

- `## Log` – append-only, newest entry first, one per sprint week. Never edit or delete existing entries.
- `## Bullets` – resume-style bullets grouped by theme, rewritten from scratch each time from the whole log.

Read the existing file before changing anything.

**Naming constraint:** the word "resume" must not appear anywhere in `work-log.md`. Call it a work log. (Use the word freely in your output to her.)

## 1. Work out the window

Default to the sprint week ending on the most recent Friday – that Monday through Friday. Get today's date with `date`. Only count work in that window unless she names a different one.

## 2. Gather evidence (read-only – never post, comment, or edit on GitHub or Slack)

Jina is `jina-yoon` on GitHub. Her work is editorial: PostHog's "build mode" newsletter (formerly Product for Engineers), blog posts, docs/handbook pages. Teammates: Ian Vanagas (editorial lead), Andy Vandervell (marketing lead), Liam Graham (social), Natalia Amorim (content).

These methods are verified in this environment – use them, don't waste time on the noted alternatives:

1. **Pull requests** – `search_pull_requests` accepts classic GitHub search syntax:
   `involves:jina-yoon repo:PostHog/posthog.com repo:PostHog/marketing updated:>=<monday>`
   Request only what you need (number, title, state, html_url, repository_url, updated_at). Open anything significant with `pull_request_read` to see whether it merged and what it was.
2. **Issues** – `search_issues` is semantic-only here and does **not** understand `involves:`; it returns nothing. Use `list_issues` with `owner: PostHog`, `repo: marketing` (then `repo: company-internal`), `since: <monday>T00:00:00Z`, `orderBy: UPDATED_AT`, `direction: DESC`, and filter yourself for `user.login` or `assignees` = `jina-yoon`.
3. **Slack** – `slack_read_channel` on `C09GU689J1X` (#team-editorial). Do **not** pass `oldest` – it returns wrong results. Page from newest with `cursor`, stop once past Monday. Her own messages are the strongest signal: drafts shared, things shipped, issues filed, OOO notes.
4. **Sprint issue** – `PostHog/company-internal` has weekly `[SPRINT] Editorial {start} - {end} {year}` issues. Find the week's, and read her own comment if she posted one – it states what she planned, which helps judge what actually landed.

The `gh` CLI is not installed. Gist writes and repo creation are blocked. MCP tools only.

## 3. Append the log entry

Prepend directly under the `<!-- New entries go directly below this line, newest first. -->` comment:

```
### Aug 17–21, 2026

- shipped build mode #47 "This post will save you tokens" – wrote, ran editorial review, scheduled ([posthog.com#19578](url))
- filed art request for context engineering hero image ([marketing#246](url))
```

Rules:

- Every bullet carries a real link. Prefer full GitHub URLs.
- Be specific and concrete – counts, issue numbers, titles. Specifics are the whole point; they're what a later run needs.
- Include the small stuff. The log is not a highlight reel, it's the record.
- Anything you believe but can't verify from a link: mark `[unverified]` inline. Never invent a plausible detail – write `TODO`.
- Note outcomes that arrived this week for *earlier* work (a post going live, a number reported in Slack), and link them, even if the work was weeks ago.
- If the week is genuinely empty (holiday, OOO), write a one-line entry saying so rather than padding.

## 4. Rewrite the bullets

Rewrite the whole `## Bullets` section from the full log, not just this week. Group by theme – Newsletter, Blog and long-form, Tooling and process, Cross-team. Under each, bullets that read as accomplishments: what she owns, what she built or changed, what happened as a result. Concrete numbers where the log supports them, keep the link for anything specific.

Keep them honest. A bullet is only as strong as the log evidence under it – no inflation, no "spearheaded". If the evidence supports a modest claim, make the modest claim. Carry `[unverified]` markers up into a bullet if that's what the evidence says.

Style for both sections: clean prose, en dashes (–) never em dashes, no marketing language.

## 5. Write and report

Write the file back with `device_bash`. Then briefly: how many log bullets you added, which bullets changed and why, anything you couldn't verify and want her to confirm. Short.

The only write in this whole skill is `work-log.md`. Do not post anything anywhere.

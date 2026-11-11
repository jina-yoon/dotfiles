---
name: editorial-sprint-issue
description: Create the weekly "[SPRINT] Editorial" GitHub issue in PostHog/company-internal for an upcoming work week. Use when Jina asks to open, create, or file the editorial sprint issue, or says the sprint issue for next week is missing. Creates the issue only – it never writes her sprint comment (that is my-sprint-update).
---

# Editorial sprint issue

Create the weekly `[SPRINT] Editorial` issue in `PostHog/company-internal` for a work week, using the GitHub MCP tools.

**Only create the issue.** Never write or post Jina's sprint comment – she writes that herself, and the `my-sprint-update` skill drafts it. Do not add any comments to the issue.

## 1. Work out the target week

Get today's date. Unless the user names a different week, the target is the **next** Monday through the following Friday. (Run on a Friday, that is today + 3 through today + 7.) That Mon–Fri range is the week the new issue covers.

## 2. Check for duplicates first

Search `PostHog/company-internal` for issues whose title starts with `[SPRINT] Editorial`, sorted by created desc, and look at the most recent few. If any existing issue already covers the target week's dates, **stop** – a teammate already made it. Report the existing issue number and URL and that you skipped creation.

## 3. Create it

Title format matches the existing series exactly:

- Same-month range: `[SPRINT] Editorial September 7 - 11 2026`
- Crossing months: `[SPRINT] Editorial August 31 - September 4 2026`

Full month name, no comma before the year, no leading zeros on days.

Find the most recent previous `[SPRINT] Editorial` issue. Copy its **labels and assignees** onto the new one so they stay current – do not hardcode them. (At setup these were labels `marketing`, `sprint`; assignees `ivanagas`, `andyvan-ph`, `natalia-amorim`, `jina-yoon`, `liamg-posthog`, but use whatever the latest issue actually has.) You will also link to it as the previous sprint issue.

Body must be exactly this, with `{PREVIOUS_ISSUE_URL}` filled in, including the fenced code block:

````
Please add your notes as comments using the template below (don't edit this in case someone else is editing at the same time!)

Previous sprint GitHub issue: {PREVIOUS_ISSUE_URL}

```
## Retro

- How did the sprint go? {Rating out of 10 and a description why you've given that rating}

### Progress update

- [ ] ...
- [ ] ...
- [ ] ...

## Next Sprint

**Focus:** (Optional field about your main focus this week)

> A bullet point for each key thing you'll be working on and anything important that others should know e.g. being on holiday.

- [ ] ...
- [ ] ...
- [ ] ...

### Updates, questions, and requests

> Update people on things you're working on, ask a question, or request help/feedback

- ...
```
````

## 4. Report

The new issue's title, number, and URL – or, if you skipped, which existing issue already covered the week. Keep it short.

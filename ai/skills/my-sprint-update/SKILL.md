---
name: my-sprint-update
description: "Draft the user's weekly editorial sprint comment for PostHog/company-internal — close out the ending sprint (retro with evidence-based checkmarks) and plan the week ahead. Use this whenever the user mentions the editorial sprint, their sprint comment or sprint update, Friday sprint prep, closing out the sprint/week, drafting their retro, or prepping for the Monday editorial meeting — even if they just say \"do my sprint prep\" or \"help me with my sprint\". Produces a draft for review; never posts to GitHub without explicit approval.\n"
compatibility: Requires `gh` CLI authenticated with access to PostHog/company-internal, and the Slack MCP tools (read-only use). Uses the Google Drive MCP tools for Google Docs evidence when they're connected (they are in Cowork; usually not in Claude Code) – the skill works without them, just with a blind spot.
metadata:
  cowork: true
---

# Editorial Sprint Prep

## The job and its timing

The editorial team's sprint runs Monday–Friday. The sprint *meeting* is Monday
morning; the user (Jina) preps on **Friday afternoon** for the *following*
Monday. This means the Friday run is not a Friday retro – it's Monday-meeting
prep, delivered as one artifact: the user's comment on the sprint issue, with
two halves:

1. **Close out the ending sprint**: a retro – how the week went, which planned
   items got done, what carries over.
2. **Plan the week ahead**: the next-sprint section.

The comment is drafted for the user to review in chat. **Nothing is posted to
GitHub until the user explicitly approves.** If you're running
non-interactively and can't get approval, stop at the draft.

This skill does NOT create the weekly sprint issue itself. A scheduled task
("Create weekly Editorial sprint issue") now creates the *upcoming* week's
issue automatically every **Friday at 4pm PT**, so by prep time it usually
already exists (if the user preps before 4pm on Friday it may not be up yet).
This skill only drafts and (on approval) posts the user's comment.

## House format (learned from real issues – don't invent sections)

Each team member posts their own comment on the sprint issue (usually Monday
morning) following the template embedded in the issue body:

```
## Retro

- How did the sprint go? {rating}/10, {short reason}

### Progress update

- [x] item that got done
- [ ] item that didn't

## Next Sprint

**Focus:** {optional one-liner}

- [ ] planned item
- [ ] planned item

### Updates, questions, and requests

- availability notes, asks, FYIs (often empty)
```

Do not draft comments for other team members; each person writes their own.

## Key facts

- Sprint issues live in `PostHog/company-internal`, titled
  `[SPRINT] Editorial {start} - {end} {year}` (e.g. `August 10 - 14 2026`).
  The current one is always discoverable by searching for the newest such
  title – never ask the user for the issue URL. The upcoming week's issue is
  created automatically by a scheduled task each **Friday at 4pm PT** (older
  weeks were created by hand), so it normally exists by prep time; still
  discover it by searching rather than assuming a number.
- Content planning lives in **`PostHog/marketing`** (renamed from
  `PostHog/content` – always use `marketing`). Planning issue: #37. Newsletter
  and blog work each have their own issues there.
- Slack: `#team-editorial` is channel `C09GU689J1X`. This is the only channel
  to read.
- The user is `jina-yoon` on GitHub, Jina Yoon on Slack. Team: Ian Vanagas
  (editorial lead), Andy Vandervell (marketing lead), Liam Graham (social),
  Natalia Amorim (content); Joe Martin, Will Wearing, Cleo Lant, Sean Mallia
  contribute.

## Workflow

### 1. Locate the sprint issues

```bash
gh api -X GET search/issues -f q='repo:PostHog/company-internal in:title "[SPRINT] Editorial"' -f sort=created -f per_page=3 \
  --jq '.items[] | "\(.number)\t\(.state)\t\(.title)"'
```

Work out from the titles which issue covers the *ending* week and whether the
*upcoming* week's issue exists yet. The scheduled task creates it every Friday
at 4pm PT, so it usually does; if the user preps before 4pm it may not be up
yet. The retro grades the user's plan, which lives in their comment on the
ending week's issue (`gh issue view <n> --repo PostHog/company-internal
--json body,comments`). If the user posted no comment last week, say so and
build the retro purely from evidence.

### 2. Gather the week's evidence

Collect only what happened during the ending sprint's Mon–Fri window:

- **Slack**: read `#team-editorial` (C09GU689J1X) since Monday. The user's own
  messages are the strongest signal (drafts shared, issues filed, reviews
  requested, OOO notes). Messages mentioning the user matter too.
- **GitHub**: search for the user's activity this week where editorial work
  lives:

```bash
gh search issues --involves jina-yoon --updated ">=<monday>" --repo PostHog/marketing --repo PostHog/posthog.com --json number,title,repository,state,url
gh search prs    --involves jina-yoon --updated ">=<monday>" --repo PostHog/marketing --repo PostHog/posthog.com --json number,title,repository,state,url
```

- **Google Docs**: a lot of the user's writing and reviewing happens in Docs,
  and none of it shows up in Slack or GitHub. If the Google Drive MCP tools
  are available, check two things (skip this step entirely if they aren't –
  say so in the presentation rather than guessing):

  - *What she wrote or edited* – `list_recent_files` with
    `orderBy: lastModifiedByMe`, then keep files whose timestamp falls inside
    the sprint window. This is the reliable signal: it's scoped to her own
    edits.
  - *What she reviewed* – docs owned by someone else that she opened during
    the window:

    ```
    search_files: viewedByMeTime > '<monday>T00:00:00Z' and owner != 'me'
                  and mimeType = 'application/vnd.google-apps.document'
    ```

  Match docs to work by title (newsletter issues, blog drafts, briefs). Use
  `get_file_metadata` or `read_file_content` if a title is ambiguous, but
  don't read whole drafts just to characterise them – the title plus the
  matching Slack or GitHub thread is usually enough.

- **Planning context for next week**: skim `PostHog/marketing` issue #37 and
  any issues assigned to the user there – these seed the next-sprint list.
- **Availability**: note OOO/holiday/return messages in Slack.

### 3. Draft the retro

Cross-reference each item from last week's plan against the evidence:

- Mark `[x]` only when you have concrete evidence (a shipped post, a merged
  PR, a Slack message saying it went out). Cite the evidence in your chat
  presentation (not in the draft itself).
- **Drive evidence is weaker than Slack or GitHub evidence – don't let it
  produce checkmarks on its own.** `lastModifiedByMe` proves she edited a
  doc, not that the work is finished; `viewedByMeTime` only proves she opened
  it, which is not the same as reviewing it. On a doc owned by someone else,
  `modifiedTime` may well be someone else's edit. So treat a Drive hit as a
  prompt: it corroborates an item that has other evidence, or it becomes a
  "couldn't verify – did this happen?" flag. Substantial editing in a doc
  that matches a planned item is worth surfacing even unverified, since it's
  often the only trace that the week's writing happened at all.
- Staged-but-not-shipped work (e.g. a newsletter loaded and scheduled but not
  sent) stays `[ ]` with a short note like "ready, publishes mon" – don't
  check it with a caveat.
- When you can't tell, leave it `[ ]` and flag it as "couldn't verify – did
  this happen?" It's much better for the user to flip a box than to catch a
  false claim in front of the team Monday.
- Add *significant* unplanned work that happened.
- Propose a rating out of 10 with a one-line reason, matching the user's past
  style ("7/10, good reception on the agent autonomy one", "8/10, solid").
  Mark the rating clearly as a suggestion – how the week *felt* is theirs to
  say.

**Significance filter – this matters.** The sprint comment is read aloud in a
team meeting; it's a highlight reel, not a work log. The user's real comments
run 3–7 bullets per section. Keep the main checklists to significant work
only: published/shipped content, substantive drafts, major reviews, decisions.
Leave out small fixes, housekeeping PRs, in-progress research ("kept digging
on X"), quick feedback passes, and minor filed issues. Don't delete those –
collect them in a separate **"Minor items – include if you want"** section at
the *bottom of the draft* (clearly not part of the comment), so the user can
promote any they care about. When in doubt, it goes in the minor pile.

### 4. Draft the next sprint

- Carry over unfinished items that still matter (drop ones explicitly
  abandoned or superseded).
- Add new items grounded in the evidence: things the user said they'd start
  (Slack), issues assigned to or filed by them in `PostHog/marketing`, and
  anything from the planning issue scheduled for the coming week.
- Suggest a **Focus** line if one theme dominates; omit it otherwise.
- Note availability (theirs and teammates') in "Updates, questions, and
  requests" if relevant.

The same significance filter applies: a short list of real commitments, not an
exhaustive backlog.

Match the user's voice: terse, lowercase-leaning bullets, no corporate
padding. Use en dashes (–), never em dashes (—). Look at their previous
comments in the sprint issues and imitate that register, not a formal status
report. Fewer words is almost always better. Link relevant issues/PRs (full
GitHub URLs render as neat #NNNN references), but never @-mention people in
draft content – mentions send notifications and aren't part of the house
style.

### 5. Present for review

Show the user, in chat: the full comment draft, the minor-items list, and –
briefly – which checkmarks are verified vs. guessed and where each next-sprint
item came from. Keep the presentation tight; the user reviews this every
Friday and doesn't need it narrated. Then stop and wait.

### 6. Post (only after explicit approval)

The comment belongs on the *upcoming* week's sprint issue. On a clear
go-ahead:

- If the upcoming week's issue exists, post there:

```bash
gh issue comment <issue-number> --repo PostHog/company-internal --body-file <drafted-comment>
```

- If it doesn't exist yet (e.g. prepping before the Friday 4pm PT scheduled
  task has run), say so and stop – don't post the comment to the ending
  week's issue, and don't create the issue yourself. The user can rerun the
  posting step once the new issue is up.
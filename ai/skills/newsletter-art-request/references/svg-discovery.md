# Finding the source SVGs

When Jina says a graphic was "generated with Claude", the SVG exists. Your job is to find it, not to make a new one.

## Where they are

**`~/Downloads` is the answer almost every time.** When Claude produces a graphic in a chat or Cowork session she downloads it, and it stays there. There are only a handful of SVGs in that folder at any time, so this is a cheap search, not a haystack.

If the session that made them is still reachable, its workspace folder is worth a look too, and `~/cowork` has per-project folders. But do not spend long there. Downloads first.

If the folder is not connected to the session, ask for access to `~/Downloads` rather than giving up. That is a one-click grant and it unblocks the whole step.

## What they look like

Snake_case, named after what the graphic depicts, with a sibling `.png` of the same stem. The PNG is what gets embedded in the GitHub issue. The SVG is what goes into Figma.

Real examples, with the graphic name Jina used in the issue:

| File in Downloads | Called this in the issue |
|---|---|
| `agent_autonomy_tree_symmetric.svg` | Agent autonomy level decision tree |
| `human_in_the_loop_review_cycle.svg` | Human-in-the-loop |
| `level_2_delegation_gate_passthrough.svg` | Agent delegation |
| `software_factory_reading_depth_plotted.svg` | Software factories gradient plot chart |

Note how loose the correspondence is. "Agent delegation" and `level_2_delegation_gate_passthrough` share one word. Do not expect the filename to match the caption, match on *what the graphic is about*.

## How to search

1. List the SVGs in `~/Downloads` with their modification times. There are usually fewer than twenty, so look at all of them.
2. **Look in the subfolders too.** She sometimes files a newsletter's assets into a folder like `~/Downloads/context eng/`, so a top-level listing alone will miss them. Recurse a couple of levels.
3. Filter to a date window around when the newsletter was being written, which you can estimate from the Google Doc's edit date. The graphics are usually made within a few days of the request.
4. Match each one to a graphic in the doc by subject.
5. Grab the matching `.png` for the issue embed and the `.svg` for Figma.

## When the file was never downloaded

A graphic can exist without ever having reached the filesystem. If it was made in a chat session and she has not clicked download, it lives in that session's file panel and nothing on disk will match it.

The tell is that she refers to a graphic you cannot find anywhere, or shows you a screenshot of it sitting in a file viewer with a download button. **Ask her to download it.** Do not reconstruct it from a screenshot, and do not offer the nearest file you did find as a substitute. A near-miss is worse than an honest gap here, because it looks right in the issue and the designer polishes the wrong thing.

## Layout-option pages

When a graphic went through a round of "here are four ways to draw this", the artifact is often a single HTML page with all the options inlined as `<svg>` blocks, and she will tell you which one she picked ("option A"). That HTML is the authoritative source, so take the SVG straight out of it rather than redrawing.

One trap: inside such a page the `<svg>` elements usually inherit `font-family` from the page's `body` CSS and carry no font attribute of their own. Lift one out as a standalone file and every label silently renders in a default serif. Restate the font stack on the root `<svg>` element to match her other graphics:

```
font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
```

Check the same thing for anything else the SVG was inheriting rather than declaring, such as a background fill supplied by the page.

## The version trap

There are almost always several files for the same graphic, and **the newest one is the one she means.** She iterates, and the later file is the version that is actually in the doc.

The real case worth remembering: for the agent autonomy newsletter, Downloads held both `agent_autonomy_decision_flow.svg` (07-24 03:46) and `agent_autonomy_tree_symmetric.svg` (07-24 19:27). The issue called that graphic the "Agent autonomy level decision tree", so a keyword match picks `decision_flow`, which is wrong. She had commented on the issue that day asking for the flowchart to be flipped, and `tree_symmetric` is that flipped version. Sixteen hours of timestamp is the only thing that tells them apart.

So: when two files could be the same graphic, take the later one, and say which one you took.

## Confirm before you upload

Show her the mapping as a short list before putting anything in Figma:

> 1. Task success rate vs turn count → `context_decay_success_rate.svg` (08-12)
> 2. The three failure modes → `context_failure_modes_panels.svg` (08-12)
> 3. Context decay over a session → `context_window_fade.svg` (08-13)

One line each, filename and date. She will spot a wrong version immediately, and it costs her three seconds. If a graphic in the doc has no candidate file, say which one and ask, rather than quietly filing a request with two of three graphics attached.

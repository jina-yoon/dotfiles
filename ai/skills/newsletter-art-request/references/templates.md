# Issue body templates

The repo template (`PostHog/marketing/.github/ISSUE_TEMPLATE/art-request-template.md`) defines four sections. `## Additional comments` is optional and Jina drops it when she has nothing to say. Do not add sections that are not here.

Delete the instructional blockquote at the top of the template ("How art requests work") from your draft. It is boilerplate for the person filing, not content for the designer.

---

## Hero image

```markdown
## Outline

I'm writing a newsletter about [<short description of the topic>](<google doc link>).

**This is for build mode, so it should have build mode styling and logos.**

<One or two sentences of imagery direction, or a short bulleted list of concepts.>

Hero image text: "<text>"

The TL;DR version is:
- <argument 1>
- <argument 2>
- <argument 3>

## Deadline & Priority
**<exactly what she said>**

## Technical requirements
Same as usual for newsletter :)

Polish pass request for infographics at PostHog/marketing#<N>
```

Notes:

- The Google Doc link goes inline in the opening sentence, as link text. Never as a bare "Draft: <url>" field.
- The TL;DR is three or four bullets, one sentence each. It exists so the designer understands the argument well enough to have their own ideas, not so they can reconstruct the article. If a bullet needs a parenthetical to hold a statistic, it is doing too much, split it or drop the stat.
- List imagery concepts and stop. Do not tell the designer which one you would pick or explain why one is stronger. Choosing is their job and she has never done it in a past request.
- **Hero image text is very short, four words or so at the outside.** It is text set into an illustration, not a headline. "Software factories, explained." is the shape of it. If you find yourself proposing the article's full working title, you have written a headline, not hero text.
- If the hero text is not settled, say so and give a placeholder, e.g. `Still deciding on the hero image text. You can just put "<placeholder>" as a placeholder for now.`
- If she has concrete concepts, bullet them and let her rank. Her past requests often end that list with "Open to suggestions!" because she means it.
- Drop the trailing cross-link line if there is no polish pass.

---

## Polish pass

Use a flat numbered list. No `###` heading per graphic, no `---` dividers between them. Those make a three-graphic request read like a long document when it is really a list of three things.

```markdown
## Outline

The [<topic> newsletter](<google doc link>) (hero image request PostHog/marketing#<N>) will have <N> infographics. SVGs are in the build mode graphics page here: <figma section link>

1. <name of the graphic> | [SVG file link](<url>)
<img width="<w>" height="<h>" alt="Image" src="<uploaded image url>"/>

2. <name of the graphic> | [SVG file link](<url>)
<img width="<w>" height="<h>" alt="Image" src="<uploaded image url>"/>

3. <name of the graphic> | [SVG file link](<url>)
<img width="<w>" height="<h>" alt="Image" src="<uploaded image url>"/>
<one line, only if there is intent the picture does not convey>

## Deadline & Priority
<exactly what she said>

## Technical requirements
Horizontal for newsletter
```

Notes:

- Give each graphic a short name, the kind of thing she would say out loud: "Human-in-the-loop", "Agent delegation", "Task success rate vs turn count".
- Link the raw SVG next to the name. Designers have asked for it.
- Under each image, write nothing by default. Only add a note when the picture cannot carry it: an argument encoded in a visual choice, a constraint that must survive the redesign, a piece of text that is wrong and needs changing, or a part she wants dropped.
- Keep those notes to one or two sentences. State the constraint and why it matters, then stop. "The fade on the left is intentional, old context gets less trustworthy rather than disappearing, so please don't square it off into discrete blocks" does the whole job in one line.
- Never add a "Recommendations", "Notes for the designer", "Art direction", or "What I need" block. The numbered list is the request. Anything that would go in such a block either belongs next to its graphic or does not belong at all.
- She has recently started thinking about mobile legibility (she raised it in #team-graphics after an issue shipped). If a graphic is very wide, roughly 3:1 or more, one line is worth it: "this one might need re-laying out for mobile".
- If some of the graphics may already be fine, say so instead of pretending they all need work: "Not sure which of these need polish, feel free to skip if you think they're fine as-is!"
- If she does not have a Figma link for them, say that plainly. She has filed requests saying "These are generated with Claude so I don't have a Figma link to provide."

---

## Titles and metadata

| Field | Value |
|---|---|
| Repo | `PostHog/marketing` |
| Hero title | `Art request - Hero image for <topic> newsletter` |
| Polish title | `Art request - Polish pass for <topic> newsletter` |
| Label | `artwork` |
| Assignees | `lottiecoxon`, `dphawkins1617`, `heidiberton` |
| Project board | Art & Brand Planning, `PostHog/65` |

Older requests live in `PostHog/posthog.com`. Art requests moved to `PostHog/marketing` at the end of July 2026, so file new ones there and only read the old repo for reference.

## Dimensions

She writes "Same as usual for newsletter :)" and the designers know what that means. If anyone asks, the real numbers from her earlier requests are 1456 x 1048 px for the Substack hero image and 1920 x 1080 px for the posthog.com blog version. Infographics are "horizontal for newsletter", as wide as reasonable.

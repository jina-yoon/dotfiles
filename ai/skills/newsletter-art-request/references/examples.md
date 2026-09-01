# Real past requests

These are Jina's own issue bodies, verbatim. Match this register. Note how much is *not* said.

---

## Hero image, PostHog/marketing#168

Short, links the doc inline, flags build mode, admits the text is not settled, three bullets of argument, one line for technical requirements.

```markdown
## Outline

I'm writing a newsletter about [why software factories are optimizing the wrong thing](https://docs.google.com/document/d/1ln0.../edit?tab=t.0).

**This is for build mode, so it should have build mode styling and logos.**

The image should probably just have a factory in it? Still deciding on the hero image text. You can just put "Software factories, explained." as a placeholder for now.

The TL;DR version is:
- "Software factories" (systems where agents write most of the code and humans just approve merges) are having a moment
- The big debate right now is about code quality: agents write *correct* code but degrade *good software* over time.
- We agree with all of that but we think people are forgetting the importance of product context for software design decisions

## Deadline & Priority
**Thursday, August 6 by EOD**  pulling this in a day early from the usual Friday so we can stage everything on Friday this time.

## Technical requirements
Same as usual for newsletter :)

Polish pass request for infographics at PostHog/marketing#169
```

---

## Hero image, PostHog/posthog.com#18676

When the concept is not obvious, she proposes specific visual objects rather than describing a mood, and invites pushback.

```markdown
## Outline

I'm writing a shorter newsletter about [agent autonomy levels](https://docs.google.com/document/d/1lyy.../edit?tab=t.0)

The TL;DR version is:
- As developers build with more and more agents, it's impossible to read every line of code
- This begs the question, "how much can I trust the agents? (aka how much autonomy should I give them?)"
- A lot of people mistakenly think that better models = more trust, but this is wrong.
- The two variables that determine agent autonomy are:
  - Verification: How easy is it to **check** the agent's work?
  - Recovery: If the agents mess up, is there a way to **undo**?
- And then we give some tips for making this better

I think the best visual for this (since the content isn't 100% certain yet) is to have two things:
1. A ticked box/checkmark, or an A+ (like a grade on an exam) - to represent verification/checking
2. A "Ctrl+Z" (or Command+Z) - to represent recovery/undo

Open to suggestions!

## Deadline & Priority
Monday, July 27 by 11am PT

## Technical requirements
Same as usual for newsletter :)

## Additional comments
The concepts in this article are a little more abstract so feel free to ask me any questions!
I will be OOO Mon 7/20 - Tue 7/22

Polish pass request for infographics at #18677
```

---

## Polish pass, PostHog/posthog.com#18677

Almost no prose. Name, SVG link, image. That is the whole entry.

```markdown
## Outline
The [agent autonomy newsletter](https://docs.google.com/document/d/1lyy...) (hero image request #18676) will have 3 infographics.

These are generated with Claude so I don't have a Figma link to provide. You don't have to include the title and caption text at the top and bottom of 2 and 3. Feel free to ping me on Slack for clarifications!

1. Agent autonomy level decision tree | [SVG file link](...) - UPDATED to flipped version
<img width="3680" height="1880" alt="Image" src="..."/>

2. Human-in-the-loop | [SVG file link](...)
<img width="3040" height="1360" alt="Image" src="..."/>

3. Agent delegation | [SVG file link](...)
<img width="3040" height="1280" alt="Image" src="..."/>

## Deadline & Priority
Monday, July 27 by 11am PT

## Technical requirements
Horizontal for newsletter

## Additional comments
I will be OOO Mon 7/20 - Tue 7/22
```

---

## Polish pass, PostHog/marketing#169

The one case where a long note is justified. The axes list is borderline (a designer could read those off the image), but the paragraph about the shaded zone is doing real work: it protects a deliberate visual choice from being tidied away. Note the last sentence, which says *why* it matters.

```markdown
### 1. Software factories gradient plot chart

<img width="676" height="443" alt="Image" src="..."/>

**Axes:**
- **Y** — How much of the code is written by agents?
- **X** — How closely do humans read the code?

**Plotted points:**
- **Software factory** — around Y=66% and X=Glance
- **Lights-off software factory** — top right corner, near Y=100% and X=None
...

The shaded zone is the important bit. There's a light region covering everything above Level 2 and above 50%. Its left and bottom edges deliberately feather out into the neighbouring cells rather than stopping at a hard line — the whole point is that there's no exact boundary where a codebase becomes a software factory. Please keep that softness; it's carrying an argument, not just decoration.
```

She commented on this issue immediately after filing it:

> sorry for the emdashes i asked claude to file these :(

Which is to say: the substance of that last paragraph was right, the punctuation gave it away, and the axes/points lists above it were more than she needed to write. Aim for the paragraph, skip the inventory.

---

## Things she does that are worth preserving

- Apologises for short notice when the notice is short, without being asked to.
- Says "sorry this is a bit late!" or "🥺 👉👈" and means it warmly. Do not add emoji she did not ask for, but do not sanitise hers.
- Offers a way to reach her: "Feel free to ping me on Slack for clarifications!", "feel free to ask me any questions!"
- Flags when she is OOO.
- Suggests reusing an existing asset when there is one, with the Figma link, rather than asking for new work.

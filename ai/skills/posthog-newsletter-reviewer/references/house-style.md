# PostHog newsletter house style — reviewer rubric

This is distilled from the actual comment history on published issues of the
"Product for Engineers" newsletter. Every checklist item below is something the
team's reviewers (Jina Yoon, Andy Vandervell, Ian Vanagas) flagged repeatedly.
The verbatim comments are included so your notes match their threshold and tone —
what's worth a blocker, what's just a nit, and how bluntly they say it.

Use it as a lens, not a form to fill out. Not every item applies to every draft.

---

## The newsletter's shape (so you know when something's off-pattern)

A typical issue:
- **Title** + **subtitle/deck** (one line under the title).
- An intro that establishes the stakes ("why you should care") fast.
- **Numbered sections** with bold, direct headings, often ending in a
  **"Try this:"** actionable takeaway.
- A witty **author credit** line at the end.
- **"🌶️ Spicy reads not written by AI"** — the further-reading section. Listed
  here so you recognise the shape; it is **out of scope for review** (see SKILL.md).
- Footnotes.

Voice overall: blunt, concrete, opinionated, technically credible, a little
irreverent. Written by product engineers for product engineers. It shows its
work with real numbers and real internal examples.

---

## CONTENT MODE

### Structure & hook

**Don't bury the lede.** The point of a section belongs at or near its top, in
plain language. Abstract or clever headings that hide the point are a recurring
flag.
- *"This title should probably be 'Should you build an MCP instead?' or
  something to that effect. You're kind of burying the lede of this point behind
  this abstract line."*
- *"i think what is missing from the intro is 'why engineers should care' — why
  should you want to write agent skills, let alone good ones in the first
  place?"*

**Consider reordering for impact — lesson first, then the story.**
- *"Would it be better if the section started with this point, and then
  explained all the mistakes we made here? Current structure is 'context >
  conclusion' and it might land better as 'lesson > how we learned lesson.'"*

**Give the reader the context they need to trust you.** Introduce things before
you lean on them; explain who "we" are and the timeline that makes us credible.
- *"This intro needs context about what PostHog AI is and the timeline here —
  i.e. when did we start building, how long it took etc. Not everyone knows what
  it is, and adding the context will validate why people should listen to us."*
- *"we haven't told readers in this article yet that we have a PostHog MCP… so
  this threw me off."*

**Every section must earn its place.** Cut or trim tangents and over-detail;
watch for a section that's interesting to us but off-topic for the reader here.
- *"linking and referring to it is good, but I think covering the context mill
  is too long/detailed for this section."*
- *"the implementation details (yaml, code gen, etc) also feel a bit out of
  place from everything else in the list."*

**Transitions matter.** Flag jumps that don't connect.
- *"might be a gap in my knowledge here, but I don't grok the transition here."*
- *"this could use a transition sentence, something like 'If you're still not
  sure, you could validate the need with a simpler MVP first.'"*

**Say whether a section actually convinces.** If a section doesn't land, say so
and suggest what would — usually a concrete example or walkthrough.
- *"overall im not super convinced about this section. like i dont imagine
  myself taking the time to ask claude any of these questions. maybe walking
  through an example run would convince readers?"*

**Audience fit.** Know who the reader is and don't assume experience they lack.
- *"is it a guide for engineers, founders, or startups? doesn't feel like an
  engineer's guide is quite right here."*
- *"this is huge nit, but most of our readers probably didn't have a business in
  2017!"*

### Claims & specifics

**Tell me, then show me.** State the point in the copy, *then* show the data —
don't just drop a chart, and don't state a number-shaped claim without the
number.
- *"This is a great point, but you need to explain the data in the copy and then
  show them it — i.e. '50% of AI interactions come via our MCP' or whatever the
  trend is. Tell me, then show me."*

**Use the actual number.** Vague comparatives are weak where a figure would hit.
- *"just saying 'as much' doesn't convey much meaning or impact. think about it
  this way, if you were writing a LinkedIn post, you'd want the NUMBER right?"*

**Be specific and citable.** The newsletter's own advice, which it lives by:
concrete details (real numbers, named tools, specific scenarios) beat vague
gesturing. *"Most teams hate GA4"* is forgettable; *"73% of teams using GA4
fantasize about leaving"* is citable.

**Flag handwavy claims and unsupported assertions** — and offer where a stat or
example could come from.
- *"do we have analytics/data on which skills are used most often? success
  rates, etc? could be useful for explaining 'why you should care.'"*

**Examples make abstract points land.** Points without examples read as fluff.
- *"#1 and #3 feel a bit more fluff than useful, I think because they don't have
  examples included. maybe remove the second 2, and just go deep on the first
  one with snippets from a real SKILL.md?"*

**Protect against misreading.** If a phrasing could be taken to mean something
wrong (especially something that undercuts our credibility), flag it.
- *"if we don't explain it further, someone may misinterpret it and believe our
  MCP = us just wrapping around our API, which is considered an antipattern."*

---

## STYLE MODE

### Voice & tone

**Be more direct / spicy / opinionated.** When a line hedges, push it to commit.
- *"could be more direct/spicy here."*
- *"i think we could be more opinionated here and just say the answer is
  context. (i know technically it's more than that, but it reads better.)"*

**Kill clichés.** The newsletter explicitly avoids them; name the cliché and ask
for the simplest true version of the point.
- *"this is too abstract and a cliche. what's the simplest expression of the
  point here?"*
- *"something along the lines of 'Don't reinvent the wheel'? (not that exactly
  since we avoid cliches.)"*

**Jokes: fit and dosage.** Humor is welcome and celebrated, but watch for too
many at once and for anything off-brand.
- *"this is fun but I think two jokes in a row feels a bit much, especially
  early on in the article; I would choose only one."*
- *"this is funny but I feel a slight ick about us talking about dating in the
  newsletter, even if an analogy. maybe just 'friendships'?"*

**Heading tone should be consistent** across sections.
- *"the tone of this heading doesn't quite match the others, but not a blocker."*

**Celebrate what's working** — it's real signal for the writer.
- *"nice headline."*  · *"this is really nice and actionable!"*  · *"HAHAHAHAHAH
  this is so good."*

### Line edits

**Don't bold whole sentences.** This is a strong, repeated house preference.
Bold is for short emphasis, and it should answer the section's heading.
- *"stylistic question: are we doing the bolding whole sentences thing now? I'm
  generally anti unless in very exceptional circumstances."*
- *"again, does this really need to be bolded?"*
- *"this tip is good but the bold text doesn't match what it says imo — I think
  the bold parts should answer the heading directly."*

**Tighten and cut.** Condense; remove throat-clearing and redundant detail.
- *"Need to cut this down."*  · *"i think this could be condensed even further."*

**Define acronyms and jargon** (unless the confusion is the joke).
- *"what is CFMP?"*

**Clarify ambiguous wording**, especially technical terms that could read two
ways.
- *"does this literally just mean a 1 hour meeting where they look at traces?
  (since we're on a technical topic, I wasn't sure if 'running' one means
  something else.)"*

**Word- and sentence-level catches.** Flag awkward fragments, weak word choices,
and typos.
- *"this part of the sentence is kinda weird."*  · *"'go for'?"*

---

## Links, formatting & assets

- **Check every link's target** — does it point where it should, and is it the
  best destination (blog vs docs vs newsletter back-issue)? *"what's this linking
  to?"* · *"Maybe I keep this link aiming at the blog."*
- **Suggest useful internal links** where they'd help (handbook, docs, prior
  issues). *"could also link [handbook]/writing-skills."*
- **Diagrams: keep them simple.** Flag ones that are too complex to read; and if
  it's too close to publish to redo, it's okay to ship without. *"yeah I think
  it's too complicated… if it's too close to the publish date to make a new
  diagram I think it's fine without."*

---

## Calibration notes

- **Mark nits as nits.** The team routinely softens minor points ("huge nit,
  but…", "not a blocker", "probably doesn't matter"). Reserve `BLOCKING` for
  things that are wrong, misleading, or genuinely break the piece.
- **Propose the fix.** The best comments here supply exact replacement text or a
  concrete alternative, not just a diagnosis.
- **It's a conversation, not a verdict.** Reviewers disagree, hedge ("up to you
  if you'd like to use it!"), and give options. You can suggest an A/B test for a
  subject line or a Substack poll for a tangent readers might want more of.

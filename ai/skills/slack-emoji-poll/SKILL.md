---
name: slack-emoji-poll
description: "Post a numbered emoji-vote poll to Slack and auto-add the :one:–:nine: reactions so people can just click."
---

# Slack emoji poll

Jina posts vote-me messages in Slack as a numbered list, then reacts to her own message with :one:, :two:, :three:... so colleagues vote with one click. Adding those reactions by hand is the annoying part - this skill does it.

## What you need before posting

1. **The options.** Jina normally pastes them. Don't invent, reword, or reorder options unless she asks - a title vote is only useful if the options are exactly what she's considering.
2. **The channel.** If she didn't say, ask. Her usual is `#content` (`C02E3BKC78F`), but confirm rather than assume.
3. **The framing line** - one sentence above the list saying what's being voted on. Write it in her voice: all lowercase, "u" not "you", "pls" not "please", conversational. Emoji at the start and end of the line is her habit (e.g. `:blob_help:` ... `:rolled_up_newspaper:`).

Max 9 options. If she has more, tell her and ask which to cut - past 9 the number emoji get unreliable and voters lose track.

## Message shape

```
:blob_help: quick emoji vote! pls help the newsletter :rolled_up_newspaper: - which title do you think you'd click on?

1. Get out of your agents' way
2. Read this before you delete your AGENTS.md
3. Unhobble your AI agents
4. You need to fix your AGENTS.md
5. Your AGENTS.md is holding you back
```

Plain `1.` `2.` `3.` numbering, blank line between the framing line and the list, one option per line, no bold, no extra commentary under the options. Slack's own auto-list formatting can renumber things - write the numbers as literal text.

## Steps

1. Draft the full message (framing line + numbered list) and show it to Jina **in chat**. Do not post yet - nothing outward-facing goes out without her explicit approval.
2. On approval, post it with `slack_send_message` to the agreed channel.
3. Grab the `ts` of the posted message from the send result.
4. Add one reaction per option with `slack_add_reaction`, **in order, one call per number**, starting at `one`:
   - `one`, `two`, `three`, `four`, `five`, `six`, `seven`, `eight`, `nine`
   - Reactions appear in the order they were added, so 1-2-3 order matters. Don't parallelize these calls.
5. Reply to Jina with the permalink and confirm how many reactions landed.

## Verification

After reacting, call `slack_get_reactions` on the message and check that the number of reactions equals the number of options and that they're in order. If one failed (rate limit, name mismatch), retry just that one and say which.

## Notes

- If she wants a 10th option, look the emoji name up with `slack_search_emojis` before using it - the standard `:one:`-`:nine:` names are reliable, ten is not. [unverified: exact Slack name for 10 varies by workspace]
- If she asks for letters or custom emoji instead of numbers (e.g. hedgehog variants), use those names in the same order-preserving way.
- Don't add a "none of these" option unless she asks for one.
- When results come in and she asks who won, read the reactions off the message rather than counting from memory.
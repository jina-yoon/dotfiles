---
name: research-newsletter
description: Research real, quotable, sourced examples for a Product for Engineers newsletter from a notes file. Use when asked to substantiate a newsletter thesis with evidence and links.
metadata:
  version: '5'
  cowork: true
---

# Newsletter research

Read [the workflow](references/workflow.md) in full, then follow it.

Before writing any Linkup query (Channel G), also read [the Linkup reference](references/linkup.md).

## Portability

- Treat `$ARGUMENTS` as the text supplied with the skill invocation.
- Substitute supplied text safely before executing an example containing `$ARGUMENTS`; it is not a shell environment variable.
- Treat named tools as capabilities; use the current agent's equivalent.
- Read credentials from the environment, never from a product-specific settings location.

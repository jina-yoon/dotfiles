# Putting SVGs into the Newsletter Graphics file

Target file: https://www.figma.com/design/3wxLXDQ87KfHoEl1lBx4OW/Newsletter-Graphics?node-id=970-59622

- **fileKey**: `3wxLXDQ87KfHoEl1lBx4OW`
- **page**: `970:59622`, named "build mode graphics"

## The convention

That page is organised into **sections stacked vertically**, one per newsletter. Existing sections are 4268 wide, at x = -405, with roughly 500px of vertical gap between them. Names vary: one is the GitHub issue URL, one is `Context engineering 8-24-2026`.

Create a **new section per newsletter** and put all of that newsletter's graphics inside it, laid out in a row. Name it `<Newsletter topic> <M-D-YYYY>` using the newsletter's send date, matching the most recent existing section. Place it below the lowest existing section.

Do not scatter graphics loose on the page and do not reuse another newsletter's section.

## Procedure

1. `get_metadata` with `fileKey` and `nodeId` `970:59622` to find existing sections and their `y` + `height`. This response is enormous, so pipe it and extract only the top-level `<section>` elements rather than reading it whole. The next section's `y` is `max(y + height) + 500`.

2. Set the current page. `upload_assets` drops SVGs onto whatever page is current, so this has to happen first:

   ```js
   const page = figma.root.children.find(p => p.id === '970:59622')
   await figma.setCurrentPageAsync(page)
   ```

3. Create the section at the computed position via `use_figma`, sized to fit the graphics you are about to add.

4. Import each SVG with `figma.createNodeFromSvg(svgString)` inside `use_figma`. This produces the same editable vector tree the designers want, and it works because it travels over the MCP connection.

   `upload_assets` is the documented path and it hands back a `submitUrl` to POST the bytes to, but that endpoint lives on `mcp.figma.com`, which is not on this sandbox's network allowlist. The POST fails with curl exit 56 and an empty response, and no error surfaces from Figma, so the upload just silently does nothing. Do not spend time debugging it. Read the file, inline the SVG source into the script, and use `createNodeFromSvg`.

   Two limits worth knowing before you plan around it: the `code` parameter caps at 50,000 characters, so a very large SVG needs splitting or another approach, and this trick does not work for raster images since `createImageAsync` is unavailable. A graphic that exists only as a PNG cannot be placed this way, so say so in the issue rather than quietly dropping it.

5. The imported nodes land on the current page, not inside your section. Move them in: find the newly created top-level nodes, `section.appendChild(node)` each one, and lay them out in a row with sensible spacing. Name each node after the graphic ("Agent autonomy level decision tree"), because those names are what the designer sees in the layers panel.

   **A child of a SECTION is positioned relative to the section's origin, not in absolute page coordinates.** So after appending, set `node.x = 120` and `node.y = 160`, never `node.x = section.x + 120`. Getting this wrong is quiet and ugly: the section sits at y=7726, you helpfully write `section.y + 160`, and the graphic lands 7,886px *below* the section instead of 160px inside it. Nothing errors. The layers panel still shows it parented correctly. It just isn't where anyone is looking.

   The trap is that reading `node.x` back gives you the same relative number you set, so comparing it against the section's absolute bounds appears to confirm it worked. Check `node.absoluteBoundingBox` against `section.absoluteBoundingBox` instead, which is unambiguous.

6. Verify before telling her it worked, with two checks that catch different things:

   - `get_screenshot` on the section and compare the reported `original_width`/`original_height` to the section's own width/height. They should match. If the capture comes back *larger* than the section, content is hanging outside it and Figma expanded the frame to include the strays.
   - Look at the screenshot. Structural correctness is not the same as it looking right.

7. Use the section's node id to build the link that goes in the issue: `https://www.figma.com/design/3wxLXDQ87KfHoEl1lBx4OW/Newsletter-Graphics?node-id=<section-id-with-dash>`.

## Read the figma-use skill first

Before calling `use_figma`, load the `/figma-use` skill (or the `skill://figma/figma-use/SKILL.md` resource). The Plugin API has enough sharp edges that skipping it causes failures that are annoying to debug. Two that bite here specifically: you must use `figma.setCurrentPageAsync`, assigning to `figma.currentPage` does not work; and `loadAllPagesAsync`, `setPluginData`, and `createImageAsync` are unavailable.

## If Figma is not reachable

The Figma MCP runs against Jina's own Figma session, so it can be unavailable. Do not block the art request on it. File the issue with the graphics embedded as images and say plainly what past requests have said:

> These are generated with Claude so I don't have a Figma link to provide.

Then tell her the SVGs still need adding to the build mode graphics page, and offer to do it when Figma is back.

**This fallback is for when Figma itself is down, not for when you did not look for the SVGs.** If you have the files and only the upload failed, say that, so she knows the difference between "no source files" and "Figma was being difficult". Those need different fixes from her.

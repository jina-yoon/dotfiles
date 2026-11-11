---
name: build-mode-crosspost
description: "Port a finished build mode newsletter issue from its Google Doc into Substack, X Article, LinkedIn Article drafts and a posthog.com PR, with images and alt text, or re-sync those drafts after later edits. Never publishes."
metadata:
  cowork: true
---

# Cross-post a build mode issue (Google Doc → Substack, X, LinkedIn, posthog.com)

One Google Doc in, four drafts out. The doc is the source of truth for text. The image folder is the source of truth for images. **Nothing gets published.**

Keep a running log of every step, decision and workaround in `/mnt/user-data/outputs/{slug}-crosspost-log.md`, and give Jina the log at the end.

## Hard rules

- **Never click Publish, Post, Continue, or "Next →".** Every platform autosaves drafts, so a save button is never needed. Never schedule anything.
- **Don't push to GitHub or open a PR (draft or not) without Jina's explicit OK.** `PostHog/posthog.com` is public. Prepare everything, then ask.
- **The Strapi JWT never leaves the browser.** Read it with `localStorage.getItem('jwt')` inside the posthog.com tab and use it right there. Never print it, return it, or copy it to disk.
- **Substack, X and LinkedIn autosave stale editor state.** Before you change a draft through an API, close any open editor tab for that draft (in both browsers). Afterwards, tell Jina to reload any editor she has open.
- Mark anything you couldn't verify as `[unverified]`. Leave a visible `[TODO: …]` in the draft rather than inventing copy.
- **Check whether each post is already live before editing it.** Substack: `GET /api/v1/drafts/{id}` → `is_published`; the live HTML is in `body`, the draft in `draft_body`. LinkedIn: the top-right button says **Update** instead of **Next →**. X: the article is gone from the Drafts list. Edits to a live post only change its pending draft. Never click **Update**; tell Jina what still needs it.

## Standing editorial rules

- **posthog.com, X, LinkedIn:** leave out Spicy reads, Join us, the subtitle, and any subscribe/share CTA. Spicy reads and Join us exist only on Substack.
- **X + LinkedIn end with the footnote(s), if any, then this footer.** The footer is one italic paragraph:
  > *Words by [Jina Yoon](https://x.com/jinayoon_), who {quip}. Graphics by [{Name}]({profile}) and [{Name}]({profile}). Originally published in* ***[build mode](https://newsletter.posthog.com/),*** *a free newsletter by [PostHog](https://posthog.com/{UTM}).*
  - posthog.com links get `?utm_source=posthog-newsletter&utm_medium=post&utm_campaign={slug}`. Links to x.com and newsletter.posthog.com don't.
  - Profiles: Daniel Hawkins `https://posthog.com/community/profiles/34810`, Lottie `https://posthog.com/community/profiles/27881`.
  - References: X `x.com/posthog/article/2104633794741633396`; LinkedIn newsletter `linkedin.com/newsletters/build-mode-7487938156873572352`.
- **Substack CTA and subscribe buttons:** insert them with Jina's saved **Template** block (the "Template" dropdown in the Substack editor toolbar). Don't hand-build them.
- **Images:** use the folder version whenever it differs from what's embedded somewhere else. Every image on every platform that supports it gets alt text.
- **Links:** keep every link exactly as written. The one exception is the posthog.com file, where posthog.com links become relative and lose their query string (`#fragments` stay).
  - **UTMs:** on Substack, X and LinkedIn, every posthog.com link gets `?utm_source=posthog-newsletter&utm_medium=post&utm_campaign={slug}` (body links too, including team profiles and docs). If a link already has `utm_*` params from an older issue (e.g. careers links with `utm_campaign=ai-product-lessons`), replace them; don't stack two sets. The Google Doc keeps links without UTMs.
  - **newsletter.posthog.com/i/… or /p/… links:** swap them for the posthog.com copy of the same issue (`posthog.com/newsletter/{slug}`), keeping the section anchor (`#3-prioritize-by-effort-vs-impact`). Open the newsletter link to get the issue's title, then confirm the posthog.com page and anchor exist. Ask Jina before swapping links in the doc.
- **Names:** check accents and spelling of people's names everywhere they appear, alt text included: **Raúl** (DevEx), not "Raul".

## Step 0: Ask up front (one AskUserQuestion round)

Ask for whatever Jina hasn't already given:

1. The Google Doc link, and which **tab** (tabs are dated, e.g. "Thu 10/22"). If her link has `?tab=t.…`, that tab ID wins; the tab's title can lag behind the date she says (one issue's tab was titled "Thu 5/21" when she called it "10/21"). Mention any mismatch.
2. The image folder (it must be connected). Ask her to export **every** body image into it, Slack screenshots included, plus the hero sizes: `X size` (5:2), `LinkedIn`, `substack 1200x630`, `website blog` (16:9).
3. Draft URLs: the Substack draft (or "create new"), the X article edit URL, and the LinkedIn "new article" URL for the PostHog page (`linkedin.com/article/new/?author=urn:li:fsd_company:37415928`).
4. **Slug.** Look for an existing `utm_campaign` in the doc's links first and propose it.
5. **Publish date.**
6. **Byline quip** ("Words by Jina Yoon, who …"). If she has none, use `[TODO: quip]`.
7. **Graphics credit.** Check PostHog/marketing for "Art request – … newsletter" issues to see who was assigned, then confirm with her.

## Environment facts (learned the hard way)

- **The device shell (`device_bash`) has no network**, and the cloud container's proxy blocks substack, S3, Cloudinary, Strapi and posthog.com. **All network work happens in the browser through JS.** Use Claude in Chrome: Jina is logged in to everything there.
- **`git commit` on the device fails** because deleting lock files isn't allowed. The cloud `gh` has no valid token. **Open the PR with the GitHub connector** (`create_branch`, `push_files`, `create_pull_request` with `draft: true`), and only after approval. `push_files` needs full file contents, so read backlink files with `get_file_contents` first.
- **Chrome `file_upload` only accepts cloud paths.** Stage folder images with `device_stage_files` first (`/mnt/user-data/uploads/<folder>/…`). Files under `/home/claude/...` work too. `/mnt/user-data/outputs/` is **rejected**, so put generated files (cropped images, JSON) in `/mnt/user-data/uploads/`.
- **No image folder? Export the doc instead.** Drive `download_file_content` with `exportMimeType: "application/zip"` returns base64 of an HTML export plus an `images/` folder. Match each image to its spot by the text just before it in the HTML. The export is **uncropped**: apply each object's `imageProperties.cropProperties` (`offsetTop`/`offsetBottom`/`offsetLeft`/`offsetRight` are fractions) with PIL, and check the result's aspect ratio against the doc's `embeddedObject.size`. The cloud proxy blocks the doc's `contentUri` image URLs.
- **Chrome may be signed in to the wrong X account.** Articles live on @posthog. Check `[data-testid=AppTabBar_Profile_Link]` (`/posthog` vs `/jinayoon_`). If it's wrong, ask Jina to switch accounts; don't switch them yourself.
- **JS results get cut off at about 1,000 characters.** Store results on `window` and read them back in slices, one block or a few lines at a time.
- **Getting files into a page:** inject a hidden input, `file_upload` to it, then read the `File`s in JS.
  ```js
  const inp=document.createElement('input'); inp.type='file'; inp.multiple=true; inp.id='claude-file-in';
  inp.setAttribute('aria-label','claude helper file input'); inp.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01';
  document.body.appendChild(inp);  // then: find "claude helper file input" → file_upload(ref, paths)
  ```
  Carry JSON the same way (segments, body). Never retype long content into JS.
- **Cross-origin images, fallback only.** x.com and linkedin.com block `fetch` to S3 in their page security policy. If an image only exists on a CDN, inject a button, *trusted-click* it to `window.open(imageUrl)`, then in the popup tab run `fetch(...)` and `window.opener.postMessage({claudeImg:true,name,blob}, origin)`. A listener in the editor tab stores the Blobs. The popup joins the tab group.
- A `javascript_tool` call times out after 45 s, but the script keeps running in the page. Poll for its results afterwards.
- Some JS outputs get `[BLOCKED: …]` (URLs with query strings, base64-looking ids). Return lengths, booleans or stripped strings instead.

## Step 1: Google Doc → `body.md` + `images.json`

1. Call `read_doc` (Google Docs connector). The result is huge and lands in a file. Parse the JSON with python, pick the tab by `tabProperties.title`/`tabId`, and walk `documentTab.body.content`.
   - Styles: `TITLE` → title, `SUBTITLE` → subtitle (Substack only), `HEADING_2` → `##`, `HEADING_3` → `###`. Skip empty headings, which are spacers.
   - Text runs: `textStyle.link.url`, `bold`, `italic`, and a monospace `weightedFontFamily` → inline code. Leading and trailing spaces stay *outside* the markers.
   - `inlineObjectElement` → `{{IMGn}}` in document order.
   - **Prompt blocks.** The prompts are paragraphs after the `### Steal this:` heading (later issues say `Steal this prompt:`), up to the next heading or image, separated by empty paragraphs. Turn each run into one fenced block. The doc formats them as a Google Docs code block: the text is Roboto Mono, and the first and last paragraphs hold private-use marker characters (``). Strip `[-]` from every run before anything else, or the first prompt paragraph won't be read as code. Confirm with Jina if it's ambiguous.
   - **Footnotes.** Either real Doc footnotes (`footnoteReference` plus `footnotes[id]`) or a literal superscript "1" with a "1 …" line at the end. Handle both: `[^1]` inline and `[^1]: text` at the end. Edits to a sentence can delete the superscript "1" by accident and leave the footnote line orphaned. If the line is there but the marker isn't, ask Jina before dropping the footnote.
   - If a heading is labeled inconsistently across sections (e.g. one "Steal this:" among five "Steal this prompt:"), mirror the doc and flag it.
   - Placeholders such as `[SUBSCRIBE/SHARE CTA]` mark where the Substack Template block goes.
   - Spicy reads and Join us: keep them for Substack only, as lists of `(title, url)`. A Spicy reads item with no link is a TODO for Jina.
2. Write `body.md` using posthog.com markdown conventions. Keep original absolute URLs at this stage.
   - Code blocks use the fence `` ```llm ``.
   - `{{IMGn}}` markers go on their own lines; `{{FORM}}` goes after the first section and at the end.
3. Write `images.json`: `{IMGn: {name, local: "<folder file>", alt}}`.
   - **Look at every image** (stage it, then Read). Match each to its spot by content, not by order.
   - Use any alt text the doc has (`embeddedObject.description`/`title`). Otherwise write alt text that names the type (diagram, Slack message, bar chart), gives the title in quotes, and states the takeaway or the exact numbers. Stay under 1000 characters, which is X's and LinkedIn's limit.
   - Flag misspellings rendered inside an image.
4. **Verify** by converting the doc to plain text per block and diffing it against `body.md` after you strip the markdown. Do it with a script and report the block counts.

## Step 2: Generate per-platform segments

Write `gen.py`, based on this run's version, to turn `body.md` into:

- `x_segments.json`: a list of `{"t":"html",html} | {"t":"code",text} | {"t":"img",id,alt} | {"t":"hr"}`.
  - `##` → `<hr>` segment, then `<h1>`.
  - `###` → `<h2>`.
  - Code → a `code` segment.
  - Inline `` `x` `` → `<code>` (X drops the styling, which is fine).
  - `[^1]` → `¹`, with the footnote as `<p>¹ text</p>`, then the footer.
- `linkedin_segments.json`: the same, except code → `<pre><code>…</code></pre>` and `##` → `<hr><h1>`, all inside the HTML. LinkedIn's paste handles those, so only images are separate segments.
- Merge consecutive HTML into one segment.

Inline converter (order matters): escape HTML → protect code spans → `[^1]` → links → `***x***` → `**x**` → `*x*` (no `\w`/`*` on either side) → restore code.

## Step 3: Substack draft (API, then one UI step)

Work from a tab on `newsletter.posthog.com` (logged in). All calls are same-origin `fetch`.

- **Read:** `GET /api/v1/drafts/{id}` returns `draft_title`, `draft_subtitle`, `draft_body` (ProseMirror JSON *string*), `cover_image`, `slug`, `postBylines`. Drafts have `slug: null`, so the public `/api/v1/posts/{slug}` endpoint only works after publishing. If the draft already has content, keep a copy on `window` and ask before overwriting it.
- **Upload an image:** `POST /api/v1/image` with JSON `{image: <dataURL>, postId}` returns `{url, imageWidth, imageHeight, bytes}` (S3 URL).
- **Write:** `PUT /api/v1/drafts/{id}` with JSON `{draft_title, draft_subtitle, draft_body: JSON.stringify(doc)}`. Fields you leave out are untouched. GET it again to verify.
- **ProseMirror shapes**, copied from a real draft:
  - Paragraph: `{type:'paragraph',attrs:{textAlign:null},content:[…]}`
  - Heading: `{type:'heading',attrs:{textAlign:null,level:2|3},content}`
  - Rule: `{type:'horizontal_rule'}`
  - Code: `{type:'code_block',attrs:{language:null},content:[{type:'text',text}]}`
  - List: `{type:'bullet_list',content:[{type:'list_item',content:[paragraph]}]}`
  - Image: `{type:'captionedImage',content:[{type:'image2',attrs:{src,srcNoWatermark:null,fullscreen:null,imageSize:null,height,width,resizeWidth:null,bytes,alt,title:null,type:'image/png',href:null,belowTheFold:false,topImage:false,internalRedirect:null,isProcessing:false,align:null,offset:false}}]}`
  - Inline footnote marker: `{type:'footnoteAnchor',attrs:{number:1}}`
  - Footnote at the very end: `{type:'footnote',attrs:{number:1},content:[paragraph]}`
  - Text marks: `strong`, `em`, `code`, and `{type:'link',attrs:{href,target:'_blank',rel:'noopener noreferrer nofollow',class:null}}`. A run can have several marks; a link split across runs repeats the same link mark.
  - **`code` can't share a run with any other mark** in Substack's editor schema. A linked code span (`hogli devex:feedback`) keeps the link and loses code; an italic code span (`FEATURE_FLAGS` in an italic bullet) keeps code and loses italic. Flag both to Jina.
- **Editor fallback:** the open editor exposes Tiptap as `document.querySelector('.ProseMirror').editor`. It uses camelCase node and mark names (`bold`, `italic`, `horizontalRule`, `codeBlock`, `bulletList`, `listItem`). Validate each block with `editor.schema.nodeFromJSON(b).check()`, then `editor.commands.setContent(doc, true)`; the `true` makes it autosave. Substack converts the names to the stored snake_case form.
- **House layout:**
  - Intro, then `hr`.
  - Each `## N. …` section ends with `### Steal this prompt:` + `code_block`, then `hr`.
  - The end sections get themed names and copy for each issue, and Jina finalizes them in Substack. **Read them from the current Substack draft instead of assuming.** The scheduled-agents issue had: an italic byline paragraph ("*Words by [Jina Yoon](https://x.com/jinayoon_), who …*") right after the last prompt; `hr`; `## 🕰️ Scheduled reads` with bold `[title](url)` + bold ` – Author` items; the CTA block with themed captions; `## 💼 Tasks we can't automate` (jobs, bold links, careers URLs with UTM); and the footnote last.
  - The posthog.com links inside Substack keep UTM params.
- **Template block (UI):** open the draft in the editor, put the caret at the CTA spot, then toolbar **Template** → Jina's saved template. Screenshot to confirm. [unverified: first run]
- **Cover:** set the `substack 1200x630` image. Try `PUT {cover_image: <uploaded url>}` [unverified]. If it doesn't work, use the post settings UI. Search/SEO title and description: leave them unless Jina asks.
- **Verify:** serialize `draft_body` back to `body.md` conventions in JS (upload `body.md` with the file-input trick) and diff block by block. This run: 51/51 identical.

## Step 4: X Article

The editor is Draft.js: `[data-testid=composer]`. Helpers (define them on `window` once):

```js
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ed=()=>document.querySelector('[data-testid=composer]');
async function caretEnd(){ const e=ed(); e.focus(); const l=[...e.querySelectorAll('[data-block="true"]')].pop();
  const w=document.createTreeWalker(l,NodeFilter.SHOW_TEXT); let n,last=null; while(n=w.nextNode()) last=n;
  const rg=document.createRange(); last? rg.setStart(last,last.data.length) : (rg.selectNodeContents(l), rg.collapse(false));
  const s=getSelection(); s.removeAllRanges(); s.addRange(rg); document.dispatchEvent(new Event('selectionchange')); await sleep(300); }
function paste(html){ const dt=new DataTransfer(); dt.setData('text/html',html); dt.setData('text/plain','x');
  ed().dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true})); }
function pasteImg(file){ const dt=new DataTransfer(); dt.items.add(file);
  ed().dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true})); }
async function insertMenu(name){ [...document.querySelectorAll('button,[role=button]')].find(b=>b.innerText.trim()==='Insert').click(); await sleep(600);
  [...document.querySelectorAll('[role=menuitem]')].find(m=>m.innerText.trim()===name).click(); await sleep(800); }
async function setCode(text){ const ta=document.querySelector('[role=dialog] textarea');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(ta,text); ta.dispatchEvent(new Event('input',{bubbles:true}));
  await sleep(300); [...document.querySelectorAll('[role=dialog] button')].find(b=>b.innerText.trim()==='Insert').click(); await sleep(800); }
async function style(name){ [...document.querySelectorAll('button,[role=button]')].find(b=>['Body','Heading','Subheading'].includes(b.innerText.trim())).click(); await sleep(500);
  [...document.querySelectorAll('[role=menuitem],[role=option]')].find(m=>m.innerText.trim()===name).click(); await sleep(400); }
```

1. **Title:** click the "Add a title" field and type it. Don't click right below the title: that's the author byline link, and it navigates away (the title still autosaves).
2. **Cover:** `input[data-testid=fileInput]` (jpg/png/webp) → `file_upload` the `X size` image → screenshot the crop → click **Apply**. The cover has no alt field.
3. **Body:** for each segment, call `caretEnd()` first, then:
   - `html` → `paste()`
   - `hr` → `insertMenu('Divider')`
   - `code` → `insertMenu('Code')` + `setCode()`. The language can stay empty.
   - `img` → `pasteImg()`, wait about 4 s, click the new section's **Edit** button with JS `.click()`, then do the alt text:
     1. **Trusted click** on the **ALT** tab.
     2. Set `textarea[data-testid=altTextInput]` with the native setter + `input` event.
     3. **Trusted click** on **Save**.
     4. **Wait 6 s or more before touching the editor again.** Otherwise the alt silently doesn't stick (4 of 7 had to be redone in the first run).
4. **Gotchas:**
   - `<h1>` = Heading and `<h2>` = Subheading. `<h3>` is dropped, inline code styling is dropped, and `<pre>` turns into plain text, which is why code goes through Insert → Code.
   - A **single-block paste keeps the current block's type.** A lone `<h2>Steal this:</h2>` or `<blockquote>` pasted onto an empty line stays Body. Fix it afterwards: trusted click on the line, then `style('Subheading')`, or the toolbar quote button. Multi-block pastes are fine.
   - **After the media dialog closes, Draft's selection jumps to the top of the doc.** Always call `caretEnd()` before the next paste.
   - `caretIn()` inside a middle block doesn't stick for style changes. Use a trusted click on the line instead.
   - X auto-links `#words` as hashtags, e.g. `#feature-request-feed` → `#feature`. Flag these, don't edit them.
   - Deleting a range: set a DOM range, then trusted Backspace. Starting the range at the beginning of a heading leaves an empty Heading block: switch it to Body, then trusted `Delete` to pull the next block up.
   - **Editing text inside an existing block:** a DOM selection set from JS does **not** reach Draft for a paste. The paste lands at the top of the doc and *prepends* to the first block, and cmd+z didn't undo it. Triple-click is unreliable too: it can select into the next block, or collapse before an atomic block (divider, code, image). What works:
     1. JS: put a **collapsed** caret at the start of the target text (tree-walk the block's `[data-text="true"]` text nodes) and dispatch `selectionchange`.
     2. **Trusted** `shift+ArrowRight` with `repeat: N`, where N is the length of the target text.
     3. JS: check that `getSelection().toString()` equals the target text exactly, and abort if not.
     4. Paste: `text/plain` only for plain text (it keeps the surrounding marks), HTML for links or bold (`<a href>…</a>`, or a whole paragraph's inline HTML). To delete, use a trusted `Backspace` instead of a paste.
   - **Reading the editor for a diff:** the top-level blocks are the children of `[data-contents="true"]`. A divider has `[role=separator]`, code has `[data-testid=markdown-code-block]`, an image has `img`, and headings have `h1`/`h2`.
5. **Verify:** rebuild the expected block texts and links from the segments and diff them against the editor DOM. Check every image's `aria-label` for its alt text. A link split around italics counts once.

## Step 5: LinkedIn Article (PostHog page → build mode newsletter)

- `/article/new/?author=urn:li:fsd_company:37415928` becomes `/article/edit/{id}` once the title is typed. The title is `textarea.article-editor-headline__textarea` (type it with the computer tool). The body is `.ProseMirror`.
- **Text:** trusted click in the body, then `caretEnd`/`paste` as above (use `.ProseMirror` and `lastElementChild`). One paste handles headings (`<h1>` → Heading/H2, `<h3>` → Subheading/H3), `<pre><code>`, `<hr>`, blockquote, lists, bold/italic, inline code and links. `<sup>` gets flattened, so use `¹`.
- **Images:** pasting a File worked once and then silently stopped. Use the toolbar image button instead:
  1. Grab it with `document.elementFromPoint(x,y).closest('button')` on the image icon (take a screenshot for coordinates). JS `.click()` works.
  2. Set `#media-editor-file-selector__file-input.files` from a `DataTransfer` and dispatch `change`.
  3. Click **Alternative text**, fill the textarea, click **Add**, then **Next**. All of this works from JS.
  4. Verify through `figure img.alt`.
- **Cover:** "Upload from computer" calls `input.click()`. Monkey-patch `HTMLInputElement.prototype.click` once so it injects the File and dispatches `change` instead of opening the native picker, then restore it. Click **Next** in the cover dialog. That "Next" is the dialog's, not the publish flow's. The cover has no alt field.
- **Auto-linkify trap:** after a paste, LinkedIn rewrites domain-looking text inside links. Seen: `AGENTS.md` → `http://AGENTS.md`, and `claude.ai` inside a link title → `http://claude.ai`.
  - **Always list every `href` starting with `http:`** and diff all hrefs against the segments.
  - Fix: select the text (DOM range + `selectionchange`), trusted click on the toolbar link button, edit the Link field, **Apply**.
- **Deleting a range:** from the end of the previous block's text to the end of the last unwanted block, then Backspace. That leaves no stray block.
- **Editing text inside an existing block:** unlike X, ProseMirror accepts a JS selection. Set a DOM range over the target text (exact match, then `selectionchange`), check `getSelection().toString()`, then dispatch a synthetic paste (`text/plain` for plain text, inline HTML for bold or links). To delete, use `document.execCommand('delete')`. Read top-level blocks from `.ProseMirror` children: `p`, `h2`, `h3`, `pre`, `ul`, `figure`, and `div.article-editor-horizontal-rule`.
- **Editing an existing image's alt text:** in the `figure`, JS-click the button labelled `Edit image`, then **Alternative text**. Set the dialog's `textarea` with the native setter + `input` event, then click the dialog's **Update** (this one only saves the alt, it doesn't publish), then **Next**. Afterwards, check that the figure count didn't change and that `img.alt` has the new text.
- **Never click "Next →"** in the top bar. That's the publish flow. On an article that's already live, the top-bar button says **Update** and republishes, so never click that either.

## Step 6: posthog.com newsletter file + PR (repo skill `post-newsletter`, adapted)

1. Read `.claude/skills/post-newsletter/SKILL.md` in the repo for the current rules: frontmatter, `<Caption>`, indentation, Cloudinary prefix rules, suggest-links, verification.
2. **File:** `contents/newsletter/{slug}.md`. Check for an existing file and inbound `/newsletter/{slug}` links, and look for `suggested-links-{slug}.md`. Use a recent Jina issue for frontmatter (`author: jina-yoon`, tags `Product engineers` + `Engineering`, `crosspost: Blog`, and a ~150-character `metaDescription`).
3. **Cloudinary uploads with no token exposure:** in a posthog.com tab, use the file-input trick for local files, then:
   ```js
   const fd=new FormData(); fd.append('files', new File([blob], name+'.png', {type:'image/png'}));
   const r=await fetch('https://better-animal-d658c56969.strapiapp.com/api/upload',{method:'POST',headers:{Authorization:'Bearer '+localStorage.getItem('jwt')},body:fd});
   const url=(await r.json())[0].url;   // strip /v123/ before using
   ```
   - Check the token's `exp` first, by decoding only that claim and returning only the date.
   - Name files `{slug}-{description}`. The hero is `website blog`.
   - Verify each URL returns 200 with the right dimensions (`createImageBitmap`).
4. **Build:** frontmatter + `body.md` with posthog.com links made relative (strip `?…`, keep `#…`), `![alt](cloudinary)` images, and `<NewsletterForm />` ×2. No Spicy reads, Join us or CTA.
5. **suggest-links:**
   - Follow the repo skill. The CSV is thin on AI topics, so grep `contents/` for related phrases too: "scheduled agent", "background agent", "loop", "flaky test", "cron", etc.
   - Apply High-priority forward links: unlinked product mentions such as surveys, product analytics, MCP (`/docs/model-context-protocol`) and the wizard (`/docs/ai-engineering/ai-wizard`).
   - Apply 2–3 backlinks that read naturally. Link the thing, not the claim, and use section anchors like `#4-diagnosing-flaky-tests`.
6. **Verify:** strip images and links from the final file and diff it against `body.md` (identical). External links must be byte-identical; count the images and forms.
7. **Write to `/mnt/user-data/outputs/`:** `{slug}.md` and `posthog-com-pr-draft.md`. The second holds the branch name `newsletter/{slug}`, the title, the backlink before/after lines, and a PR body that ends with the attribution lines from the system reminder.
8. **Ask Jina** before calling the GitHub connector.

## Re-syncing drafts after edits

Jina usually keeps editing after the first port, in both the doc and Substack. When she asks to make the platforms consistent:

1. **Settle which source wins for each part.** Usually the doc wins for the body, and Substack wins for the end sections (byline, reads, CTA, jobs). Ask if she hasn't said. Ask in the same round whether X and LinkedIn get only the footer line or also the reads/jobs (default: footer line only), and for any draft URLs you don't have. X drafts are listed at `x.com/compose/articles` when Chrome is signed in as @posthog.
2. **Build canonical body blocks from the doc** (Step 1 rules, plus UTMs on posthog.com links) and save them as JSON in `/mnt/user-data/uploads/`. Upload them to each platform's tab with the file-input trick.
3. **Diff each platform block by block** with an LCS over `kind|normalized text` (normalize curly quotes and whitespace), plus a separate link diff (`text → href`; a link split around italics counts once). Patch **only** the blocks that differ:
   - **Substack:** replace the changed blocks in the `draft_body` JSON, keeping the existing image nodes (she may have swapped in newer images) and the end sections. Check that `draft_updated_at` hasn't changed since your read, keep a backup on `window`, then `PUT` and verify.
   - **X / LinkedIn:** edit in place with the recipes in Steps 4 and 5. Don't rebuild the article.
4. **Mirror any fix back to the doc** only when Jina asks, and without UTMs.
5. **Re-run the diff** on every platform until the only differences left are known and intended (e.g. X's divider before the footnote). Report anything that's still live-only and needs an **Update** click.

## Step 7: Report

Keep it short and lead with what's done. Give one line per platform with its link, then:

- Divergences from the source (newer images, removed sections).
- TODOs left in drafts (quip, unlinked Spicy reads items).
- Auto-link or hashtag issues.
- The pending PR approval.
- The log file.

// Service worker: on toolbar click, pull the transcript from the active
// YouTube tab, stash it, and open the viewer tab.
//
// The scrape is injected into the page's MAIN world so it can reach the
// YouTube player API and the page's own `ytInitialPlayerResponse`.

chrome.action.onClicked.addListener(async (tab) => {
  const id = "tx_" + Date.now();

  if (tab.url && !/youtube\.com\/watch/.test(tab.url)) {
    await chrome.storage.local.set({
      [id]: { error: "Open a YouTube video page first (youtube.com/watch?v=…), then click the button." },
    });
    await chrome.tabs.create({ url: chrome.runtime.getURL("viewer.html") + "?id=" + id });
    return;
  }

  let result;
  try {
    const [out] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN", // need the page's player API + ytInitialPlayerResponse
      func: extractTranscript,
    });
    result = out && out.result;
  } catch (e) {
    result = { error: "Could not read the page: " + (e && e.message ? e.message : String(e)) };
  }

  await chrome.storage.local.set({ [id]: result || { error: "No data returned." } });
  await chrome.tabs.create({ url: chrome.runtime.getURL("viewer.html") + "?id=" + id });
});

// Runs in the YouTube page (MAIN world). Primary path: ask the player to load
// captions, capture the authenticated timedtext request it makes, and read the
// transcript straight from that feed. Fallback: scrape the transcript panel DOM.
async function extractTranscript() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- on-page loading popup ---------------------------------------------
  const overlayId = "__yt_tx_overlay";
  const showOverlay = () => {
    let host = document.getElementById(overlayId);
    if (host) return host;
    host = document.createElement("div");
    host.id = overlayId;
    host.style.cssText =
      "position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
    // Built with DOM APIs, not innerHTML: YouTube enforces Trusted Types, so
    // assigning an HTML string throws and aborts the whole extraction.
    const box = document.createElement("div");
    box.style.cssText =
      "background:#fff;color:#0f1115;padding:14px 20px;border-radius:12px;" +
      "box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;align-items:center;gap:13px;" +
      "font-size:14px;font-weight:500;";
    const spinner = document.createElement("span");
    spinner.style.cssText =
      "width:18px;height:18px;border:3px solid #d7dbe0;border-top-color:#2563eb;" +
      "border-radius:50%;display:inline-block;";
    spinner.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
      duration: 800,
      iterations: Infinity,
    });
    const msg = document.createElement("span");
    msg.id = "__yt_tx_msg";
    msg.textContent = "Pulling transcript…";
    box.append(spinner, msg);
    host.append(box);
    document.documentElement.appendChild(host);
    return host;
  };
  const setMsg = (m) => {
    const el = document.getElementById("__yt_tx_msg");
    if (el) el.textContent = m;
  };
  const hideOverlay = () => document.getElementById(overlayId)?.remove();

  // --- helpers -----------------------------------------------------------
  const fmtTime = (sec) => {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = String(sec % 60).padStart(2, "0");
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  };

  const json3ToItems = (json) => {
    const items = [];
    for (const ev of (json && json.events) || []) {
      if (!ev.segs) continue;
      const text = ev.segs
        .map((s) => s.utf8 || "")
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) continue;
      items.push({ type: "segment", t: fmtTime((ev.tStartMs || 0) / 1000), text });
    }
    return items;
  };

  const getPlayerResponse = () => {
    // Prefer the live player: ytInitialPlayerResponse is only set on a full page
    // load, so after in-app navigation it describes a different video (or none).
    const vidNow = new URLSearchParams(location.search).get("v");
    try {
      const live = document.getElementById("movie_player")?.getPlayerResponse?.();
      if (live && (!vidNow || live.videoDetails?.videoId === vidNow)) return live;
    } catch {}
    const init = window.ytInitialPlayerResponse;
    if (init && (!vidNow || init.videoDetails?.videoId === vidNow)) return init;
    if (init) return null;
    for (const s of document.querySelectorAll("script")) {
      const t = s.textContent;
      if (t && t.includes("ytInitialPlayerResponse")) {
        const m = t.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
        if (m) {
          try {
            return JSON.parse(m[1]);
          } catch {}
        }
      }
    }
    return null;
  };

  const captionTracksOf = (pr) =>
    (pr &&
      pr.captions &&
      pr.captions.playerCaptionsTracklistRenderer &&
      pr.captions.playerCaptionsTracklistRenderer.captionTracks) ||
    [];

  // The "spoken language" of the video. Auto-dubbed videos list an
  // auto-generated (asr) track for every dubbed language, sorted alphabetically,
  // so "the first asr track" is often Arabic rather than the original. Order:
  //   1. the language of the original (non-dubbed) audio track
  //   2. the only asr track, when there's just one (the normal, non-dubbed case)
  //   3. the player's default caption track for the default audio track
  //   4. the first asr track, then the first track of any kind
  const pickLang = (pr, tracks) => {
    const codes = tracks.map((t) => t.languageCode).filter(Boolean);
    const match = (lang) => {
      if (!lang) return null;
      lang = lang.toLowerCase();
      const base = lang.split("-")[0];
      return (
        codes.find((c) => c.toLowerCase() === lang) ||
        codes.find((c) => c.toLowerCase().split("-")[0] === base) ||
        null
      );
    };

    // 1. Original audio track, e.g. { id: "en-US.4", audioIsDefault: true } with
    //    no isAutoDubbed flag, while the dubs carry isAutoDubbed: true.
    const formats = (pr && pr.streamingData && pr.streamingData.adaptiveFormats) || [];
    const audio = formats.map((f) => f.audioTrack).filter(Boolean);
    const original =
      audio.find((a) => !a.isAutoDubbed && a.audioIsDefault) || audio.find((a) => !a.isAutoDubbed);
    const fromAudio = original && match(String(original.id || "").split(".")[0]);
    if (fromAudio) return fromAudio;

    // 2. Exactly one asr track.
    const asrTracks = tracks.filter((t) => t.kind === "asr");
    if (asrTracks.length === 1 && asrTracks[0].languageCode) return asrTracks[0].languageCode;

    // 3. Player's default caption track.
    const r = pr && pr.captions && pr.captions.playerCaptionsTracklistRenderer;
    const at = r && r.audioTracks && r.audioTracks[r.defaultAudioTrackIndex || 0];
    const def = at && typeof at.defaultCaptionTrackIndex === "number" && tracks[at.defaultCaptionTrackIndex];
    if (def && def.languageCode) return def.languageCode;

    // 4. Old behaviour.
    return (asrTracks[0] && asrTracks[0].languageCode) || (tracks[0] && tracks[0].languageCode) || "en";
  };

  const fetchJson3 = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const text = await res.text();
      if (!text) return null; // pot-gated responses come back 200-but-empty
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  // --- Strategy A: read captions via the player -------------------------
  // A1: try the plain track URLs (works where timedtext isn't pot-gated).
  // A2: drive the player to make its own authenticated request, capture that
  //     signed URL, and retarget it to the language we want. The signature
  //     doesn't cover `lang`, so one captured URL serves any track language.
  async function viaCaptions(pr) {
    const tracks = captionTracksOf(pr);
    if (!tracks.length) return null;
    const target = pickLang(pr, tracks);
    const vid =
      (pr && pr.videoDetails && pr.videoDetails.videoId) ||
      new URLSearchParams(location.search).get("v");

    // A1 — direct.
    const ordered = [
      tracks.find((t) => t.languageCode === target && t.kind !== "asr"),
      tracks.find((t) => t.languageCode === target),
      tracks[0],
    ].filter(Boolean);
    for (const tr of ordered) {
      const u = new URL(tr.baseUrl, location.origin);
      u.searchParams.set("fmt", "json3");
      const json = await fetchJson3(u.toString());
      const items = json3ToItems(json);
      if (items.length) return items;
    }

    // A2 — capture the player's authenticated request.
    const player =
      document.getElementById("movie_player") ||
      document.querySelector("#movie_player, .html5-video-player");
    if (!player || typeof player.loadModule !== "function") return null;

    let captured = null;
    const origFetch = window.fetch;
    const origOpen = XMLHttpRequest.prototype.open;
    const grab = (u) => {
      if (!u || u.indexOf("/api/timedtext") === -1 || u.indexOf("pot=") === -1) return;
      // Skip ad captions — the signature is bound to `v`, so only the target
      // video's own request can be retargeted to another language.
      if (vid && u.indexOf("v=" + vid) === -1) return;
      if (!captured) captured = u;
    };
    window.fetch = function (...a) {
      try {
        grab(typeof a[0] === "string" ? a[0] : a[0] && (a[0].url || a[0].href));
      } catch {}
      return origFetch.apply(this, a);
    };
    XMLHttpRequest.prototype.open = function (m, u, ...rest) {
      try {
        grab(String(u));
      } catch {}
      return origOpen.call(this, m, u, ...rest);
    };

    // Remember what (if anything) was showing so we can restore it.
    let priorTrack = null;
    try {
      priorTrack = player.getOption("captions", "track");
    } catch {}

    try {
      player.loadModule("captions");
      await sleep(200);
      const tl = player.getOption("captions", "tracklist") || [];

      // Selecting a track the player hasn't fetched yet forces a fresh network
      // request (which carries the pot). A track already cached in this session
      // won't refetch, so cycle through several candidates and, if none fires,
      // bounce the whole module to clear its cache and retry.
      // Capped: auto-dubbed videos list ~20 tracks, and on those the player's
      // requests often carry no pot at all, so cycling them all just delays
      // the transcript-panel fallback by a minute.
      const candidates = [
        ...tl.filter((t) => t.languageCode && t.languageCode !== target),
        ...tl,
      ].slice(0, 3);
      const tryForce = async () => {
        for (let c = 0; c < candidates.length && !captured; c++) {
          try {
            player.setOption("captions", "track", candidates[c]);
          } catch {}
          for (let i = 0; i < 10 && !captured; i++) await sleep(150);
        }
      };

      await tryForce();

      if (!captured) {
        try {
          player.unloadModule("captions");
          await sleep(200);
          player.loadModule("captions");
          await sleep(200);
        } catch {}
        await tryForce();
      }

      if (!captured) return null;

      // Build the request from the *target track's own* baseUrl, borrowing only
      // what the captured request adds on top (pot + client params). Swapping
      // `lang` on the captured URL isn't enough: tracks can differ in other
      // params too. On auto-dubbed videos the original-language track is
      // `variant=gemini` while the dubbed tracks are `variant=timing-optimized`,
      // and asking for the wrong variant returns an empty 200.
      const cap = new URL(captured, location.origin); // player may request a relative URL
      for (const tr of ordered) {
        const u = new URL(tr.baseUrl, location.origin);
        for (const [k, v] of cap.searchParams) {
          if (!u.searchParams.has(k) && k !== "tlang") u.searchParams.set(k, v);
        }
        u.searchParams.set("fmt", "json3");
        const items = json3ToItems(await fetchJson3(u.toString()));
        if (items.length) return items;
      }

      // Last resort: the old approach (captured URL retargeted by lang/kind).
      cap.searchParams.set("lang", target);
      cap.searchParams.delete("tlang");
      if (tracks.some((t) => t.languageCode === target && t.kind !== "asr")) cap.searchParams.delete("kind");
      else cap.searchParams.set("kind", "asr");
      cap.searchParams.set("fmt", "json3");
      const items = json3ToItems(await fetchJson3(cap.toString()));
      return items.length ? items : null;
    } finally {
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origOpen;
      // Restore the viewer's caption state.
      try {
        if (priorTrack && priorTrack.languageCode) player.setOption("captions", "track", priorTrack);
        else player.unloadModule("captions");
      } catch {}
    }
  }

  // --- Strategy B: scrape the transcript panel DOM (fallback) -----------
  const SEG = "ytd-transcript-segment-renderer";
  const HEADER = "ytd-transcript-section-header-renderer";
  // YouTube's redesigned ("modern") transcript panel renders each line as a
  // <transcript-segment-view-model> instead of the old segment renderer.
  const MODERN_SEG = "transcript-segment-view-model";
  const getSegs = () => document.querySelectorAll(SEG + ", " + MODERN_SEG);

  // Opens YouTube's transcript panel. The layout keeps changing (the "modern"
  // panel lives inside a combined Chapters/Transcript timeline panel and can
  // open on the Chapters tab), so try several approaches in turn and stop as
  // soon as transcript lines appear. Each attempt is noted in panelLog, which
  // goes into the error message if everything fails.
  const panelLog = [];
  const visible = (el) => !!el && el.getClientRects().length > 0;
  const textOf = (el) =>
    ((el.getAttribute && el.getAttribute("aria-label")) || "") + " " + (el.textContent || "");

  const waitSegs = async (ms) => {
    for (let t = 0; t < ms && getSegs().length === 0; t += 200) await sleep(200);
    return getSegs().length > 0;
  };

  // In the combined timeline panel, switch to the "Transcript" tab.
  const clickTranscriptTab = () => {
    const panels = document.querySelectorAll("ytd-engagement-panel-section-list-renderer");
    for (const panel of panels) {
      if (!visible(panel)) continue;
      const tabs = panel.querySelectorAll(
        '[role="tab"], button, yt-tab-shape, chip-shape, yt-chip-cloud-chip-renderer'
      );
      for (const tab of tabs) {
        if (/^\s*transcript\s*$/i.test(tab.textContent || "") && visible(tab)) {
          tab.click();
          return true;
        }
      }
    }
    return false;
  };

  const expandDescription = async () => {
    const expand = document.querySelector(
      "#description-inline-expander #expand, tp-yt-paper-button#expand, #expand"
    );
    if (expand && visible(expand)) {
      expand.click();
      await sleep(400);
    }
  };

  // The "Show transcript" button in the description.
  const findSectionButton = () => {
    const section = document.querySelector("ytd-video-description-transcript-section-renderer");
    if (!section) return null;
    // Prefer a real <button>: clicking a wrapper element doesn't reach the
    // button's own click handler.
    for (const sel of ["button", "a", "yt-button-shape", "ytd-button-renderer"]) {
      const els = Array.from(section.querySelectorAll(sel));
      const hit = els.find((b) => /transcript/i.test(textOf(b))) || els[0];
      if (hit) return hit;
    }
    return null;
  };

  // Any visible button/link mentioning "transcript" (e.g. in the ... menu).
  const findAnyTranscriptButton = () => {
    for (const sel of ["button", "a", "tp-yt-paper-item", "ytd-menu-service-item-renderer", "yt-button-shape", "ytd-button-renderer"]) {
      const hit = Array.from(document.querySelectorAll(sel)).find(
        (b) => visible(b) && /transcript/i.test(textOf(b))
      );
      if (hit) return hit;
    }
    return null;
  };

  async function openTranscriptPanel() {
    // 1. Description's "Show transcript" button.
    await expandDescription();
    const btn = findSectionButton();
    if (btn) {
      btn.click();
      panelLog.push("clicked description button");
      if (await waitSegs(3000)) return;
      if (clickTranscriptTab()) panelLog.push("clicked Transcript tab");
      if (await waitSegs(4000)) return;
    } else panelLog.push("no description button");

    // 2. Force the transcript engagement panel open directly.
    const panels = Array.from(
      document.querySelectorAll("ytd-engagement-panel-section-list-renderer")
    ).filter((p) => /transcript|timeline/i.test(p.getAttribute("target-id") || ""));
    for (const p of panels) {
      p.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED");
      panelLog.push("expanded panel " + p.getAttribute("target-id"));
    }
    if (panels.length) {
      if (await waitSegs(2500)) return;
      if (clickTranscriptTab()) panelLog.push("clicked Transcript tab");
      if (await waitSegs(4000)) return;
    }

    // 3. Any other visible "transcript" control.
    const other = findAnyTranscriptButton();
    if (other) {
      other.click();
      panelLog.push("clicked other transcript control");
      if (await waitSegs(2500)) return;
      if (clickTranscriptTab()) panelLog.push("clicked Transcript tab");
      await waitSegs(4000);
    } else panelLog.push("no other transcript control");
  }

  async function openAndScrapePanel() {
    if (getSegs().length === 0) {
      setMsg("Opening transcript…");
      await openTranscriptPanel();
      setMsg("Reading transcript…");
    }

    const segEls = getSegs();
    if (segEls.length === 0) return [];

    const container =
      document.querySelector("ytd-transcript-segment-list-renderer #segments-container") ||
      document.querySelector("#segments-container") ||
      (segEls[0] && segEls[0].parentElement);

    const items = [];
    // Modern segments look like:
    //   <transcript-segment-view-model>
    //     <div class="ytwTranscriptSegmentViewModelTimestamp">0:07</div>
    //     <div class="ytwTranscriptSegmentViewModelTimestampA11yLabel">7 seconds</div>
    //     <span role="text">All right, ...</span>
    // Use those class names when present; otherwise fall back to reading the
    // rendered text line by line (timestamp-looking line = time, screen-reader
    // lines like "2 minutes, 5 seconds" dropped, the rest = caption text).
    const TIME_RE = /^\d{1,2}(?::\d{2}){1,2}$/;
    const A11Y_RE = /^(\d+\s+(hours?|minutes?|seconds?),?\s*)+$/i;
    const pushModernSeg = (el) => {
      const tsEl = el.querySelector(".ytwTranscriptSegmentViewModelTimestamp");
      const txEl = el.querySelector('span[role="text"], .ytAttributedStringHost');
      if (tsEl && txEl) {
        const text = (txEl.textContent || "").replace(/\s+/g, " ").trim();
        if (text) items.push({ type: "segment", t: (tsEl.textContent || "").trim(), text });
        return;
      }
      const lines = (el.innerText || el.textContent || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const t = lines.find((l) => TIME_RE.test(l)) || "";
      const text = lines
        .filter((l) => !TIME_RE.test(l) && !A11Y_RE.test(l))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) items.push({ type: "segment", t, text });
    };

    const pushSeg = (el) => {
      if (el.tagName.toLowerCase() === MODERN_SEG) return pushModernSeg(el);
      const t = (el.querySelector(".segment-timestamp")?.textContent || "").trim();
      const text = (el.querySelector(".segment-text")?.textContent || el.textContent || "")
        .trim()
        .replace(/\s+/g, " ");
      if (text) items.push({ type: "segment", t, text });
    };

    // Modern panel: walk segments and chapter headings in page order.
    if (document.querySelector(MODERN_SEG)) {
      for (const el of document.querySelectorAll(MODERN_SEG + ", timeline-chapter-view-model")) {
        if (el.tagName.toLowerCase() === MODERN_SEG) pushModernSeg(el);
        else {
          const h = (el.innerText || el.textContent || "")
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !TIME_RE.test(l) && !A11Y_RE.test(l))[0];
          if (h) items.push({ type: "header", text: h });
        }
      }
      if (items.some((i) => i.type === "segment")) return items;
      items.length = 0;
    }

    if (container) {
      for (const el of container.children) {
        const name = el.tagName.toLowerCase();
        if (name === SEG) pushSeg(el);
        else if (name === HEADER) {
          const h = (el.textContent || "").trim().replace(/\s+/g, " ");
          if (h) items.push({ type: "header", text: h });
        }
      }
    }
    if (items.length === 0) segEls.forEach(pushSeg);
    return items;
  }

  // --- metadata ----------------------------------------------------------
  const metadata = (pr) => {
    const details = (pr && pr.videoDetails) || {};
    const titleEl = document.querySelector(
      "h1.ytd-watch-metadata yt-formatted-string, h1.ytd-watch-metadata, #title h1"
    );
    const title =
      details.title ||
      (titleEl?.textContent || document.title.replace(/\s*-\s*YouTube\s*$/, "")).trim();
    const channelEl = document.querySelector(
      "ytd-channel-name#channel-name a, #owner #channel-name a, ytd-channel-name a"
    );
    const channel = details.author || (channelEl?.textContent || "").trim();
    return { title, channel, url: location.href };
  };

  // --- run ---------------------------------------------------------------
  try {
    showOverlay();
    const pr = getPlayerResponse();

    let items = null;
    try {
      items = await viaCaptions(pr);
    } catch {}

    if (!items || !items.length) {
      items = await openAndScrapePanel();
    }

    if (!items || !items.length) {
      return {
        error:
          "No transcript found for this video. It may not have captions available, " +
          "or the page wasn't fully loaded — try again once the video has loaded." +
          (panelLog.length ? " [debug: " + panelLog.join("; ") + "]" : ""),
      };
    }

    return { ...metadata(pr), items };
  } catch (e) {
    return { error: "Could not read the transcript: " + (e && e.message ? e.message : String(e)) };
  } finally {
    hideOverlay();
  }
}

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

  // The "spoken language" of the video: the auto-generated (asr) track's
  // language, falling back to the first available track.
  const pickLang = (tracks) => {
    const asr = tracks.find((t) => t.kind === "asr");
    return (asr && asr.languageCode) || (tracks[0] && tracks[0].languageCode) || "en";
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
    const target = pickLang(tracks);
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
      const candidates = [
        ...tl.filter((t) => t.languageCode && t.languageCode !== target),
        ...tl,
      ];
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

      const u = new URL(captured, location.origin); // player may request a relative URL
      u.searchParams.set("lang", target);
      u.searchParams.delete("tlang");
      u.searchParams.set("fmt", "json3");
      const json = await fetchJson3(u.toString());
      const items = json3ToItems(json);
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
  const getSegs = () => document.querySelectorAll(SEG);

  async function openAndScrapePanel() {
    if (getSegs().length === 0) {
      setMsg("Opening transcript…");

      const findShowBtn = () => {
        const direct = document.querySelector(
          "ytd-video-description-transcript-section-renderer button, " +
            "ytd-video-description-transcript-section-renderer ytd-button-renderer"
        );
        if (direct) return direct;
        const byLabel = document.querySelector('button[aria-label*="transcript" i]');
        if (byLabel && byLabel.offsetParent !== null) return byLabel;
        const candidates = Array.from(
          document.querySelectorAll("button, a, yt-button-shape, ytd-button-renderer")
        );
        return candidates.find((b) =>
          ((b.getAttribute("aria-label") || "") + " " + (b.textContent || ""))
            .toLowerCase()
            .includes("transcript")
        );
      };

      // Expand the description ("...more") so the transcript section renders.
      for (let i = 0; i < 15 && getSegs().length === 0 && !findShowBtn(); i++) {
        const expand = document.querySelector(
          "#description-inline-expander #expand, tp-yt-paper-button#expand, #expand"
        );
        if (expand) {
          expand.click();
          await sleep(350);
          break;
        }
        await sleep(200);
      }

      for (let i = 0; i < 30 && getSegs().length === 0; i++) {
        const btn = findShowBtn();
        if (btn) {
          btn.click();
          break;
        }
        await sleep(200);
      }

      setMsg("Reading transcript…");
      for (let i = 0; i < 50 && getSegs().length === 0; i++) await sleep(200);
    }

    const segEls = getSegs();
    if (segEls.length === 0) return [];

    const container =
      document.querySelector("ytd-transcript-segment-list-renderer #segments-container") ||
      document.querySelector("#segments-container") ||
      (segEls[0] && segEls[0].parentElement);

    const items = [];
    const pushSeg = (el) => {
      const t = (el.querySelector(".segment-timestamp")?.textContent || "").trim();
      const text = (el.querySelector(".segment-text")?.textContent || el.textContent || "")
        .trim()
        .replace(/\s+/g, " ");
      if (text) items.push({ type: "segment", t, text });
    };

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
          "or the page wasn't fully loaded — try again once the video has loaded.",
      };
    }

    return { ...metadata(pr), items };
  } catch (e) {
    return { error: "Could not read the transcript: " + (e && e.message ? e.message : String(e)) };
  } finally {
    hideOverlay();
  }
}

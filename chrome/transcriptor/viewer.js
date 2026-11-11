// Reads the scraped transcript from storage, reflows it into readable
// Markdown, renders a preview, and wires up Copy / Download.

const params = new URLSearchParams(location.search);
const id = params.get("id");

const contentEl = document.getElementById("content");
const copyBtn = document.getElementById("copy");
const dlBtn = document.getElementById("download");
const toastEl = document.getElementById("toast");

const MARKER_EVERY = 120; // seconds between timestamp markers
const PARA_SOFT = 500; // start looking for a sentence end after this many chars
const PARA_HARD = 900; // force a paragraph break at this many chars

if (!id) {
  showError("Nothing to show.");
} else {
  chrome.storage.local.get(id, (obj) => {
    const data = obj[id];
    chrome.storage.local.remove(id);
    if (!data) return showError("Nothing to show — the transcript data expired.");
    if (data.error) return showError(data.error);
    const md = buildMarkdown(data);
    render(md, data);
  });
}

function toSeconds(ts) {
  if (!ts) return null;
  const parts = ts.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((a, b) => a * 60 + b, 0);
}

function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

function videoId(url) {
  try {
    return new URL(url).searchParams.get("v");
  } catch {
    return null;
  }
}

function buildMarkdown(data) {
  const lines = [];
  lines.push(`# ${data.title || "Transcript"}`);
  lines.push("");
  const meta = [];
  if (data.channel) meta.push(data.channel);
  if (data.url) meta.push(`[Watch on YouTube](${data.url})`);
  meta.push(new Date().toLocaleDateString());
  lines.push(`*${meta.join(" · ")}*`);
  lines.push("");
  lines.push("---");
  lines.push("");

  const vid = videoId(data.url || "");
  let para = "";
  let lastMarker = -Infinity;
  let wantBreak = false;

  const flush = () => {
    if (para.trim()) {
      lines.push(para.trim());
      lines.push("");
    }
    para = "";
    wantBreak = false;
  };

  const maybeMarker = (sec) => {
    if (sec == null || !vid) return;
    if (sec - lastMarker >= MARKER_EVERY) {
      const u = `https://www.youtube.com/watch?v=${vid}&t=${Math.floor(sec)}s`;
      lines.push(`### [${fmt(sec)}](${u})`);
      lines.push("");
      lastMarker = sec;
    }
  };

  for (const it of data.items || []) {
    if (it.type === "header") {
      flush();
      lines.push(`## ${it.text}`);
      lines.push("");
      continue;
    }
    const sec = toSeconds(it.t);
    if (para === "") maybeMarker(sec);
    para += (para ? " " : "") + it.text;

    if (wantBreak && /[.!?]["')\]]?$/.test(it.text.trim())) {
      flush();
      continue;
    }
    if (para.length >= PARA_SOFT) wantBreak = true;
    if (para.length >= PARA_HARD) flush();
  }
  flush();

  return lines.join("\n");
}

// --- minimal Markdown -> HTML for the preview (only the subset we generate) ---

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  s = escapeHtml(s);
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (m, t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return s;
}

function mdToHtml(md) {
  const out = [];
  for (const line of md.split("\n")) {
    if (line.trim() === "") continue;
    if (line.startsWith("### ")) out.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (line.startsWith("## ")) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith("# ")) out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.trim() === "---") out.push("<hr>");
    else out.push(`<p>${inline(line)}</p>`);
  }
  return out.join("\n");
}

function sanitizeFilename(title) {
  return (
    (title || "transcript")
      .replace(/[\\/:*?"<>|]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80)
      .toLowerCase() + "-transcript.md"
  );
}

function render(md, data) {
  contentEl.innerHTML = mdToHtml(md);
  document.title = (data.title || "Transcript") + " — Transcript";
  const filename = sanitizeFilename(data.title);

  copyBtn.onclick = () =>
    navigator.clipboard
      .writeText(md)
      .then(() => toast("Copied Markdown to clipboard"))
      .catch(() => toast("Copy failed"));

  dlBtn.onclick = () => {
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

function showError(msg) {
  contentEl.innerHTML = `<p class="empty">${escapeHtml(msg)}</p>`;
  copyBtn.disabled = true;
  dlBtn.disabled = true;
}

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

// Image Preview — plugin entry script.

// Pulls image/GIF links out of an arbitrary blob of text or HTML, ignoring everything else:
// <img src="...">, Markdown ![alt](url), and bare links ending in a common image extension
// (with an optional ?query string, e.g. Janitor-style "...?width=600"). Order-preserving, deduped.
// Safety: the pasted text is untrusted (it may come straight from a chat message), so scanning is bounded.
// Every pattern has a length limit, so a crafted wall of text cannot make it run for minutes (a "regex
// bomb"), only the first MAX_TEXT characters are read, and at most MAX_URLS links are returned.
// Reads the src="..." / src='...' value from the inside of one <img ...> tag, scanning it once.
function imgSrcFromTag(tag) {
  const n = tag.length;
  const isWs = (c) => c === 32 || c === 9 || c === 10 || c === 13 || c === 12;
  let i = 0;
  while (i < n) {
    while (i < n && (isWs(tag.charCodeAt(i)) || tag[i] === '/')) i++;
    let j = i;
    while (j < n && !isWs(tag.charCodeAt(j)) && tag[j] !== '=' && tag[j] !== '/') j++;
    const name = tag.slice(i, j).toLowerCase();
    i = j;
    while (i < n && isWs(tag.charCodeAt(i))) i++;
    let val = null;
    if (tag[i] === '=') {
      i++;
      while (i < n && isWs(tag.charCodeAt(i))) i++;
      const q = tag[i];
      if (q === '"' || q === "'") {
        const end = tag.indexOf(q, i + 1);
        if (end === -1) { val = tag.slice(i + 1); i = n; } else { val = tag.slice(i + 1, end); i = end + 1; }
      } else {
        let k = i;
        while (k < n && !isWs(tag.charCodeAt(k))) k++;
        val = tag.slice(i, k); i = k;
      }
    }
    if (name === 'src' && val !== null) return val;
    if (i === j && j < n && name === '') i++;                          // safety: always make progress
  }
  return null;
}

const MAX_TEXT = 300000;
const MAX_URLS = 1000;
// A bare link can swallow the bracket or punctuation right after it (e.g. the ")" closing a Markdown image
// "![x](https://…/a.jpg?w=1)"), which listed the same picture twice. Trim those; one linear pass, no regex.
function trimLinkEnd(u) {
  let end = u.length, open = 0, close = 0;
  for (let i = 0; i < end; i++) { const c = u.charCodeAt(i); if (c === 40) open++; else if (c === 41) close++; }
  while (end > 0) {
    const c = u.charCodeAt(end - 1);
    if (c === 41) { if (open >= close) break; close--; }                                         // ")" with no "(" before it
    else if (c !== 93 && c !== 125 && c !== 44 && c !== 46 && c !== 59 && c !== 33) break;      // ] } , . ; !
    end--;
  }
  return end === u.length ? u : u.slice(0, end);
}
function extractImageUrls(text) {
  const src = String(text || '').slice(0, MAX_TEXT);
  const urls = [];
  const seen = new Set();
  const add = (raw) => {
    if (!raw || urls.length >= MAX_URLS) return;
    const u = raw.trim().replace(/&amp;/g, '&');
    if (!u || u.length > 2048 || seen.has(u)) return;
    seen.add(u);
    urls.push(u);
  };

  // <img ...> tags: one linear pass (no regex backtracking), each character is looked at once.
  const lower = src.toLowerCase();
  let pos = 0, nextGt = -2;
  while (urls.length < MAX_URLS) {
    const i = lower.indexOf('<img', pos);
    if (i === -1) break;
    const c = src.charCodeAt(i + 4);                                  // must be a real "<img" tag, not "<imgx"
    if (!(c === 32 || c === 9 || c === 10 || c === 13 || c === 12 || c === 47 || c === 62)) { pos = i + 4; continue; }
    if (nextGt < i + 4) nextGt = src.indexOf('>', i + 4);             // reused until passed, so total work stays linear
    if (nextGt === -1) break;                                         // nothing after this point can close a tag
    if (nextGt - i > 4000) { pos = i + 4; continue; }                 // absurdly long "tag": ignore just this marker
    add(imgSrcFromTag(src.slice(i + 4, nextGt)));
    pos = nextGt + 1;
  }

  let m;
  const mdRe = /!\[[^\]]{0,300}\]\(([^)\s]{1,2048})\)/g;
  while ((m = mdRe.exec(src))) add(m[1]);

  const bareRe = /https?:\/\/[^\s"'<>]{1,1500}?\.(?:png|jpe?g|gif|webp|avif|bmp)(?:\?[^\s"'<>]{0,1500})?/gi;
  while ((m = bareRe.exec(src))) add(trimLinkEnd(m[0]));

  return urls;
}

tavo.plugin.onInputAction('extract-images', async () => {
  const text = await tavo.input.get();
  const urls = extractImageUrls(text || '');

  if (!urls.length) {
    try { tavo.utils.toast(tavo.plugin.i18n.t('runtime.extractNone')); } catch {}
    return;
  }

  // Hand the found links to the mounted /chat/body/end fragment (panel.html), which shows them
  // as a results gallery and handles pinning — entry.js only finds the links.
  try { window.dispatchEvent(new CustomEvent('emon-iv-extract-results', { detail: { urls } })); } catch {}

  // The pasted blob has done its job; clear it so it doesn't get sent as a chat message by mistake.
  try { tavo.input.clear(); } catch {}
});

tavo.plugin.onSidebarAction('reset-fab-position', async () => {
  // Clear the saved position so the FAB falls back to its default corner on next load.
  try { tavo.set('emonImageViewerFabPosition', null, 'global'); } catch {}

  // If Image Preview's panel is currently mounted on this chat page, snap the button back
  // right away instead of waiting for the next chat open.
  try { window.dispatchEvent(new CustomEvent('emon-iv-fab-reset')); } catch {}

  // Confirm the action fired and finished — this is a one-shot action, not a toggle,
  // so there is nothing left "on" to turn back off.
  try { tavo.utils.toast(tavo.plugin.i18n.t('runtime.fabResetToast')); } catch {}
});

// Opens the Recycle Bin picker (built and rendered inside panel.html, portaled to the page so it
// doesn't need the floating panel open) from the chat's right sidebar.
tavo.plugin.onSidebarAction('open-recycle-bin', async () => {
  try { window.dispatchEvent(new CustomEvent('emon-iv-open-recycle')); } catch {}
});

// Scans the open chat (character card, persona, lorebooks and messages) for image links. The scan and its
// picker live in panel.html; this just asks it to start, the same hand-off the Recycle Bin uses.
tavo.plugin.onSidebarAction('scan-chat', async () => {
  try { window.dispatchEvent(new CustomEvent('emon-iv-scan-chat')); } catch {}
});

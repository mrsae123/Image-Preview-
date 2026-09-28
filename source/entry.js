// Image Preview — plugin entry script.

// Pulls image/GIF links out of an arbitrary blob of text or HTML, ignoring everything else:
// <img src="...">, Markdown ![alt](url), and bare links ending in a common image extension
// (with an optional ?query string, e.g. Janitor-style "...?width=600"). Order-preserving, deduped.
function extractImageUrls(text) {
  const urls = [];
  const seen = new Set();
  const add = (raw) => {
    if (!raw) return;
    const u = raw.trim().replace(/&amp;/g, '&');
    if (!u || seen.has(u)) return;
    seen.add(u);
    urls.push(u);
  };

  const imgTagRe = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgTagRe.exec(text))) add(m[1]);

  const mdRe = /!\[[^\]]*\]\(([^)\s]+)\)/g;
  while ((m = mdRe.exec(text))) add(m[1]);

  const bareRe = /https?:\/\/[^\s"'<>]+?\.(?:png|jpe?g|gif|webp|avif|bmp)(?:\?[^\s"'<>]*)?/gi;
  while ((m = bareRe.exec(text))) add(m[0]);

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

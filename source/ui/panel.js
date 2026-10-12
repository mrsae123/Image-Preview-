(() => {
  // Tavo may mount a new copy of this fragment before it removes the old one, so two roots can exist for a moment: take the first one
  // no earlier run has wired up (document.getElementById would hand back the old, already-wired one and leave the new copy dead).
  const root = Array.prototype.find.call(document.querySelectorAll('#emon-iv-root'), (r) => r.dataset.ready !== '1');
  if (!root) return;
  root.dataset.ready = '1';
  // Everything below is looked up inside this copy's own root first (the page is the fallback for pop-ups that were moved out of it).
  const byId = (id) => root.querySelector('#' + id) || document.getElementById(id);

  // If this fragment gets mounted again in the same window (chat switch, plugin reload), the previous copy's window
  // listeners and Tavo subscriptions are released first, so nothing runs twice.
  try { window.__emonIvLife && window.__emonIvLife.abort(); } catch {}
  const life = new AbortController();
  window.__emonIvLife = life;
  const winOn = (type, fn, opts) => window.addEventListener(type, fn, { ...((opts && typeof opts === 'object') ? opts : { capture: !!opts }), signal: life.signal });
  // Messages between entry.js and this panel. This version's entry.js sends "<name>-v2"; the older plain names are still understood,
  // and in the capture phase, so an older copy of the panel that is still alive in the page (after an update without restarting
  // Tavo) never gets to react to them before the Terms are agreed to.
  const bus = (name, fn) => {
    // While this copy's page is gone a message is ignored and left unanswered (entry.js then tells the person the panel isn't ready);
    // otherwise it is marked as handled (preventDefault) before it runs.
    const run = (e) => { if (!root.isConnected) return; try { e.preventDefault(); } catch {} fn(e); };
    winOn(name + '-v2', run);
    winOn(name, (e) => { try { e.stopImmediatePropagation(); } catch {} run(e); }, { capture: true });
  };
  const offOnAbort = (off) => { if (typeof off === 'function') life.signal.addEventListener('abort', () => { try { off(); } catch {} }, { once: true }); };
  life.signal.addEventListener('abort', () => { try { document.querySelectorAll('[data-emon-pin]').forEach(n => n.remove()); } catch {} }, { once: true });

  const fab = byId('emon-iv-fab');
  const panel = byId('emon-iv-panel');
  const pouchFx = byId('emon-iv-pouch-fx');
  const pouchRope = byId('emon-iv-pouch-rope');
  const pouchLoop = byId('emon-iv-pouch-loop');
  const closeBtn = byId('emon-iv-close');
  const profilesEl = byId('emon-iv-profiles');
  const urlEl = byId('emon-iv-url');
  const previewBtn = byId('emon-iv-preview-btn');
  const statusEl = byId('emon-iv-status');
  const previewEl = byId('emon-iv-preview');
  const previewImg = byId('emon-iv-preview-img');
  if (previewImg) previewImg.referrerPolicy = 'no-referrer';
  const previewMeta = byId('emon-iv-preview-meta');
  const pinBtn = byId('emon-iv-pin');
  const saveBtn = byId('emon-iv-save');
  const importBtn = byId('emon-iv-import');
  const fullBtn = byId('emon-iv-full');
  const openBtn = byId('emon-iv-open');
  const saveDeviceBtn = byId('emon-iv-savedevice');
  const copyLinkBtn = byId('emon-iv-copylink');
  const infoOpenBtn = byId('emon-iv-info-open');
  const pinnedList = byId('emon-iv-pinned-list');
  const pinsClearBtn = byId('emon-iv-pins-clear');
  if (pinsClearBtn) pinsClearBtn.onclick = () => clearAllPins();
  const savedEl = byId('emon-iv-saved');
  const refreshSavedBtn = byId('emon-iv-refresh-saved');
  const clearSavedBtn = byId('emon-iv-clear-saved');
  const savedSelectToggleBtn = byId('emon-iv-saved-select-toggle');
  const savedSelectActions = byId('emon-iv-saved-select-actions');
  const savedPinSelectedBtn = byId('emon-iv-saved-pin-selected');
  const savedDeleteSelectedBtn = byId('emon-iv-saved-delete-selected');
  const savedSelectCancelRow = byId('emon-iv-saved-select-cancel-row');
  const savedSelectCancelBtn = byId('emon-iv-saved-select-cancel');
  let savedSelectMode = false;
  let savedSelectedPaths = new Set();
  let savedFilesCache = [];
  let savedActionBusy = false;
  const lookupPanel = byId('emon-iv-lookup-panel');
  const lookupHandle = byId('emon-iv-lookup-handle');
  const lookupBody = byId('emon-iv-lookup-body');
  const lookupSwing = byId('emon-iv-swing');
  // Every popup (help, info, rename, image actions) goes through these two, so closing it animates just like opening it.
  const _closeTimers = new WeakMap();
  const _openedAt = new WeakMap();
  // Tavo can render plugin fragments inside a transformed/scrolling host. In that situation a
  // position:fixed descendant of the fragment is no longer guaranteed to be viewport-fixed.
  // Modal overlays are therefore temporarily portaled to document.body while visible. This keeps
  // Saved Preview sheets and Info dialogs anchored to the actual phone viewport, regardless of the
  // host chat's scroll/transform state.
  const _modalHome = new WeakMap();
  // While any pop-up is portaled out to <body>, a light 1s check notices if Tavo removed this fragment
  // (chat closed / plugin reloaded) and sends the pop-ups home with it, so none is left stranded on
  // screen. It only runs while a pop-up is open; nothing runs otherwise.
  const _portaled = new Set();
  let _portalWatch = null;
  function _stopPortalWatch(){ if(_portalWatch){ clearInterval(_portalWatch); _portalWatch = null; } }
  function _startPortalWatch(){
    if(_portalWatch) return;
    _portalWatch = setInterval(()=>{
      if(root.isConnected) return;
      for(const el of [..._portaled]){
        clearTimeout(_closeTimers.get(el));
        el.classList.remove('show','closing');
        const home = _modalHome.get(el);
        if(home) home.appendChild(el); else el.remove();
        _portaled.delete(el);
      }
      _stopPortalWatch();
    }, 1000);
  }
  function portalModal(el){
    if(!el || el.parentNode === document.body) return;
    if(!_modalHome.has(el)) _modalHome.set(el, el.parentNode);
    document.body.appendChild(el);
    _portaled.add(el); _startPortalWatch();
  }
  function restoreModal(el){
    const home = _modalHome.get(el);
    if(home && el.parentNode === document.body) home.appendChild(el);
    if(el.parentNode !== document.body){ _portaled.delete(el); if(!_portaled.size) _stopPortalWatch(); }
  }
  function showModal(el){
    if(!el) return;
    document.querySelectorAll('.emon-iv-modal.show, .emon-iv-modal.closing').forEach(other => {
      if (other === el) return;
      clearTimeout(_closeTimers.get(other));
      other.classList.remove('show', 'closing');
      restoreModal(other);
    });
    clearTimeout(_closeTimers.get(el));
    portalModal(el);
    el.classList.remove('closing');
    el.classList.add('show');
    const card = el.querySelector('.emon-iv-modal-card');
    if (card) card.scrollTop = 0;
    _openedAt.set(el, Date.now());
  }
  function hideModal(el){
    if(!el || !el.classList.contains('show')) return;
    clearTimeout(_closeTimers.get(el));
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
      el.classList.remove('show','closing');
      restoreModal(el);
      return;
    }
    el.classList.remove('show'); el.classList.add('closing');
    _closeTimers.set(el, setTimeout(()=>{
      el.classList.remove('closing');
      restoreModal(el);
    }, 460));
  }
  // A tap that opens a popup can, on some devices, still fire a trailing "click" on the backdrop that just
  // appeared under the finger — which would read as "tap outside to close" and shut it instantly. Ignoring
  // backdrop clicks for a brief moment after opening filters that out without delaying a real outside tap.
  function bindBackdropClose(el, closeFn){
    if(!el) return;
    el.addEventListener('click', e => {
      if (e.target !== el) return;
      if (Date.now() - (_openedAt.get(el) || 0) < 350) return;
      closeFn();
    });
  }
  const lookupInput = byId('emon-iv-lookup-input');
  const lookupGo = byId('emon-iv-lookup-go');
  const lookupClear = byId('emon-iv-lookup-clear');
  const lookupStatus = byId('emon-iv-lookup-status');
  const lookupResult = byId('emon-iv-lookup-result');
  const lookupTarget = byId('emon-iv-target');
  const lookupTabs = [...document.querySelectorAll('.emon-iv-tab')];
  const searchKeyRow = byId('emon-iv-search-key-row');
  const searchKeyInput = byId('emon-iv-search-key');
  const searchKeySave = byId('emon-iv-search-key-save');
  const searchKeyClear = byId('emon-iv-search-key-clear');
  const searchKeyHint = byId('emon-iv-search-key-hint');
  const privacyToggle = byId('emon-iv-privacy-toggle');
  const historyToggle = byId('emon-iv-history-toggle');
  const historyOpenBtn = byId('emon-iv-history-open');
  const historyPanel = byId('emon-iv-history-panel');
  const historyList = byId('emon-iv-history-list');
  const historyClearBtn = byId('emon-iv-history-clear');
  const historyCloseBtn = byId('emon-iv-history-close');
  let lookupMode = 'translate';

  const gameBtn = byId('emon-iv-game-btn');
  const gameEl = byId('emon-iv-game');
  const gameDragHandle = byId('emon-iv-game-drag');
  const gamePauseBtn = byId('emon-iv-game-pause');
  const gameCloseBtn = byId('emon-iv-game-close');
  const gameCanvas = byId('emon-iv-game-canvas');
  const gameScoreEl = byId('emon-iv-game-score');
  const gameBestEl = byId('emon-iv-game-best');
  const gameBestBtn = byId('emon-iv-game-best-btn');
  const gameSettingsToggle = byId('emon-iv-game-settings-toggle');
  const gameSettingsEl = byId('emon-iv-game-settings');
  const gamePicker = byId('emon-iv-game-picker');
  const gameCustomInput = byId('emon-iv-game-custom');
  const gameCustomClearBtn = byId('emon-iv-game-custom-clear');
  const gameNameGate = byId('emon-iv-game-namegate');
  const gameNameInput = byId('emon-iv-game-name-input');
  const gameNameSave = byId('emon-iv-game-name-save');
  const gameChangeNameBtn = byId('emon-iv-game-change-name');
  const gameTiersEl = byId('emon-iv-game-tiers');
  const gameTiersList = byId('emon-iv-game-tiers-list');
  const gameTiersClose = byId('emon-iv-game-tiers-close');
  const gameRelaxedToggle = byId('emon-iv-game-relaxed');
  const gameResetRunBtn = byId('emon-iv-game-reset-run');
  const gameResetBestBtn = byId('emon-iv-game-reset-best');
  const gameResizeHandle = byId('emon-iv-game-resize');
  const gctx = gameCanvas ? gameCanvas.getContext('2d') : null;

  const cfg = () => tavo.plugin.config.all();
  let currentPreview = null;
  let pins = [];
  const MAX_PINS = 30;        // pinned images on screen at once (remove one to pin another)
  let pinsOverflow = [];      // saved pins beyond the limit (from older versions): kept safe in storage, not drawn
  let pinSeq = 0;

  function t(key, params) {
    return tavo.plugin.i18n.t(key, params);
  }

  // Keep floating controls clear of Tavo's own top bar / composer using the documented
  // tavo.ui insets API, with a conservative fallback on older Tavo versions that lack it.
  function safeInsets(){
    try{
      if (tavo.ui && typeof tavo.ui.getInsets === 'function') {
        const i = tavo.ui.getInsets() || {};
        const top = Number(i.topBar);
        const bottom = Number(i.bottomInput);
        return { top: Number.isFinite(top) ? top+4 : 8, bottom: Number.isFinite(bottom) ? bottom+4 : 8 };
      }
    }catch{}
    return { top: 8, bottom: 8 };
  }

  function renderText() {
    // pop-ups that are open right now live on <body> (outside root), so they are refreshed too
    [root, ..._portaled].forEach(scope => {
      scope.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
      scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
      scope.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.title); });
    });
    refreshTermsUI();
    relabelPins();
    if(lookupMode==='search') refreshSearchKeyUI();
    refreshPrivacyUI();
    renderPinsList();
  }

  let statusTimer = 0;
  function setStatus(msg) {
    statusEl.textContent = msg || '';
    clearTimeout(statusTimer);
    // finished messages fade away on their own; progress messages (ending in …) wait for the next update
    if (msg && !/(…|\.\.\.)$/.test(msg)) statusTimer = setTimeout(() => { statusEl.textContent = ''; }, 7000);
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---- Link & download safety ----
  // Only public http(s) addresses are ever opened or downloaded. Anything that points at this phone or at a
  // home/office network (localhost, 192.168.x.x, 10.x.x.x, *.local, single-word names like "router" ...) is
  // refused, and non-web schemes (javascript:, intent:, file:, ...) never reach the system browser. This looks at the address as it is
  // written (including names that spell out a private IP, like 192-168-1-1.sslip.io): it cannot see where a public name really points
  // or where a redirect leads, so it stops the obvious cases, not every trick.
  function isPrivateHostBasic(hostname) {
    const h = String(hostname || '').toLowerCase().replace(/\.$/, '');
    if (!h) return true;
    if (h.startsWith('[') || h.includes(':')) return true;                       // IPv6 literals: not needed for image links
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {                                       // IPv4 (the URL parser already normalises 0x7f000001, 2130706433 ...)
      const [a, b] = h.split('.').map(Number);
      return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
          || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) || (a === 192 && b === 0);
    }
    if (!h.includes('.')) return true;                                           // "router", "nas", "localhost": intranet-style names
    return /\.(local|localhost|localdomain|internal|intranet|lan|home|corp|private|home\.arpa)$/.test(h);
  }
  // Wildcard-DNS services turn a name into whatever IP is written inside it (192-168-1-1.sslip.io -> 192.168.1.1), so they are refused
  // outright, and so is any name that spells out a private IPv4 address between dots or dashes.
  const WILDCARD_DNS_RE = /(?:^|\.)(?:nip\.io|sslip\.io|xip\.io|traefik\.me|localtest\.me|lvh\.me|vcap\.me|local\.gd|lacolhost\.com|127-0-0-1\.org\.uk)$/;
  const EMBEDDED_IPV4_RE = /(?:^|[.-])(\d{1,3})[.-](\d{1,3})[.-](\d{1,3})[.-](\d{1,3})(?:$|[.-])/;
  function isPrivateHost(hostname) {
    if (isPrivateHostBasic(hostname)) return true;
    const h = String(hostname || '').toLowerCase().replace(/\.$/, '');
    if (WILDCARD_DNS_RE.test(h)) return true;
    const e = EMBEDDED_IPV4_RE.exec(h);
    return !!(e && +e[1] <= 255 && +e[2] <= 255 && isPrivateHostBasic(e[1] + '.' + e[2] + '.' + e[3] + '.' + e[4]));
  }
  function isPublicHttpUrl(raw) {
    try {
      const s = String(raw || '');
      if (s.length > 4096) return false;
      const u = new URL(s);
      return /^https?:$/i.test(u.protocol) && !u.username && !u.password && !isPrivateHost(u.hostname);
    } catch { return false; }
  }
  function isBlockedWebTarget(raw) {   // a well-formed web address that we refuse (used to show the right message)
    try { const u = new URL(String(raw || '').trim()); return /^https?:$/i.test(u.protocol) && !isPublicHttpUrl(u.href); } catch { return false; }
  }
  function openSafe(raw) {
    const s = String(raw || '').trim();
    if (!s || /^files\//i.test(s)) return;                                       // a file kept inside Tavo has no web page to open
    if (!isPublicHttpUrl(s)) { tavo.utils.toast(t('runtime.urlBlocked')); return; }
    tavo.utils.openUrl(new URL(s).href);
  }

  const MAX_DATA_URL = 8000000;   // a pasted data: image bigger than this is refused (it would be copied into saved pins)
  function normalizeUrl(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;
    if (/^data:image\//i.test(s)) return s.length <= MAX_DATA_URL ? s : null;
    if (s.length > 4096) return null;
    try {
      const u = new URL(s);
      if (!/^https?:$/i.test(u.protocol)) return null;
      return isPublicHttpUrl(u.href) ? u.href : null;
    } catch {
      return null;
    }
  }

  // ---- Terms of Use ----
  // A short, friendly agreement the person ticks once before anything opens (the button, Extract images, Scan chat,
  // Recycle Bin). The answer stays on this phone only (global scope) together with the terms version: raise
  // TERMS_VERSION when the terms change in an important way and everyone is asked again.
  const TERMS_VAR = 'emonImageViewerTerms';
  const TERMS_VERSION = 1;
  const TAVO_TERMS_URL = 'https://docs.tavoai.dev/en/terms-of-service/';
  const SUPPORT_DISCORD_URL = 'https://discord.gg/pHJffeGrsP';
  const termsEl = byId('emon-iv-terms');
  const termsOkEl = byId('emon-iv-terms-ok');
  const termsAgreeBtn = byId('emon-iv-terms-agree');
  const termsLaterBtn = byId('emon-iv-terms-later');
  const termsMoreBtn = byId('emon-iv-terms-more');
  const termsFullEl = byId('emon-iv-terms-full');
  const termsTavoBtn = byId('emon-iv-terms-tavo');
  let termsPending = null, termsReadOnly = false;
  function termsAgreed() {
    try { const v = tavo.get(TERMS_VAR, 'global'); return !!(v && typeof v === 'object' && Number(v.v) >= TERMS_VERSION); } catch { return false; }
  }
  function refreshTermsUI() {
    try {
      termsMoreBtn.textContent = t(termsFullEl.hidden ? 'runtime.termsMore' : 'runtime.termsLess');
      termsAgreeBtn.textContent = t(termsReadOnly ? 'runtime.termsClose' : 'runtime.termsAgree');
    } catch {}
  }
  function showTerms(readOnly) {
    termsReadOnly = !!readOnly;
    termsEl.classList.toggle('readonly', termsReadOnly);
    termsOkEl.checked = termsReadOnly;
    termsAgreeBtn.disabled = !termsReadOnly;
    termsFullEl.hidden = true;
    termsMoreBtn.setAttribute('aria-expanded', 'false');
    refreshTermsUI();
    showModal(termsEl);
  }
  // Runs `next` straight away once the terms are agreed to; until then it shows them, and runs `next` only after "Agree".
  function requireTerms(next) {
    if (termsAgreed()) { if (next) next(); return true; }
    termsPending = next || null;
    showTerms(false);
    return false;
  }
  function agreeTerms() {
    if (termsReadOnly) { hideModal(termsEl); return; }
    if (!termsOkEl.checked) return;
    try { tavo.set(TERMS_VAR, { v: TERMS_VERSION, at: new Date().toISOString() }, 'global'); } catch {}
    if (!termsAgreed()) { tavo.utils.toast(t('runtime.error')); return; }   // it could not be remembered: don't pretend it was
    const next = termsPending; termsPending = null;
    hideModal(termsEl);
    tavo.utils.toast(t('runtime.termsThanks'));
    startApp();
    if (next) setTimeout(next, 150);
  }
  function declineTerms() {
    const wasReadOnly = termsReadOnly;
    termsPending = null;
    hideModal(termsEl);
    if (!wasReadOnly) tavo.utils.toast(t('runtime.termsDeclined'));
  }
  // The plugin's own start-up work (restoring pins, tidying temp files, emptying an expired Recycle Bin) waits for the agreement too.
  let _started = false;
  function startApp() {
    if (_started || !termsAgreed()) return false;
    _started = true;
    cleanTempPages(); purgeExpiredRecycleBin(); restorePins();
    return true;
  }
  termsOkEl.onchange = () => { if (!termsReadOnly) termsAgreeBtn.disabled = !termsOkEl.checked; };
  termsAgreeBtn.onclick = agreeTerms;
  termsLaterBtn.onclick = declineTerms;
  termsMoreBtn.onclick = () => { termsFullEl.hidden = !termsFullEl.hidden; termsMoreBtn.setAttribute('aria-expanded', termsFullEl.hidden ? 'false' : 'true'); refreshTermsUI(); };
  termsTavoBtn.onclick = () => openSafe(TAVO_TERMS_URL);
  bindBackdropClose(termsEl, declineTerms);
  const aboutTermsBtn = byId('emon-iv-about-terms');
  const aboutDiscordBtn = byId('emon-iv-about-discord');
  if (aboutTermsBtn) aboutTermsBtn.onclick = () => showTerms(true);
  if (aboutDiscordBtn) aboutDiscordBtn.onclick = () => openSafe(SUPPORT_DISCORD_URL);

  // ---- What may be downloaded: images, GIFs and web pages, nothing else ----
  // Videos, music, archives, apps, documents, fonts, model files and other files are refused before anything is fetched.
  // A link's file ending is checked first; when it has none, the server is asked for its headers only (the body is never read).
  const BLOCKED_EXT = new Set(('mp4 m4v mkv webm mov avi wmv flv f4v mpg mpeg mpe 3gp 3g2 ts m2ts mts ogv vob rm rmvb asf divx ' +
    'mp3 wav flac ogg oga opus m4a aac wma aiff mid midi amr ' +
    'zip rar 7z tar gz tgz bz2 xz zst lz lzma cab iso img dmg vhd vmdk pkg ' +
    'apk xapk apks aab ipa exe msi msix bat cmd scr dll dylib bin jar war deb rpm appimage ps1 vbs ' +
    'pdf doc docx xls xlsx ppt pptx odt ods odp rtf epub mobi azw3 djvu cbz cbr csv tsv json xml sql db sqlite ' +
    'torrent ttf otf woff woff2 eot psd eps indd xcf blend fbx obj stl 3mf ' +
    'tpg thm charx safetensors gguf ggml ckpt pth onnx pkl npz h5 pb tflite').split(' '));
  const PAGE_MAX_BYTES = 6 * 1024 * 1024, IMAGE_MAX_BYTES = 50 * 1024 * 1024, TMP_MAX_BYTES = 25 * 1024 * 1024;
  function fileExtOf(u) {
    try {
      let last = new URL(String(u)).pathname.split('/').pop() || '';
      try { last = decodeURIComponent(last); } catch {}
      const m = /\.([a-z0-9]{1,14})$/i.exec(last);
      return m ? m[1].toLowerCase() : '';
    } catch { return ''; }
  }
  const isBlockedFileType = (u) => BLOCKED_EXT.has(fileExtOf(u));
  const isFetchableUrl = (u) => isPublicHttpUrl(u) && !isBlockedFileType(u);
  const blockedErr = (key) => Object.assign(new Error(key), { msgKey: key });
  // Headers only: ask what a link is without downloading it. { kind: image | page | big | blocked | unknown } or null when the
  // server doesn't let us look (then nothing is assumed). The body is cancelled right away and never read.
  async function peekType(url, ms = 6000) {
    if (typeof fetch !== 'function') return null;
    const ac = (typeof AbortController === 'function') ? new AbortController() : null;
    const timer = setTimeout(() => { try { ac && ac.abort(); } catch {} }, ms);
    try {
      const r = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: ac ? ac.signal : undefined });
      let redirectedAway = false;
      try { redirectedAway = !!(r.redirected && r.url && !isPublicHttpUrl(r.url)); } catch {}
      const head = (n) => { try { return (r.headers && r.headers.get && r.headers.get(n)) || ''; } catch { return ''; } };
      const type = String(head('content-type')).split(';')[0].trim().toLowerCase();
      const len = Number(head('content-length')) || 0;
      try { ac && ac.abort(); } catch {}                                        // headers are all we wanted: stop the body right here
      try { const c = r.body && r.body.cancel && r.body.cancel(); c && c.catch && c.catch(() => {}); } catch {}
      if (redirectedAway) return { kind: 'blocked' };
      if (!type || type === 'application/octet-stream' || type === 'binary/octet-stream') return { kind: 'unknown', len };
      if (type.startsWith('image/')) return { kind: len > IMAGE_MAX_BYTES ? 'big' : 'image', len };
      if (type === 'text/html' || type === 'application/xhtml+xml') return { kind: len > PAGE_MAX_BYTES ? 'big' : 'page', len };
      return { kind: 'blocked', type };
    } catch { return null; }
    finally { clearTimeout(timer); }
  }
  // The same link is not asked about twice, and a batch asks about its next links a few at a time while it works.
  const _peekCache = new Map();
  function peekCached(url) {
    let p = _peekCache.get(url);
    if (!p) { p = peekType(url); _peekCache.set(url, p); setTimeout(() => _peekCache.delete(url), 90000); }
    return p;
  }
  function prefetchPeeks(urls, width = 6) {
    const todo = [...new Set(urls)].filter(u => /^https?:/i.test(u || '') && !isBlockedFileType(u) && !_peekCache.has(u)).slice(0, 300);
    let i = 0;
    const worker = async () => { while (i < todo.length) await peekCached(todo[i++]); };
    for (let k = 0; k < Math.min(width, todo.length); k++) worker();
  }
  async function fileSizeOf(path) {
    try {
      let cursor;
      for (let pageNo = 0; pageNo < 50; pageNo++) {
        const opts = { scope: 'chat', limit: 200 }; if (cursor) opts.cursor = cursor;
        const page = await tavo.file.list(opts);
        const hit = ((page && page.files) || []).find(f => f.path === path);
        if (hit) return Number(hit.size) || 0;
        if (!page || !page.nextCursor) break;
        cursor = page.nextCursor;
      }
    } catch {}
    return -1;
  }

  function looksLikeImage(url) {
    return /^data:image\//i.test(url) || /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(url);
  }

  function absUrl(base, value) {
    if (!value) return null;
    try { return new URL(value, base).href; } catch { return null; }
  }

  function decodeHtml(s) {
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
  }

  // ---- Image loading: try several candidate images until one really loads. Never an ad, never a tracker. ----
  // Privacy: only the page/image the user typed, plus the image files that page itself points to. Nothing goes through
  // a third-party service, ad/tracker hosts are never contacted, and images are requested with no Referer header.
  const AD_HOSTS = [
    'doubleclick.net','googlesyndication.com','googleadservices.com','adservice.google.com','adsystem.com','amazon-adsystem.com',
    'adnxs.com','taboola.com','outbrain.com','criteo.com','criteo.net','rubiconproject.com','pubmatic.com','openx.net','adform.net',
    'moatads.com','scorecardresearch.com','quantserve.com','googletagmanager.com','google-analytics.com','ads-twitter.com',
    'adsrvr.org','casalemedia.com','smartadserver.com','yieldmo.com','mgid.com','revcontent.com','zedo.com','popads.net',
    'exoclick.com','trafficjunky.com','juicyads.com','adcash.com','2mdn.net','serving-sys.com','bidswitch.net','teads.tv',
    'media.net','adsafeprotected.com','doubleverify.com','connect.facebook.net','hotjar.com','clarity.ms','bat.bing.com',
    'adroll.com','mc.yandex.ru','an.yandex.ru','propellerads.com','onclickads.net','popcash.net','adskeeper.com','admaven.com'
  ];
  const AD_PATH_RE = /(^|[\/_.\-])(ads?|adv|adserver|adserv|advert|adverts|advertis\w*|sponsor\w*|tracking|tracker|beacon|doubleclick|affiliate)([\/_.\-]|$)/i;
  const AD_CTX_RE = /(^|[\s_-])(ad|ads|adv|advert|advertisement|adsense|adslot|sponsor|sponsored|taboola|outbrain|doubleclick)([\s_-]|$)/i;
  const AD_SIZES = ['300x250','728x90','970x90','970x250','160x600','300x600','320x50','320x100','468x60','336x280','120x600','300x50','234x60','120x240','125x125'];
  function hostOf(u){ try{ return new URL(u).hostname.toLowerCase(); }catch{ return ''; } }
  function isAdHost(u){ const h = hostOf(u); return !!h && AD_HOSTS.some(a=>h === a || h.endsWith('.'+a)); }
  function isAdPath(u){ try{ return AD_PATH_RE.test(new URL(u).pathname); }catch{ return false; } }
  function isAdSize(w,h){ return AD_SIZES.indexOf(w+'x'+h) >= 0; }
  function inAdContext(node){
    let el = node, depth = 0;
    while(el && el.nodeType === 1 && depth < 5){
      if(el.tagName === 'INS' || el.tagName === 'IFRAME') return true;
      if(AD_CTX_RE.test((el.getAttribute('class') || '') + ' ' + (el.id || ''))) return true;
      if(/sponsored/i.test(el.getAttribute('rel') || '')) return true;
      el = el.parentElement; depth++;
    }
    return false;
  }

  // Every usable image the page points to, best first: social-preview tags, then JSON-LD, then real page images, then icons.
  function extractPageImages(html, baseUrl) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = [], seen = new Set();
    let pageTitle = '';
    try {
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      pageTitle = ((ogTitle && ogTitle.content) || doc.title || '').trim().slice(0, 80);
    } catch {}
    const add = (value, source, extra) => {
      const abs = absUrl(baseUrl, decodeHtml(String(value || '').trim()));
      if(!abs || !(/^https?:/i.test(abs) || /^data:image\//i.test(abs))) return;
      if(/^https?:/i.test(abs) && (isAdHost(abs) || !isFetchableUrl(abs))) return;
      if(source === 'content' && isAdPath(abs)) return;
      if(seen.has(abs)) return;
      seen.add(abs);
      out.push(Object.assign({url:abs, source}, extra || {}));
    };
    const metaSelectors = [
      'meta[property="og:image"]','meta[property="og:image:secure_url"]','meta[property="og:image:url"]',
      'meta[name="twitter:image"]','meta[name="twitter:image:src"]','meta[itemprop="image"]'
    ];
    metaSelectors.forEach(sel => doc.querySelectorAll(sel).forEach(n => add(n.content, 'metadata')));
    doc.querySelectorAll('link[rel="image_src"],link[rel="image"]').forEach(n => add(n.getAttribute('href'), 'metadata'));

    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        const stack = Array.isArray(data) ? [...data] : [data];
        let guard = 0;
        while(stack.length && guard++ < 400){
          const x = stack.shift();
          if(!x) continue;
          if(typeof x === 'string'){ if(looksLikeImage(x)) add(x, 'metadata'); continue; }
          if(typeof x === 'object'){
            if(typeof x.image === 'string') add(x.image, 'metadata');
            else if(Array.isArray(x.image)) x.image.forEach(v => add(typeof v === 'string' ? v : v && v.url, 'metadata'));
            else if(x.image && typeof x.image === 'object') add(x.image.url, 'metadata');
            Object.values(x).forEach(v => { if(v && typeof v === 'object') stack.push(v); });
          }
        }
      } catch {}
    });

    const content = [];
    doc.querySelectorAll('img[src], img[data-src], img[data-original], img[srcset]').forEach((node, order) => {
      if(inAdContext(node)) return;
      const raw = node.getAttribute('src') || node.getAttribute('data-src') || node.getAttribute('data-original');
      const srcset = node.getAttribute('srcset');
      let candidate = raw;
      if(srcset){
        // the largest entry of the srcset
        const parts = srcset.split(',').map(p => p.trim().split(/\s+/)).filter(p => p[0]);
        parts.sort((a,b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0));
        if(parts[0]) candidate = parts[0][0];
      }
      const w = parseInt(node.getAttribute('width'), 10), h = parseInt(node.getAttribute('height'), 10);
      if(w && h && (Math.min(w,h) < 80 || isAdSize(w,h))) return;
      content.push({value:candidate, area:(w && h) ? w*h : 0, order});
    });
    content.sort((a,b) => (b.area - a.area) || (a.order - b.order)).slice(0,6).forEach(c => add(c.value, 'content'));

    doc.querySelectorAll('link[rel="apple-touch-icon"],link[rel="icon"],link[rel="shortcut icon"]').forEach(n => add(n.getAttribute('href'), 'icon'));
    const sliced = out.slice(0,10); sliced.pageTitle = pageTitle; return sliced;
  }

  // Loads one candidate for real (no Referer, hard timeout) and reports its size, or null if it fails.
  function probeImage(url, timeoutMs = 9000) {
    return new Promise(resolve => {
      const im = new Image();
      let done = false;
      const finish = v => { if(done) return; done = true; clearTimeout(timer); im.onload = im.onerror = null; resolve(v); };
      const timer = setTimeout(() => finish(null), timeoutMs);
      try{ im.referrerPolicy = 'no-referrer'; }catch{}
      im.onload = () => finish({w: im.naturalWidth || 0, h: im.naturalHeight || 0});
      im.onerror = () => finish(null);
      im.src = url;
    });
  }

  function isHtmlish(text){ return /<\s*(html|head|body|meta|title|img)\b/i.test(String(text || '').slice(0, 200000)); }

  function sniffImageExt(b64){
    try{
      const bin = atob(String(b64 || '').slice(0, 512));      // 384 bytes: enough to see an <svg> tag after an xml header
      if(/^GIF8[79]a/.test(bin)) return 'gif';
      if(bin.charCodeAt(0) === 0x89 && bin.slice(1,4) === 'PNG') return 'png';
      if(bin.charCodeAt(0) === 0xFF && bin.charCodeAt(1) === 0xD8 && bin.charCodeAt(2) === 0xFF) return 'jpg';
      if(bin.slice(0,4) === 'RIFF' && bin.slice(8,12) === 'WEBP') return 'webp';
      if(bin.slice(4,8) === 'ftyp' && /^(avif|avis|mif1|msf1)$/.test(bin.slice(8,12))) return 'avif';
      if(bin.slice(0,2) === 'BM' && [12,40,52,56,64,108,124].includes(bin.charCodeAt(14)) && !bin.charCodeAt(15) && !bin.charCodeAt(16) && !bin.charCodeAt(17)) return 'bmp';
      if(/^\s*(?:\xEF\xBB\xBF)?(?:<\?xml[^>]{0,300}>\s*)?(?:<!--[\s\S]{0,300}?-->\s*)?(?:<!doctype[^>]{0,200}>\s*)?<svg[\s>]/i.test(bin)) return 'svg';
    }catch{}
    return null;
  }

  // True when a data: image really starts like a picture (a "data:image/png" holding something else is refused, not saved as .png).
  function dataUrlHasImageBytes(url) {
    const s = String(url || ''), c = s.indexOf(',');
    if (c < 0) return false;
    if (/;base64/i.test(s.slice(0, c))) return !!sniffImageExt(s.slice(c + 1, c + 1 + 512));
    if (!/^data:image\/svg\+xml/i.test(s)) return false;
    let txt; try { txt = decodeURIComponent(s.slice(c + 1, c + 601)); } catch { txt = s.slice(c + 1, c + 601); }
    return /<svg[\s>]/i.test(txt);
  }
  // Does the browser itself accept this saved file as a picture? true / false, or null when it gave no answer in time (then the file is kept).
  function probeLocalImage(path, ms) {
    return new Promise((resolve) => {
      let done = false, tm = 0;
      const im = new Image();
      const end = (v) => { if (done) return; done = true; clearTimeout(tm); im.onload = im.onerror = null; try { im.removeAttribute('src'); } catch {} resolve(v); };
      im.onload = () => end(true);
      im.onerror = () => end(false);
      tm = setTimeout(() => end(null), ms || 12000);
      try { im.src = path; } catch { end(null); }
    });
  }

  // Local files can't carry their own metadata, so a small chat-scoped map remembers which
  // web address each one was downloaded from. Info (and the saved-card Copy link) use it later.
  // Which local files count as "Saved previews" (also recovers files an older build renamed to saved-image-*).
  const SAVED_RE = /^(?:emon-(?:pin|preview|saved-image)|saved-image)-/i;
  const isSavedName = n => SAVED_RE.test(String(n || '').split('/').pop());
  function getSourceMap() { try { const v = tavo.get('emonImageViewerSourceMap', 'chat'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } }
  function getDisplayNameMap() { try { const v = tavo.get('emonImageViewerDisplayNames', 'chat'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } }
  function genericSavedLabel(f) {
    const mime = String(f?.mimeType || '').toLowerCase();
    const ext = String(extOf(f?.name || '') || '').toLowerCase();
    if (mime === 'image/gif' || ext === 'gif') return 'Saved GIF';
    if (mime.startsWith('image/')) return 'Saved image';
    return 'Saved media';
  }
  function getDisplayName(path, fallback) { const map = getDisplayNameMap(); return String(map[path] || fallback || ''); }
  function getSavedDisplayName(f) { const map = getDisplayNameMap(); return String(map[f?.path] || genericSavedLabel(f)); }
  function setDisplayName(path, name) {
    if (!path || !name) return;
    try { const map = getDisplayNameMap(); map[path] = String(name).slice(0, 80); tavo.set('emonImageViewerDisplayNames', map, 'chat'); } catch {}
  }
  function moveDisplayName(oldPath, newPath, name) {
    try {
      const map = getDisplayNameMap();
      if (oldPath in map) delete map[oldPath];
      if (name) map[newPath] = String(name).slice(0, 80);
      tavo.set('emonImageViewerDisplayNames', map, 'chat');
    } catch {}
  }
  function forgetDisplayName(path) {
    try { const map = getDisplayNameMap(); if (path in map) { delete map[path]; tavo.set('emonImageViewerDisplayNames', map, 'chat'); } } catch {}
  }
  function recordSource(path, url) {
    if (!path || !/^https?:/i.test(url || '')) return;
    try {
      const map = getSourceMap();
      map[path] = String(url).slice(0, 500);
      const keys = Object.keys(map);
      if (keys.length > 1000) delete map[keys[0]]; // keep the map from growing forever
      tavo.set('emonImageViewerSourceMap', map, 'chat');
    } catch {}
  }
  function forgetSource(path) {
    try {
      const map = getSourceMap();
      if (path in map) { delete map[path]; tavo.set('emonImageViewerSourceMap', map, 'chat'); }
    } catch {}
  }

  // If this exact web address was already saved before, reuse that file instead of making a new
  // copy. A stale record (the file was deleted some other way) is quietly forgotten and a fresh
  // save proceeds normally.
  // recordSource() keeps only the first 500 characters of an address, so compare them the same way
  // (otherwise a long link was never recognised as already saved).
  const srcKey = u => String(u || '').slice(0, 500);
  async function findExistingBySource(url, requireListed=false) {
    if (!/^https?:/i.test(url || '')) return null;
    const map = getSourceMap();
    const key = srcKey(url);
    for (const path in map) {
      if (map[path] !== key) continue;
      if (requireListed && !isSavedName(path)) continue;   // e.g. a temporary "save to device" copy is not a saved preview
      try {
        if (await tavo.file.exists(path, {scope: 'chat'})) return path;
      } catch { return null; }
      forgetSource(path);
    }
    return null;
  }

  // tavo.file.save(url) has no timeout of its own, so one stalled server could freeze every save
  // (Extract's Save buttons stay locked until the app restarts). Give up on a download after 45s.
  const DOWNLOAD_TIMEOUT_MS = 45000;
  const PAGE_TIMEOUT_MS = 30000;      // a web page that never answers must not leave "Loading…" up forever
  let previewSeq = 0;                 // only the newest Preview tap may show its result
  function withTimeout(promise, ms) {
    let timer;
    const guard = new Promise((_, rej) => { timer = setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms); });
    return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
  }
  // Two taps (or Save + Pin) on the same address while the first download is still running used to start two downloads
  // and keep two copies. The same address already in flight now shares that one download.
  const _persistInflight = new Map();
  function persistRemote(url, prefix='emon-preview', requireListed=false) {
    if (!/^https?:/i.test(url || '')) return persistRemoteNow(url, prefix, requireListed);
    const key = srcKey(url);
    const running = _persistInflight.get(key);
    if (running) return running;
    const p = persistRemoteNow(url, prefix, requireListed).finally(() => { if (_persistInflight.get(key) === p) _persistInflight.delete(key); });
    _persistInflight.set(key, p);
    return p;
  }
  async function persistRemoteNow(url, prefix='emon-preview', requireListed=false) {
    if (/^https?:/i.test(url) && !isPublicHttpUrl(url)) throw new Error('blocked address');
    if (/^https?:/i.test(url) && isBlockedFileType(url)) throw blockedErr('runtime.notImageFile');
    const existing = await findExistingBySource(url, requireListed);
    if (existing) return existing;
    let ext = null;
    if (/^data:image\//i.test(url)) {
      const m = String(url).match(/^data:image\/([a-z0-9.+-]+)(?:;[^,]*)?,/i);
      const kind = (m && m[1] || '').toLowerCase();
      ext = ({jpeg:'jpg',jpg:'jpg',png:'png',gif:'gif',webp:'webp',avif:'avif',bmp:'bmp',svg:'svg'}[kind]) || null;
    } else {
      try {
        const m = new URL(url).pathname.toLowerCase().match(/\.(avif|bmp|gif|jpe?g|png|svg|webp)$/);
        if(m) ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      } catch {}
    }
    const safe = prefix.replace(/[^a-z0-9_-]/gi,'-').slice(0,32);
    const stem = `${safe}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    if(ext) {
      // a link that ends like an image is checked too: headers first (when the site lets us look), so a "photo.jpg" that is really a
      // video, or gigantic, is refused before it is downloaded
      const pk = /^https?:/i.test(url) ? await peekCached(url) : null;
      if (pk && pk.kind === 'blocked') throw blockedErr('runtime.notImageFile');
      if (pk && pk.kind === 'big') throw blockedErr('runtime.fileTooBig');
      if (/^data:/i.test(url) && !dataUrlHasImageBytes(url)) throw blockedErr('runtime.notImageFile');
      const dl = tavo.file.save(`${stem}.${ext}`, url, {scope:'chat'});
      let p;
      try { p = await withTimeout(dl, DOWNLOAD_TIMEOUT_MS); }
      catch (err) { dl.then(late => tavo.file.delete(late, {scope:'chat'})).catch(()=>{}); throw err; }   // gave up waiting: if it lands later, don't leave a stray copy
      if (/^https?:/i.test(url) && !(pk && pk.kind === 'image')) {   // size could not be checked in advance: an oversize result is deleted again
        const sz = await fileSizeOf(p);
        if (sz > IMAGE_MAX_BYTES) { await tavo.file.delete(p, {scope:'chat'}).catch(()=>{}); throw blockedErr('runtime.fileTooBig'); }
      }
      // A file name or a header can say "image" and be wrong: a download is kept only if the browser itself accepts the saved file as a picture.
      if (/^https?:/i.test(url) && (await probeLocalImage(p)) === false) { await tavo.file.delete(p, {scope:'chat'}).catch(()=>{}); throw blockedErr('runtime.notImageFile'); }
      if (/^https?:/i.test(url)) recordSource(p, url);
      return p;
    }
    // No extension in the URL: first ask the server what it is (headers only); only an image is downloaded.
    const peek = await peekCached(url);
    if (peek && (peek.kind === 'blocked' || peek.kind === 'page')) throw blockedErr('runtime.notImageFile');
    if (peek && peek.kind === 'big') throw blockedErr('runtime.fileTooBig');
    // Then save it, look at the first bytes, and keep it under its real type (GIFs stay GIFs).
    const dl = tavo.file.save(`${stem}.tmp`, url, {scope:'chat'});
    let tmp;
    try { tmp = await withTimeout(dl, DOWNLOAD_TIMEOUT_MS); }
    catch (err) { dl.then(late => tavo.file.delete(late, {scope:'chat'})).catch(()=>{}); throw err; }   // if it lands later, don't leave it behind
    const tsz = await fileSizeOf(tmp);
    if (tsz > TMP_MAX_BYTES) { await tavo.file.delete(tmp, {scope:'chat'}).catch(()=>{}); throw blockedErr('runtime.fileTooBig'); }   // too big to look at safely: discarded
    let real = null, b64 = null;
    try{
      b64 = await tavo.file.load(tmp, {scope:'chat', encoding:'base64'});
      real = sniffImageExt(b64);
    }catch{}
    if(!b64){ await tavo.file.delete(tmp, {scope:'chat'}).catch(()=>{}); throw new Error('remote image could not be read'); }
    // The first bytes must really be a picture; anything else is deleted right here instead of being kept under an image name.
    if(!real){ await tavo.file.delete(tmp, {scope:'chat'}).catch(()=>{}); throw blockedErr('runtime.notImageFile'); }
    let finalPath;
    try{ finalPath = await tavo.file.save(`${stem}.${real}`, b64, {scope:'chat', encoding:'base64'}); }
    finally{ await tavo.file.delete(tmp, {scope:'chat'}).catch(()=>{}); }
    recordSource(finalPath, url);
    return finalPath;
  }

  // A friendly guess at a name for a pin when nothing better is known: the last part of the URL's
  // path if it reads like real words, otherwise just the site's domain.
  function titleFromUrl(u) {
    try {
      const parsed = new URL(u);
      const seg = parsed.pathname.split('/').filter(Boolean).pop() || '';
      const decoded = decodeURIComponent(seg).replace(/\.[a-z0-9]{2,5}$/i, '');
      // A long run of only hex characters (0-9, a-f) is almost always an id or hash, not a real word,
      // even when it sits next to genuine words in the same filename (e.g. "media-approved-9f8a21bd7e4c").
      const looksHashy = /[0-9a-f]{8,}/i.test(decoded.replace(/[-_\s]/g, ''));
      const name = decoded.replace(/[-_]+/g, ' ').trim();
      if (!looksHashy && name && name.length <= 40 && /[a-z]{3,}/i.test(name)) return name;
      return parsed.hostname.replace(/^www\./, '');
    } catch { return ''; }
  }

  async function loadPreview(raw) {
    const url = normalizeUrl(raw);
    if (!url) { setStatus(t(isBlockedWebTarget(raw) ? 'runtime.urlBlocked' : 'runtime.invalidUrl')); return; }
    const seq = ++previewSeq;
    if (isBlockedFileType(url)) { previewEl.classList.remove('show'); setStatus(t('runtime.notImageFile')); return; }   // videos, archives, apps… are never fetched
    setStatus(t('runtime.loading'));
    previewEl.classList.remove('show');
    const show = (cand, tried, titleHint) => {
      if (seq !== previewSeq) return;
      currentPreview = {src: cand.url, original: url, source: cand.source, title: titleHint || titleFromUrl(url)};
      try{ previewImg.referrerPolicy = 'no-referrer'; }catch{}
      previewImg.src = cand.url;
      const msg = cand.source === 'direct' ? t('runtime.directLoaded')
        : tried > 1 ? t('runtime.altLoaded', {n: tried})
        : (cand.source === 'metadata' ? t('runtime.metaLoaded') : t('runtime.fallbackLoaded'));
      previewMeta.textContent = cand.source === 'direct' ? t('runtime.sourceDirect')
        : (cand.source === 'metadata' ? t('runtime.sourceMetadata') : t('runtime.sourceContent'));
      previewEl.classList.add('show');
      setStatus(msg);
    };
    const deadline = Date.now() + 28000;
    try {
      // 1. A direct image link (or data: image). If it fails, the https version, then the page behind it, are tried.
      if (looksLikeImage(url) || /^data:image\//i.test(url)) {
        const direct = [url];
        if (/^http:/i.test(url)) direct.push(url.replace(/^http:/i, 'https:'));
        if (/^https?:/i.test(url)) {   // even a link that ends like an image is asked about first: a video or a gigantic file is never pulled into the page
          const pk0 = await peekCached(url);
          if (seq !== previewSeq) return;
          if (pk0 && (pk0.kind === 'blocked' || pk0.kind === 'big')) { setStatus(t(pk0.kind === 'big' ? 'runtime.fileTooBig' : 'runtime.notImageFile')); return; }
        }
        for (const u of direct) {
          if (await probeImage(u)) { show({url:u, source:'direct'}, 1); return; }
        }
        if (/^data:/i.test(url)) throw new Error('bad data image');
      }
      // 2. Not an image link by its ending: ask the server what it is (headers only) before anything is downloaded.
      const peek = await peekCached(url);
      if (seq !== previewSeq) return;
      if (peek && (peek.kind === 'blocked' || peek.kind === 'big')) { setStatus(t(peek.kind === 'big' ? 'runtime.fileTooBig' : 'runtime.notImageFile')); return; }
      if (peek && peek.kind === 'image') {
        if (await probeImage(url)) { show({url, source:'direct'}, 1); return; }
        throw new Error('image could not be shown');
      }
      // 3. A web page: collect every image it points to and use the first one that really loads.
      const pageDl = tavo.file.save(`emon-page-${Date.now()}.html`, url, {scope:'chat'});
      let pageFile;
      try { pageFile = await withTimeout(pageDl, PAGE_TIMEOUT_MS); }
      catch (err) { pageDl.then(late => tavo.file.delete(late, {scope:'chat'})).catch(()=>{}); throw err; }
      if (seq !== previewSeq) { tavo.file.delete(pageFile, {scope:'chat'}).catch(()=>{}); return; }
      let candidates = [], notAPage = false, tooBig = false;
      try {
        // a big download is never read into memory: a web page is a few hundred KB, not megabytes
        const size = await fileSizeOf(pageFile);
        if (size > PAGE_MAX_BYTES) tooBig = true;
        else {
          const html = await tavo.file.load(pageFile, {encoding:'utf8'});
          if (isHtmlish(html)) candidates = extractPageImages(html, url);
          else notAPage = true;
        }
      } finally {
        await tavo.file.delete(pageFile, {scope:'chat'}).catch(()=>{});
      }
      if (tooBig) { setStatus(t('runtime.fileTooBig')); return; }
      if (notAPage) {
        // not a web page: it may be an image link without a file extension (e.g. .../photo?id=7)
        if (await probeImage(url)) { show({url, source:'direct'}, 1); return; }
        throw new Error('neither a page nor an image');
      }
      let tried = 0;
      for (const c of candidates) {
        if (Date.now() > deadline || seq !== previewSeq) break;
        tried++;
        if (tried > 1) setStatus(t('runtime.tryingAlt', {n: tried}));
        const r = await probeImage(c.url);
        if (!r) continue;
        const minSide = c.source === 'icon' ? 32 : 64;
        if (Math.min(r.w, r.h) < minSide) continue;
        if (c.source === 'content' && (isAdSize(r.w, r.h) || r.w / r.h > 6 || r.h / r.w > 6)) continue;
        show(c, tried, candidates.pageTitle);
        return;
      }
      throw new Error('no usable image');
    } catch (e) {
      console.error('[Image Preview]', e);
      if (seq !== previewSeq) return;
      setStatus(t('runtime.failed'));
      tavo.utils.toast(t('runtime.error'));
    }
  }

  async function savePreview(preview) {
    if (!preview?.src) return;
    try {
      let src = preview.src;
      let already = false;
      if (/^https?:/i.test(src) || /^data:image\//i.test(src)) {
        already = /^https?:/i.test(src) && !!(await findExistingBySource(src, true));
        src = await persistRemote(src, 'emon-preview', true);
      } else if (/^files\//i.test(src)) {
        const stillThere = await tavo.file.exists(src, { scope: 'chat' }).catch(() => false);
        if (!stillThere) throw new Error('gone'); // device import with no remote source to recreate it from
        already = true;
      } else throw new Error('unsupported source');
      const msg = t(already ? 'runtime.alreadySaved' : 'runtime.savedHere');
      setStatus(msg);
      tavo.utils.toast(msg);
      await loadSavedPreviews();
      try { savedEl.scrollTo({left:0, behavior:'smooth'}); } catch {}
    } catch (e) {
      console.error('[Image Preview] save preview', e);
      const msg = (e && e.msgKey) ? t(e.msgKey) : (e && e.message === 'gone') ? t('runtime.originalGone') : t('runtime.error');
      setStatus(t('runtime.failed'));
      tavo.utils.toast(msg);
    }
  }

  async function deleteSavedFile(path, removeLinkedPins=true) {
    if (!path) return;
    try {
      const files = await listChatFilesMatching(f => f.path === path);
      const f = files[0] || { path, name: path.split('/').pop(), mimeType: '', size: 0 };
      const moved = await moveToRecycleBin(f);
      if (!moved) { tavo.utils.toast(t('runtime.error')); await loadSavedPreviews(); return; }
      if (removeLinkedPins) pins.filter(p => p.src === path || p.src === path.replace(/^files\/chat\//,'')).forEach(p => removePin(p.id, false));
      savePins(); renderPinsList(); await loadSavedPreviews();
      tavo.utils.toast(t('runtime.deletedToBin'));
    } catch (e) { console.error('[Image Preview] delete saved', e); tavo.utils.toast(t('runtime.error')); }
  }

  let clearBusy = false;
  async function clearSavedFiles() {
    if (clearBusy) return;
    clearBusy = true;
    try {
      const ok = typeof confirm === 'function' ? confirm(t('runtime.confirmClear')) : true;
      if (!ok) return;
      const files = await listChatFilesMatching(f => SAVED_RE.test(f.name) && /^image\//i.test(f.mimeType || ''));
      const paths = new Set(files.map(f => f.path));
      const okPaths = new Set();
      for (const f of files) { if (await moveToRecycleBin(f)) okPaths.add(f.path); }
      pins.filter(p => okPaths.has(p.src) || okPaths.has(String(p.src).replace(/^files\/chat\//,''))).forEach(p => removePin(p.id, false));
      savePins(); renderPinsList(); await loadSavedPreviews();
      tavo.utils.toast(t('runtime.clearedToBin'));
    } catch (e) { console.error('[Image Preview] clear saved', e); tavo.utils.toast(t('runtime.error')); }
    finally { clearBusy = false; }
  }

  // ---- Recycle Bin (global scope: shared across every chat, so a deleted image survives the
  // chat it came from being closed, and can be restored later into whichever chat is open) ----
  // Only well-formed entries come back: one damaged item must never make the whole bin un-openable.
  function getRecycleBin() {
    try {
      const v = tavo.get('emonImageViewerRecycleBin', 'global');
      if (!Array.isArray(v)) return [];
      return v.filter(e => e && typeof e === 'object' && typeof e.path === 'string' && e.path && (typeof e.id === 'string' || typeof e.id === 'number'))
              .map(e => ({ ...e, deletedAt: Number.isFinite(Number(e.deletedAt)) ? Number(e.deletedAt) : Date.now() }));
    } catch { return []; }
  }
  function setRecycleBin(list) { try { tavo.set('emonImageViewerRecycleBin', list, 'global'); return true; } catch { return false; } }
  function recycleRetentionDays() { const v = Number(cfg().recycleBinRetention); return (v === 7 || v === 30) ? v : 30; }
  function recycleExpiryAt(entry) { return entry.deletedAt + recycleRetentionDays() * 86400000; }

  // Moves one chat-scoped saved file into the global recycle bin instead of deleting it outright.
  // Each entry keeps its own deletedAt timestamp — later deletions never reset an earlier one's clock.
  // Moves are queued one at a time. Two moves running side by side each used to read the bin, add their
  // own entry and write the whole list back, so the later write erased the earlier entry and left its
  // image invisible in the bin's storage. Queued, each move sees the previous one's result.
  let _recycleChain = Promise.resolve();
  function moveToRecycleBin(f) {
    const run = _recycleChain.then(() => moveToRecycleBinNow(f));
    _recycleChain = run.catch(() => {});
    return run;
  }
  async function moveToRecycleBinNow(f) {
    try {
      const bytes = await tavo.file.load(f.path, { encoding: 'base64' });
      if (bytes == null) return false;
      const ext = extOf(f.name) || 'png';
      const recyclePath = await tavo.file.save(`emon-recycled-${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`, bytes, { scope: 'global', encoding: 'base64' });
      if (!recyclePath) return false;
      let chat = null; try { chat = await tavo.chat.current(); } catch {}
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        path: recyclePath,
        name: getSavedDisplayName(f),
        mimeType: f.mimeType || '',
        deletedAt: Date.now(),
        chatId: chat?.id ?? null,
        chatName: chat?.name || t('runtime.unknownChat'),
        sourceUrl: getSourceMap()[f.path] || null,
      };
      // Write the bin entry first and check that it really landed, THEN remove the original: a failed write can no
      // longer leave a picture that is in neither place.
      const bin = getRecycleBin();   // read fresh right before writing
      bin.push(entry);
      let wrote = setRecycleBin(bin);
      if (wrote) { try { wrote = getRecycleBin().some(x => x.id === entry.id); } catch { wrote = false; } }
      if (!wrote) { await tavo.file.delete(recyclePath, { scope: 'global' }).catch(() => {}); return false; }
      let delOk = true;
      try { await tavo.file.delete(f.path, { scope: 'chat' }); } catch { delOk = false; }
      if (delOk) { try { delOk = !(await tavo.file.exists(f.path, { scope: 'chat' })); } catch {} }
      if (!delOk) {
        // original could not be removed: undo the bin entry and the recycle copy so nothing is duplicated or falsely reported
        setRecycleBin(getRecycleBin().filter(x => x.id !== entry.id));
        await tavo.file.delete(recyclePath, { scope: 'global' }).catch(() => {});
        return false;
      }
      forgetSource(f.path); forgetDisplayName(f.path);
      return true;
    } catch (e) { console.error('[Image Preview] recycle bin move', e); return false; }
  }

  // Best-effort purge: plugins have no background timer, so expiry is only actually enforced the
  // next time any chat's Image Preview panel checks the bin (on load, or when the bin is opened).
  async function purgeExpiredRecycleBin() {
    const bin = getRecycleBin();
    if (!bin.length) return;
    const now = Date.now();
    const expired = bin.filter(e => recycleExpiryAt(e) <= now);
    if (!expired.length) return;
    const gone = new Set();
    for (const e of expired) { try { await tavo.file.delete(e.path, { scope: 'global' }); gone.add(e.id); } catch {} }   // a failed delete keeps its entry so the next purge retries
    if (gone.size) setRecycleBin(getRecycleBin().filter(e => !gone.has(e.id)));   // re-read: the bin may have changed while deleting
  }

  // Removes one entry from the bin's saved list right away, so an interrupted restore (app closed,
  // chat runtime replaced) never leaves a listed entry whose file has already moved or vanished.
  function dropFromRecycleBin(id) {
    try { setRecycleBin(getRecycleBin().filter(x => x.id !== id)); } catch {}
  }
  async function restoreRecycleEntries(list) {
    if (!list.length) return;
    // Restores always land in the chat that is open right now: no chat switching, so the runtime
    // never changes under a running restore.
    let restored = 0;
    for (const e of list) {
      try {
        const bytes = await tavo.file.load(e.path, { encoding: 'base64', scope: 'global' });
        if (bytes == null) { dropFromRecycleBin(e.id); continue; }   // file is gone: nothing to restore, drop the dead entry
        const ext = extOf(e.path) || 'png';
        const newPath = await tavo.file.save(`saved-image-restored-${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`, bytes, { scope: 'chat', encoding: 'base64' });
        if (!newPath) continue;
        if (e.name) setDisplayName(newPath, e.name);
        if (e.sourceUrl) recordSource(newPath, e.sourceUrl);
        dropFromRecycleBin(e.id);                                     // copy is safe in the chat: forget the bin entry first...
        await tavo.file.delete(e.path, { scope: 'global' }).catch(() => {});   // ...then free the bin's file
        restored++;
      } catch (err) { console.error('[Image Preview] restore', err); }
    }
    recycleEntries = getRecycleBin().slice().sort((a,b) => b.deletedAt - a.deletedAt);
    renderRecycleGrid();
    await loadSavedPreviews();
    tavo.utils.toast(t('runtime.recycleRestoredToast').replace('{n}', String(restored)));
  }

  async function permanentlyDeleteRecycleEntries(list) {
    if (!list.length) return;
    const ok = typeof confirm === 'function' ? confirm(t('runtime.confirmRecycleDelete').replace('{n}', String(list.length))) : true;
    if (!ok) return;
    const ids = new Set(list.map(e => e.id));
    for (const e of list) { try { await tavo.file.delete(e.path, { scope: 'global' }); } catch {} }
    setRecycleBin(getRecycleBin().filter(e => !ids.has(e.id)));
    renderRecycleGrid();
    tavo.utils.toast(t('runtime.recycleDeletedToast').replace('{n}', String(list.length)));
  }


  // Remembers which device files were already imported (name + size -> saved path), so picking the
  // same file again does not add a second copy to Saved Previews.
  const DEVICE_MAP_VAR = 'emonImageViewerDeviceImports';
  function getDeviceMap() { try { const v = tavo.get(DEVICE_MAP_VAR, 'chat'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } }
  function rememberDeviceImport(key, path) {
    if (!key) return;
    try {
      const map = getDeviceMap();
      delete map[key]; map[key] = path;                        // newest last
      const keys = Object.keys(map);
      if (keys.length > 1000) delete map[keys[0]];              // keep the map from growing forever
      tavo.set(DEVICE_MAP_VAR, map, 'chat');
    } catch {}
  }
  async function importLocalImage() {
    try {
      const imported = await tavo.file.import({multiple:true, scope:'chat', extensions:['png','jpg','jpeg','webp','gif','bmp','avif','svg'], conflict:'rename'});
      let added = 0, dup = 0;
      for (const f of (imported || [])) {
        if (!/^image\//i.test(f.mimeType || '')) continue;
        const key = Number.isFinite(f.size) && f.size > 0 ? `${f.originalName || f.name}|${f.size}` : '';
        const known = key ? getDeviceMap()[key] : '';
        if (known && isSavedName(known) && await tavo.file.exists(known, {scope:'chat'}).catch(() => false)) {
          await tavo.file.delete(f.path, {scope:'chat'}).catch(() => {});      // same file as before: drop the fresh copy
          currentPreview = {src:known, original:known, source:'direct', title:f.originalName || f.name};
          previewImg.src = known; previewMeta.textContent = t('runtime.imported'); previewEl.classList.add('show');
          dup++; continue;
        }
        const dataUrl = await tavo.file.load(f.path, {encoding:'dataUrl'});
        if (!dataUrl) continue;
        const ext = (f.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'png').toLowerCase();
        const saved = await tavo.file.save(`emon-preview-${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`, dataUrl, {scope:'chat'});
        await tavo.file.delete(f.path, {scope:'chat'});
        rememberDeviceImport(key, saved);
        currentPreview = {src:saved, original:saved, source:'direct', title:f.originalName || f.name};
        previewImg.src = saved; previewMeta.textContent = t('runtime.imported'); previewEl.classList.add('show');
        added++;
      }
      if (imported?.length) {
        setStatus(t(dup && !added ? 'runtime.alreadySaved' : 'runtime.imported'));
        if (dup) tavo.utils.toast(t('runtime.alreadySaved'));
        await loadSavedPreviews();
      }
    } catch (e) { console.error('[Image Preview] import', e); tavo.utils.toast(t('runtime.error')); }
  }

  function setLookupStatus(msg){
    if(lookupStatus) lookupStatus.textContent=msg||'';
  }

  function getBraveKey(){
    try{ return String(tavo.get('emonImageViewerBraveKey','global')||'').trim(); }catch{ return ''; }
  }

  function isPrivacyMode(){
    try{ return !!tavo.get('emonImageViewerPrivacyMode','global'); }catch{ return false; }
  }

  function refreshPrivacyUI(){
    if(!privacyToggle) return;
    const on=isPrivacyMode();
    privacyToggle.textContent = on ? t('runtime.privacyOn') : t('runtime.privacyOff');
    privacyToggle.style.background = on ? '#16a34a2e' : '';
    privacyToggle.style.borderColor = on ? '#4ade8055' : '';
    privacyToggle.style.color = on ? '#86efac' : '';
  }

  const enginesRow=byId('emon-iv-engines');
  const engineBtns=enginesRow?[...enginesRow.querySelectorAll('[data-engine]')]:[];
  let engineSel='';
  function currentEngine(){ return engineSel || getEnginePref() || (getBraveKey()?'brave':getTavilyKey()?'tavily':'brave'); }
  function refreshSearchKeyUI(){
    const eng=currentEngine(), hasB=!!getBraveKey(), hasT=!!getTavilyKey();
    engineBtns.forEach(b=>{ const e=b.dataset.engine; b.classList.toggle('on',e===eng); b.classList.toggle('has',e==='brave'?hasB:hasT); });
    if(searchKeyInput) searchKeyInput.placeholder=t(eng==='tavily'?'runtime.tavilyPlaceholder':'runtime.searchApiPlaceholder');
    if(!searchKeyHint) return;
    const active=eng==='tavily'?hasT:hasB;
    searchKeyHint.style.display='';
    let msg = active ? t(eng==='tavily'?'runtime.tavilyActive':'runtime.searchApiActive') : t(eng==='tavily'?'runtime.tavilyHint':'runtime.searchApiHint');
    if(hasB&&hasT){ const second=eng==='tavily'?'Brave':'Tavily'; msg+=' '+t('runtime.engineOrder',{first:eng==='tavily'?'Tavily':'Brave',second}); }
    searchKeyHint.textContent=msg;
  }
  engineBtns.forEach(b=>{ b.onclick=()=>{ engineSel=b.dataset.engine; try{ tavo.set(ENGINE_VAR,engineSel,'global'); }catch{} refreshSearchKeyUI(); }; });

  function setLookupMode(mode){
    lookupMode=mode;
    lookupTabs.forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    if(lookupTarget) lookupTarget.style.display=mode==='search'?'none':'';
    if(searchKeyRow) searchKeyRow.style.display=mode==='search'?'':'none';
    if(enginesRow) enginesRow.style.display=mode==='search'?'':'none';
    if(searchKeyHint) searchKeyHint.style.display=mode==='search'?'':'none';
    if(mode==='search') refreshSearchKeyUI();
    if(lookupGo) lookupGo.textContent=t(mode==='translate'?'runtime.lookupTranslate':mode==='meaning'?'runtime.lookupMeaning':'runtime.lookupSearch');
  }

  function showLookupResults(items){
    if(!lookupResult)return;
    lookupResult.innerHTML='';
    if(!items?.length){
      lookupResult.innerHTML=`<div class="emon-iv-empty">${esc(t('runtime.lookupNoResults'))}</div>`;
      lookupResult.classList.add('show');
      return;
    }
    for(const item of items){
      const card=document.createElement('div');
      card.className='emon-iv-result-card';
      const title=esc(item.title||t('runtime.lookupResult'));
      const body=esc(item.text||'');
      const url=String(item.url||'');
      card.innerHTML=`<div class="emon-iv-result-title">${title}</div><div class="emon-iv-result-text">${body}</div>${url?`<div class="emon-iv-result-meta">${esc(url)}</div>`:''}<div class="emon-iv-result-actions">${url&&!isSearchPageUrl(url)?`<button data-act="peek">${esc(t('runtime.lookupPeek'))}</button>`:''}${url?`<button data-act="open">${esc(t('runtime.lookupOpen'))}</button>`:''}<button data-act="copy">${esc(t('runtime.lookupCopy'))}</button></div>`;
      if(url) card.querySelector('[data-act="open"]').onclick=()=>openSafe(url);
      const pk=card.querySelector('[data-act="peek"]'); if(pk) pk.onclick=()=>openWebPreview(url);
      card.querySelector('[data-act="copy"]').onclick=async()=>{
        try{
          await navigator.clipboard.writeText((item.title?item.title+'\n':'')+(item.text||'')+(url?'\n'+url:''));
          tavo.utils.toast(t('runtime.lookupCopied'));
        }catch{tavo.utils.toast(t('runtime.error'));}
      };
      lookupResult.appendChild(card);
    }
    lookupResult.classList.add('show');
  }

  function fetchTimeout(url,opts={},ms=9000){
    const ctrl=new AbortController();
    const id=setTimeout(()=>ctrl.abort(),ms);
    return fetch(url,{...opts,signal:ctrl.signal}).finally(()=>clearTimeout(id));
  }

  function guessLang(text){
    return /[\u0980-\u09FF]/.test(text) ? 'bn' : 'en';
  }

  // ---- Translate: three independent free engines, tried in order ----
  async function translateViaGoogle(text,target){
    const url=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const r=await fetchTimeout(url,{headers:{'Accept':'application/json'}},8000);
    if(!r.ok) throw new Error('google http '+r.status);
    const data=await r.json();
    const translated=Array.isArray(data?.[0])?data[0].map(x=>x?.[0]||'').join(''):'';
    if(!translated) throw new Error('google empty');
    return {translated,detected:data?.[2]||'auto',engine:'Google Translate'};
  }

  async function translateViaLingva(text,target){
    const bases=['https://lingva.ml/api/v1','https://lingva.garudalinux.org/api/v1','https://lingva.thedaviddelta.com/api/v1'];
    let lastErr;
    for(const base of bases){
      try{
        const url=`${base}/auto/${encodeURIComponent(target)}/${encodeURIComponent(text)}`;
        const r=await fetchTimeout(url,{headers:{'Accept':'application/json'}},8000);
        if(!r.ok) throw new Error('lingva http '+r.status);
        const data=await r.json();
        if(!data?.translation) throw new Error('lingva empty');
        return {translated:data.translation,detected:data?.info?.detectedSource||'auto',engine:'Lingva'};
      }catch(e){ lastErr=e; }
    }
    throw lastErr||new Error('lingva unavailable');
  }

  async function translateViaMyMemory(text,target){
    let source=guessLang(text);
    if(source===target) source = target==='bn' ? 'en' : 'bn';
    const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source+'|'+target)}`;
    const r=await fetchTimeout(url,{},8000);
    if(!r.ok) throw new Error('mymemory http '+r.status);
    const data=await r.json();
    const translated=data?.responseData?.translatedText;
    if(!translated || /invalid source language/i.test(translated)) throw new Error('mymemory empty');
    return {translated,detected:source+' ('+t('runtime.approxDetect')+')',engine:'MyMemory'};
  }

  async function translateLookup(text,target){
    let lastErr;
    for(const fn of [translateViaGoogle,translateViaLingva,translateViaMyMemory]){
      try{ return await fn(text,target); }
      catch(e){ lastErr=e; console.warn('[Image Preview] translate engine failed',fn.name,e); }
    }
    throw lastErr||new Error('all translate engines failed');
  }

  // ---- Meaning: real dictionary definitions first, encyclopedia as fallback ----
  async function meaningViaDictionaryApi(word){
    const r=await fetchTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,{},8000);
    if(!r.ok) throw new Error('dictionaryapi http '+r.status);
    const data=await r.json();
    if(!Array.isArray(data)||!data.length) throw new Error('dictionaryapi empty');
    const items=[];
    for(const entry of data.slice(0,3)){
      for(const m of (entry.meanings||[]).slice(0,4)){
        const defs=(m.definitions||[]).slice(0,3).map(d=>d.definition).filter(Boolean);
        if(!defs.length) continue;
        items.push({
          title:`${entry.word}${m.partOfSpeech?' — '+m.partOfSpeech:''}`,
          text:defs.map((d,i)=>`${i+1}. ${d}`).join('\n'),
          url:`https://en.wiktionary.org/wiki/${encodeURIComponent(entry.word)}`
        });
      }
    }
    if(!items.length) throw new Error('dictionaryapi no definitions');
    return items.slice(0,6);
  }

  async function meaningViaWiktionary(word,lang){
    const host=lang==='bn'?'bn.wiktionary.org':'en.wiktionary.org';
    const r=await fetchTimeout(`https://${host}/api/rest_v1/page/definition/${encodeURIComponent(word)}`,{},8000);
    if(!r.ok) throw new Error('wiktionary http '+r.status);
    const data=await r.json();
    const items=[];
    for(const entries of Object.values(data||{})){
      for(const entry of (entries||[]).slice(0,3)){
        const defs=(entry.definitions||[]).slice(0,3).map(d=>stripTagsLinear(d.definition||'', '')).filter(Boolean);
        if(!defs.length) continue;
        items.push({
          title:`${word}${entry.partOfSpeech?' — '+entry.partOfSpeech:''}`,
          text:defs.map((d,i)=>`${i+1}. ${d}`).join('\n'),
          url:`https://${host}/wiki/${encodeURIComponent(word)}`
        });
      }
    }
    if(!items.length) throw new Error('wiktionary empty');
    return items.slice(0,6);
  }

  async function meaningViaWikipedia(text,target){
    const lang=target==='bn'?'bn':'en';
    const r=await fetchTimeout(`https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(text)}&limit=4`,{},8000);
    if(!r.ok) throw new Error('wiki search http '+r.status);
    const data=await r.json();
    const pages=(data?.pages||[]).slice(0,4);
    if(!pages.length) throw new Error('wiki search empty');
    const items=[];
    for(const p of pages){
      try{
        const sumR=await fetchTimeout(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.key)}`,{},8000);
        if(!sumR.ok) continue;
        const sum=await sumR.json();
        if(!sum?.extract) continue;
        items.push({title:sum.title||p.title,text:sum.extract,url:sum.content_urls?.desktop?.page||`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.key)}`});
      }catch{}
    }
    if(!items.length) throw new Error('wiki summaries empty');
    return items;
  }

  async function meaningLookup(text,target){
    const lang=target==='bn'?'bn':'en';
    const engines = lang==='bn'
      ? [{fn:()=>meaningViaWiktionary(text,'bn'),name:'Wiktionary'},{fn:()=>meaningViaWikipedia(text,'bn'),name:'Wikipedia'}]
      : [{fn:()=>meaningViaDictionaryApi(text),name:'Dictionary API'},{fn:()=>meaningViaWiktionary(text,'en'),name:'Wiktionary'},{fn:()=>meaningViaWikipedia(text,'en'),name:'Wikipedia'}];
    let lastErr;
    for(const {fn,name} of engines){
      try{ const items=await fn(); return {items,engine:name}; }
      catch(e){ lastErr=e; console.warn('[Image Preview] meaning engine failed',name,e); }
    }
    throw lastErr||new Error('all meaning engines failed');
  }

  // ---- Web search: real search via optional free Brave key, otherwise a multi-source fallback ----
  async function webViaBrave(text,key){
    const r=await fetchTimeout(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(text)}&count=8`,{headers:{'Accept':'application/json','X-Subscription-Token':key}},9000);
    if(!r.ok) throw new Error('brave http '+r.status);
    const data=await r.json();
    const items=(data?.web?.results||[]).slice(0,8).map(x=>({title:x.title||text,text:stripTagsLinear(x.description||'', ''),url:x.url||''}));
    if(!items.length) throw new Error('brave empty');
    return {items,engine:'Brave Search'};
  }

  async function webViaFallback(text){
    const items=[];
    try{
      const ddg=await fetchTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(text)}&format=json&no_html=1&skip_disambig=0&no_redirect=1`,{},8000);
      if(ddg.ok){
        const d=await ddg.json();
        if(d?.AbstractText) items.push({title:d.Heading||text,text:d.AbstractText,url:d.AbstractURL||''});
        const related=(d?.RelatedTopics||[]).flatMap(x=>x?.Topics||[x]).filter(x=>x?.Text).slice(0,4);
        for(const x of related) items.push({title:(x.Text||'').split(' - ')[0],text:x.Text,url:x.FirstURL||''});
      }
    }catch(e){console.warn('[Image Preview] DDG lookup',e)}
    try{
      const wiki=await meaningViaWikipedia(text,'en');
      for(const x of wiki) if(!items.some(i=>i.url&&i.url===x.url)) items.push(x);
    }catch(e){console.warn('[Image Preview] Wikipedia lookup',e)}
    try{
      const wikt=await meaningViaWiktionary(text,'en');
      for(const x of wikt) if(!items.some(i=>i.url&&i.url===x.url)) items.push(x);
    }catch{}
    return {items:items.slice(0,8),engine:t('runtime.limitedFallback')};
  }

  async function webLookup(text){
    const bk=getBraveKey(), tk=getTavilyKey();
    const order=(getEnginePref()==='tavily'?['tavily','brave']:['brave','tavily']).filter(e=>e==='brave'?bk:tk);
    let out=null;
    for(const e of order){
      try{ out = e==='brave' ? await webViaBrave(text,bk) : await webViaTavily(text,tk); break; }
      catch(err){ console.warn('[Image Preview] '+e+' search failed, trying the next one',err); }
    }
    if(!out) out=await webViaFallback(text);
    const openUrl=`https://www.google.com/search?q=${encodeURIComponent(text)}`;
    return {items:[...out.items,{title:t('runtime.openFullSearch'),text:t('runtime.openFullSearchHint'),url:openUrl}],engine:out.engine};
  }

  async function runLookup(){
    let text=String(lookupInput?.value||'').trim();
    if(!text){setLookupStatus(t('runtime.lookupEnter'));return;}
    if(isPrivacyMode()){setLookupStatus(t('runtime.privacyBlocked'));return;}
    if(text.length>1000){ text=text.slice(0,1000); tavo.utils.toast(t('runtime.lookupTruncated')); }
    setLookupStatus(t('runtime.lookupLoading'));
    lookupResult.classList.remove('show');
    try{
      let out;
      if(lookupMode==='translate'){
        const r=await translateLookup(text,lookupTarget.value);
        out={items:[{title:t('runtime.translationResult'),text:r.translated+'\n\n'+t('runtime.detectedLanguage')+': '+r.detected,url:''}],engine:r.engine};
      }else if(lookupMode==='meaning'){
        out=await meaningLookup(text,lookupTarget.value);
      }else{
        out=await webLookup(text);
      }
      showLookupResults(out.items);
      setLookupStatus(`${t('runtime.lookupDone')}${out.engine?' · '+out.engine:''}`);
      recordLookupHistory(lookupMode, lookupTarget.value, text);
    }catch(e){
      console.error('[Image Preview] lookup',e);
      showLookupResults([]);
      setLookupStatus(t('runtime.lookupFailed'));
    }
  }

  // ---- Quick Lookup history: off by default, entirely local, capped, editable/clearable ----
  // Chat scope (default) — history now stays with the chat it was looked up in, instead of one mixed device-wide list.
  function isHistoryEnabled(){ try{ return !!tavo.get('emonImageViewerHistoryOn'); }catch{ return false; } }
  function setHistoryEnabled(v){ try{ tavo.set('emonImageViewerHistoryOn', v); }catch{} }
  function getLookupHistory(){ try{ const v=tavo.get('emonImageViewerLookupHistory'); return Array.isArray(v)?v:[]; }catch{ return []; } }
  function setLookupHistory(list){ try{ tavo.set('emonImageViewerLookupHistory', list); }catch{} }

  function recordLookupHistory(mode, target, text){
    if(!isHistoryEnabled()) return;
    const list = getLookupHistory();
    list.unshift({mode, target, text, ts: Date.now()});
    setLookupHistory(list.slice(0, 20));
    if(historyPanel && historyPanel.style.display!=='none') renderHistoryList();
  }

  function renderHistoryList(){
    if(!historyList) return;
    const list = getLookupHistory();
    if(!list.length){ historyList.innerHTML = `<div class="emon-iv-empty">${esc(t('runtime.historyEmpty'))}</div>`; return; }
    historyList.innerHTML = list.map((h,i)=>{
      const modeLabel = h.mode==='translate' ? t('runtime.translateTab') : h.mode==='meaning' ? t('runtime.meaningTab') : t('runtime.searchTab');
      return `<button data-i="${i}">${esc(modeLabel)} · ${esc(h.text.slice(0,60))}</button>`;
    }).join('');
    historyList.querySelectorAll('button[data-i]').forEach(b=>{
      b.onclick=()=>{
        const h = list[Number(b.dataset.i)];
        if(!h) return;
        setLookupMode(h.mode);
        if(lookupTarget) lookupTarget.value = h.target||'en';
        if(lookupInput) lookupInput.value = h.text;
        historyPanel.style.display='none';
      };
    });
  }

  // File listings are paginated. Keep cleanup/listing bounded so a large chat cannot
  // silently leave stale temporary pages or old saved previews behind after page 1.
  async function listChatFilesMatching(predicate, maxPages=50) {
    const out = [];
    let cursor;
    for (let pageNo = 0; pageNo < maxPages; pageNo++) {
      const opts = {scope:'chat', limit:200};
      if (cursor) opts.cursor = cursor;
      const page = await tavo.file.list(opts);
      for (const f of (page?.files || [])) if (predicate(f)) out.push(f);
      if (!page?.nextCursor) break;
      cursor = page.nextCursor;
    }
    return out;
  }

  async function cleanTempPages() {
    try {
      const files = await listChatFilesMatching(f => /^emon-page-\d+\.html$/i.test(f.name));
      for (const f of files) await tavo.file.delete(f.path, {scope:'chat'});
    } catch {}
  }

  // ---------- Image Info modal (shared by the live preview, pinned images, and saved previews) ----------
  const infoEl = byId('emon-iv-info');
  const infoBody = byId('emon-iv-info-body');
  const infoClose = byId('emon-iv-info-close');
  const helpEl = byId('emon-iv-help');
  const helpBtn = byId('emon-iv-help-btn');
  const helpCloseBtn = byId('emon-iv-help-close');
  const pullHandles = [...root.querySelectorAll('[data-pull-target]')];
  // Small hanging buttons (help, games): press = they swing, release = they open. A cancelled touch never opens anything.
  function bindTapSway(el, onOpen) {
    if (!el) return;
    let startY=0, startX=0, dragging=false, suppressClick=false, handledPointerTap=false;
    const down = e => {
      startX=e.clientX; startY=e.clientY; dragging=false; suppressClick=false;
      el.classList.add('sway'); el.setPointerCapture?.(e.pointerId); e.preventDefault();
    };
    const move = e => {
      if (!el.classList.contains('sway')) return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(Math.hypot(dx,dy)>6) dragging=true;
      if(!dragging) return;
      const pull=Math.max(-24,Math.min(24,dy));
      el.style.transform=`translateY(${pull}px) rotate(${Math.max(-8,Math.min(8,pull/3))}deg)`;
      e.preventDefault();
    };
    const end = (e, cancelled) => {
      if (!el.classList.contains('sway')) return;
      el.classList.remove('sway'); el.style.transform='';
      suppressClick=true;
      if(!dragging && !cancelled){ handledPointerTap=true; onOpen?.(); }
      setTimeout(()=>{suppressClick=false; handledPointerTap=false},260);
      dragging=false;
      try{el.releasePointerCapture?.(e.pointerId)}catch{}
    };
    el.addEventListener('pointerdown',down);
    el.addEventListener('pointermove',move);
    el.addEventListener('pointerup',e=>end(e,false));
    el.addEventListener('pointercancel',e=>end(e,true));
    // keyboard / accessibility clicks (detail 0) still work
    el.addEventListener('click',e=>{ if(suppressClick || handledPointerTap || e.detail>0){e.preventDefault();e.stopPropagation();return;} onOpen?.(); });
  }
  if (helpCloseBtn) helpCloseBtn.onclick = () => hideModal(helpEl);
  const helpClose2Btn = byId('emon-iv-help-close2');
  if (helpClose2Btn) helpClose2Btn.onclick = () => hideModal(helpEl);
  bindBackdropClose(helpEl, () => hideModal(helpEl));
  bindTapSway(helpBtn, ()=>showModal(helpEl));
  bindTapSway(gameBtn, ()=>openGame());

  // Quick Lookup: a rope with an anchor. It sways on its own.
  //  - closed: pull the anchor DOWN to open the tools (a plain tap only gives the rope a little tug)
  //  - open:   tap the anchor, or pull it down again, to close
  (function bindLookupAnchor(el){
    if(!el || !lookupPanel) return;
    const BASE = 30, OPEN_AT = 38, MAX_PULL = 86;
    let startX=0,startY=0,dy=0,dragging=false,active=false;
    const isOpen = () => lookupPanel.classList.contains('open');
    const setOpen = on => {
      lookupPanel.classList.toggle('open', on);
      el.setAttribute('aria-expanded', String(on));
    };
    const reset = () => {
      lookupPanel.classList.remove('dragging');
      lookupPanel.style.removeProperty('--rope');
      if (lookupSwing) lookupSwing.style.transform = '';
    };
    const tug = () => {
      try {
        lookupSwing?.animate([
          {transform:'rotate(-11deg)'},{transform:'rotate(9deg)'},{transform:'rotate(-5deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0deg)'}
        ], {duration:620, easing:'ease-out'});
      } catch {}
    };
    el.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      active = true; dragging = false; dy = 0; startX = e.clientX; startY = e.clientY;
      try { el.setPointerCapture?.(e.pointerId); } catch {}
      e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if (!active) return;
      const dx = e.clientX - startX;
      dy = Math.max(0, Math.min(MAX_PULL, e.clientY - startY));   // only downward pulls count
      if (!dragging && (Math.abs(e.clientY - startY) > 7 || Math.abs(dx) > 7)) {
        dragging = true; lookupPanel.classList.add('dragging');
      }
      if (!dragging) return;
      lookupPanel.style.setProperty('--rope', (isOpen() ? 0 : BASE) + dy + 'px');
      if (lookupSwing) lookupSwing.style.transform = `rotate(${Math.max(-9, Math.min(9, dx / 6))}deg)`;
      e.preventDefault();
    });
    const finish = (e, cancelled) => {
      if (!active) return;
      active = false;
      try { el.releasePointerCapture?.(e.pointerId); } catch {}
      const wasDrag = dragging, pulled = dy;
      dragging = false; dy = 0;
      reset();
      if (cancelled) return;
      if (wasDrag) {
        if (pulled >= OPEN_AT) setOpen(!isOpen());   // a firm pull down toggles: opens when closed, closes when open
      } else if (isOpen()) {
        setOpen(false);                              // tap while open closes
      } else {
        tug();                                       // tap while closed: just a tug that says "pull me"
      }
    };
    el.addEventListener('pointerup', e => finish(e, false));
    el.addEventListener('pointercancel', e => finish(e, true));
    el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (e.detail === 0) { if (isOpen()) setOpen(false); else tug(); } });
  })(lookupHandle);
  function fmtBytes(n) {
    if (!Number.isFinite(n)) return null;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }
  function extOf(u) {
    const m = String(u || '').split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i);
    return m ? m[1].toLowerCase() : '';
  }
  function formatLabel(ext, mime) {
    const map = {jpg:'JPEG', jpeg:'JPEG', png:'PNG', gif:'GIF', webp:'WebP', avif:'AVIF', svg:'SVG', bmp:'BMP'};
    if (ext && map[ext]) return map[ext];
    if (mime) { const m = mime.split('/')[1]; if (m) return m.toUpperCase(); }
    return t('runtime.infoUnknown');
  }
  function measureImage(src, timeoutMs = 6000) {
    return new Promise(resolve => {
      const im = new Image();
      let done = false;
      const finish = v => { if (done) return; done = true; clearTimeout(timer); resolve(v); };
      const timer = setTimeout(() => finish(null), timeoutMs);
      try { im.referrerPolicy = 'no-referrer'; } catch {}
      im.onload = () => finish({w: im.naturalWidth || 0, h: im.naturalHeight || 0});
      im.onerror = () => finish(null);
      im.src = src;
    });
  }
  function closeImageInfo() { hideModal(infoEl); }
  async function showImageInfo(ref, imgEl) {
    if (!infoEl || !ref || !ref.src) return;
    infoBody.innerHTML = `<div class="emon-iv-info-row"><span>${esc(t('runtime.loading'))}</span></div>`;
    showModal(infoEl);
    const isLocal = /^files\//i.test(ref.src);
    let sizeBytes = null, mime = null;
    if (isLocal) {
      try {
        const matches = await listChatFilesMatching(x => x.path === ref.src, 50);
        const f = matches[0] || null;
        if (f) { sizeBytes = f.size; mime = f.mimeType; }
      } catch {}
    }
    // Reuse an already-loaded <img>'s real dimensions when we have one; it's the same picture, so no second fetch is needed.
    const dims = (imgEl && imgEl.getAttribute('src') === ref.src && imgEl.naturalWidth) ? {w: imgEl.naturalWidth, h: imgEl.naturalHeight} : await measureImage(ref.src);
    const ext = extOf(ref.src) || extOf(ref.original);
    const fmt = formatLabel(ext, mime);
    const animated = fmt === 'GIF';
    let effectiveOriginal = ref.original;
    if (isLocal) { const known = getSourceMap()[ref.src]; if (known) effectiveOriginal = known; }
    let source;
    if (/^https?:/i.test(effectiveOriginal || '')) {
      try { source = new URL(effectiveOriginal).hostname; } catch { source = t('runtime.infoUnknown'); }
    } else source = t('runtime.infoThisDevice');
    const rows = [
      [t('runtime.infoFormat'), fmt],
      [t('runtime.infoDimensions'), dims ? `${dims.w} × ${dims.h}` : t('runtime.infoUnknown')],
      [t('runtime.infoFileSize'), sizeBytes != null ? fmtBytes(sizeBytes) : t('runtime.infoNotSaved')],
      [t('runtime.infoAnimated'), animated ? t('runtime.infoYes') : t('runtime.infoNo')],
      [t('runtime.infoSource'), source]
    ];
    infoBody.innerHTML = `<div class="emon-iv-info-title">${esc(ref.title || t('runtime.image'))}</div>`
      + rows.map(([k, v]) => `<div class="emon-iv-info-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  }
  if (infoClose) infoClose.onclick = closeImageInfo;
  bindBackdropClose(infoEl, closeImageInfo);

  // ---------- Copy link / Save to device, for the live preview ----------
  async function copyPreviewLink(preview) {
    if (!preview) return;
    const link = preview.original || preview.src;
    if (!/^https?:/i.test(link)) { tavo.utils.toast(t('runtime.infoNoLink')); return; }
    try { await navigator.clipboard.writeText(link); tavo.utils.toast(t('runtime.linkCopied')); }
    catch { tavo.utils.toast(t('runtime.error')); }
  }
  async function saveToDevice(preview) {
    if (!preview?.src) return;
    try {
      let path = preview.src;
      if (!/^files\//i.test(path)) path = await persistRemote(path, 'emon-device');
      // tavo.file.export just hands the file to Tavo's own "Save to downloads / Share" sheet — it does not
      // mean the user actually finished (or even saw) that choice yet. Claiming "Image exported" here would be
      // announcing success before it's true, and that sheet is already its own feedback, so no toast on success.
      await tavo.file.export(path);
      if (/(^|\/)emon-device-/i.test(path)) { forgetSource(path); await tavo.file.delete(path, {scope:'chat'}).catch(()=>{}); }
    } catch { tavo.utils.toast(t('runtime.error')); }
  }

  // ---------- Renaming a pin: one shared modal, not a tiny inline edit. Blur never saves by itself,
  // only the Save button or Enter does, so a stray tap can never rename something by accident. ----------
  const renameEl = byId('emon-iv-rename');
  const renameField = byId('emon-iv-rename-field');
  const renameSaveBtn = byId('emon-iv-rename-save');
  const renameCancelBtn = byId('emon-iv-rename-cancel');
  const renameCloseBtn = byId('emon-iv-rename-close');
  let renameTarget = null;
  function openRenameModal(p) {
    if (!renameEl) return;
    renameTarget = {type:'pin', value:p};
    renameField.value = p.title || '';
    showModal(renameEl);
    setTimeout(() => { renameField.focus(); renameField.select(); }, 30);
  }
  function openSavedRenameModal(f) {
    if (!renameEl) return;
    renameTarget = {type:'saved', value:f};
    renameField.value = getSavedDisplayName(f);
    showModal(renameEl);
    setTimeout(() => { renameField.focus(); renameField.select(); }, 30);
  }
  function closeRenameModal() { hideModal(renameEl); renameTarget = null; }
  function cleanSavedBaseName(v, ext) {
    let base = String(v || '').trim().replace(/[\/:*?"<>|]/g,' ').replace(/\s+/g,' ').replace(/^\.+|\.+$/g,'').slice(0,60).trim();
    const lowerExt = String(ext||'').toLowerCase();
    if (lowerExt && new RegExp('\\.' + lowerExt + '$','i').test(base)) base = base.slice(0, -(lowerExt.length+1)).trim();
    return base || 'Image';
  }
  // Renaming a saved image only changes its label. The image file itself is never copied, moved or deleted,
  // so a rename can no longer lose an image (Tavo has no real file-rename anyway).
  async function renameSavedFile(f, requestedName) {
    const ext = extOf(f.name) || (String(f.mimeType||'').split('/')[1] || 'jpg').toLowerCase();
    const base = cleanSavedBaseName(requestedName, ext);
    setDisplayName(f.path, base);
    pins.forEach(pin => {
      if (pin.src === f.path || pin.src === String(f.path).replace(/^files\/chat\//,'')) pin.title = base;
    });
    savePins(); renderPinsList();
    document.querySelectorAll('.emon-iv-pinned').forEach(node => {
      const pin = pins.find(x => String(x.id) === String(node.getAttribute('data-emon-pin')));
      const t2 = node.querySelector('.dragtitle'); if (pin && t2 && (pin.src === f.path || pin.src === String(f.path).replace(/^files\/chat\//,''))) t2.textContent = base;
    });
    await loadSavedPreviews();
    tavo.utils.toast(t('runtime.gallerySaved'));
  }
  async function commitRename() {
    if (!renameTarget) return;
    const v = renameField.value.trim().slice(0, 60);
    if (!v) { tavo.utils.toast(t('runtime.gameNameEnter')); return; }
    try {
      if (renameTarget.type === 'saved') {
        const f = renameTarget.value;
        closeRenameModal();
        await renameSavedFile(f, v);
        return;
      }
      const p = renameTarget.value;
      p.title = v;
      savePins();
      renderPinsList();
      const barTitle = document.querySelector(`[data-emon-pin="${p.id}"] .dragtitle`);
      if (barTitle) barTitle.textContent = v;
      tavo.utils.toast(t('runtime.gallerySaved'));
      closeRenameModal();
    } catch (e) {
      console.error('[Image Preview] rename', e);
      tavo.utils.toast(t('runtime.error'));
    }
  }
  if (renameSaveBtn) renameSaveBtn.onclick = commitRename;
  if (renameCancelBtn) renameCancelBtn.onclick = closeRenameModal;
  if (renameCloseBtn) renameCloseBtn.onclick = closeRenameModal;
  if (renameField) renameField.addEventListener('keydown', e => {
    if (e.key === 'Enter') commitRename(); else if (e.key === 'Escape') closeRenameModal();
  });
  bindBackdropClose(renameEl, closeRenameModal);

  function defaultPinPos(size) {
    return { x: Math.max(8, window.innerWidth - size - 22), y: Math.max(80, window.innerHeight - size - 170) };
  }
  // "Reset" clears zoom, rotation and flip, and also moves the pin back to a normal on-screen spot —
  // the one guaranteed way to recover a pin that ended up somewhere hard to reach or grab.
  function resetPin(p) {
    const size = Number(cfg().defaultImageSize || 220);
    const pos = defaultPinPos(size);
    p.scale = 1; p.width = size; p.rotation = 0; p.flip = false; p.x = pos.x; p.y = pos.y;
    applyPin(p);
    savePins();
  }

  async function pinPreview(preview, offsetIndex = 0, refreshSaved = true) {
    if (!preview?.src) return;
    if (pins.length >= MAX_PINS) { tavo.utils.toast(t('runtime.pinLimit', { n: MAX_PINS })); return false; }
    try {
      let src = preview.src;
      let createdNewFile = false;
      if (/^https?:/i.test(src) || /^data:image\//i.test(src)) {
        src = await persistRemote(src, 'emon-pin');
        createdNewFile = true;
      } else if (/^files\//i.test(src)) {
        const stillThere = await tavo.file.exists(src, { scope: 'chat' }).catch(() => false);
        if (!stillThere) throw new Error('gone');
      }
      const c = cfg();
      const size = Number(c.defaultImageSize || 220);
      const opacity = Number(c.defaultOpacity || .95);
      const basePos = defaultPinPos(size);
      const step = 26;
      const pos = offsetIndex
        ? { x: Math.max(8, basePos.x - (offsetIndex % 6) * step), y: Math.max(60, basePos.y - Math.floor(offsetIndex / 6) * step) }
        : basePos;
      const item = {
        id: ++pinSeq,
        src,
        original: /^data:/i.test(preview.original || preview.src || '') ? '' : (preview.original || preview.src),
        title: preview.title || t('runtime.image'),
        ...pos,
        width: size,
        scale: 1,
        opacity,
        rotation: 0,
        flip: false,
        barCollapsed: true
      };
      pins.push(item);
      renderPin(item);
      savePins();
      renderPinsList();
      if (createdNewFile && refreshSaved) await loadSavedPreviews();
      setStatus(t('runtime.pinnedNow'));
    } catch (e) {
      console.error(e);
      tavo.utils.toast((e && e.msgKey) ? t(e.msgKey) : (e && e.message === 'gone') ? t('runtime.originalGone') : t('runtime.error'));
    }
  }

  function savePins() {
    if (!cfg().rememberPins) return;
    try {
      tavo.set('emonImageViewerPins', [...pins.map(p => ({...p})), ...pinsOverflow],'chat');
    } catch {}
  }

  function removePin(id, persist=true) {
    const el = document.querySelector(`[data-emon-pin="${id}"]`);
    if (el) {
      el.classList.remove('emon-iv-spawn');
      if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){ el.remove(); }
      else { el.classList.add('emon-iv-despawn'); setTimeout(() => el.remove(), 520); }
    }
    pins = pins.filter(p => p.id !== id);
    if (persist) { savePins(); renderPinsList(); setStatus(t('runtime.unpinned')); }
  }

  // Unpins everything at once. This only removes the on-chat pins — it does not touch the
  // underlying saved files, so nothing in the Saved images shelf is lost.
  function clearAllPins() {
    if (!pins.length) return;
    const ok = typeof confirm === 'function' ? confirm(t('runtime.confirmClearPins')) : true;
    if (!ok) return;
    pins.slice().forEach(p => removePin(p.id, false));
    pinsOverflow = [];
    savePins(); renderPinsList();
    tavo.utils.toast(t('runtime.pinsCleared'));
  }

  // Pins that did not fit under the limit wait in storage; each freed slot brings the next one back.
  function fillFreeSlots() {
    let changed = false;
    while (pins.length < MAX_PINS && pinsOverflow.length) {
      const o = pinsOverflow.shift();
      const p = { ...o, id: ++pinSeq, barCollapsed: typeof o.barCollapsed === 'boolean' ? o.barCollapsed : true };
      keepPinReachable(p); pins.push(p); renderPin(p); changed = true;
    }
    if (changed) savePins();
  }
  function renderPinsList() {
    if (!pinnedList) return;
    fillFreeSlots();
    if (pinsClearBtn) pinsClearBtn.style.display = pins.length ? '' : 'none';
    pinnedList.innerHTML = '';
    if (!pins.length) {
      pinnedList.innerHTML = `<div class="emon-iv-empty">${esc(t('runtime.noPins'))}</div>`;
      return;
    }
    const ordered = pins.slice().sort((a, b) => b.id - a.id);
    for (const p of ordered) {
      const row = document.createElement('div');
      row.className = 'emon-iv-pinrow';
      row.innerHTML = `<span class="rn">${esc(p.title || t('runtime.image'))}</span>
        <button data-action="fullscreen" aria-label="${esc(t('runtime.fullscreen'))}">⛶</button>
        <button data-action="rename" aria-label="${esc(t('runtime.gameChangeName'))}">✎</button>
        <button data-action="info" aria-label="${esc(t('runtime.infoBtn'))}">ⓘ</button>
        <button data-action="zoomOut">−</button><button data-action="zoomIn">+</button>
        <button data-action="reset">${esc(t('runtime.reset'))}</button>
        <button data-action="remove">${esc(t('runtime.remove'))}</button>`;
      row.querySelector('[data-action="fullscreen"]').onclick = e => { e.stopPropagation(); tavo.utils.preview(p.src); };
      row.querySelector('[data-action="rename"]').onclick = e => { e.stopPropagation(); openRenameModal(p); };
      row.querySelector('[data-action="info"]').onclick = e => { e.stopPropagation(); showImageInfo(p, document.querySelector(`[data-emon-pin="${p.id}"] img`)); };
      row.querySelector('[data-action="zoomOut"]').onclick = e => { e.stopPropagation(); setScale(p, p.scale * .85); };
      row.querySelector('[data-action="zoomIn"]').onclick = e => { e.stopPropagation(); setScale(p, p.scale * 1.18); };
      row.querySelector('[data-action="reset"]').onclick = e => { e.stopPropagation(); resetPin(p); };
      row.querySelector('[data-action="remove"]').onclick = e => { e.stopPropagation(); removePin(p.id); };
      pinnedList.appendChild(row);
    }
    if (pinsOverflow.length) pinnedList.insertAdjacentHTML('beforeend', `<div class="emon-iv-empty">${esc(t('runtime.pinsWaitingNote', { n: pinsOverflow.length }))}</div>`);
  }

  function setScale(p, value) {
    p.scale = Math.max(.35, Math.min(4, value));
    applyPin(p);
    savePins();
  }

  function applyPin(p) {
    const el = document.querySelector(`[data-emon-pin="${p.id}"]`);
    if (!el) return;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    el.style.width = `${p.width}px`;
    el.style.opacity = String(p.opacity);
    el.dataset.scale = String(p.scale);
    const img = el.querySelector('img');
    const rotation = Number(p.rotation) || 0;
    img.style.transform = `rotate(${rotation}deg) scaleX(${p.flip ? -1 : 1}) scale(${p.scale})`;
    img.style.transformOrigin = 'center center';
  }

  function renderPin(p) {
    const el = document.createElement('div');
    el.className = 'emon-iv-pinned';
    el.dataset.emonPin = p.id;
    el.innerHTML = `
      <div class="bar">
        <button class="bartoggle" data-act="barToggle" aria-label="Toggle toolbar">︿</button>
        <button class="zoom" data-act="minus" aria-label="${esc(t('runtime.zoomOut'))}">−</button>
        <button class="zoom" data-act="plus" aria-label="${esc(t('runtime.zoomIn'))}">+</button>
        <button data-act="reset" aria-label="${esc(t('runtime.reset'))}">↺</button>
        <span class="dragtitle">${esc(p.title || t('runtime.image'))}</span>
        <button data-act="rotate" aria-label="${esc(t('runtime.rotateBtn'))}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 11A8 8 0 1 0 18 16"/><path d="M20 5v6h-6"/></svg></button>
        <button data-act="flip" aria-label="${esc(t('runtime.flipBtn'))}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M7 7l-4 5 4 5M17 7l4 5-4 5"/></svg></button>
        <button data-act="full" aria-label="${esc(t('runtime.fullscreen'))}">⛶</button>
        <button data-act="remove" aria-label="${esc(t('runtime.remove'))}">×</button>
      </div>
      <img src="${esc(p.src)}" alt="" referrerpolicy="no-referrer">
      <div class="sizebadge"></div>
      <div class="grip"></div>
    `;
    el.classList.add('emon-iv-spawn');
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.classList.remove('emon-iv-spawn'), {once:true});
    bindPinDrag(el,p);
    el.querySelector('[data-act="minus"]').onclick = e => {e.stopPropagation();setScale(p,p.scale*.85)};
    el.querySelector('[data-act="plus"]').onclick = e => {e.stopPropagation();setScale(p,p.scale*1.18)};
    el.querySelector('[data-act="reset"]').onclick = e => {e.stopPropagation();resetPin(p)};
    el.querySelector('[data-act="rotate"]').onclick = e => { e.stopPropagation(); p.rotation = ((Number(p.rotation)||0) + 90) % 360; applyPin(p); savePins(); };
    el.querySelector('[data-act="flip"]').onclick = e => { e.stopPropagation(); p.flip = !p.flip; applyPin(p); savePins(); };
    el.querySelector('[data-act="full"]').onclick = e => {e.stopPropagation();tavo.utils.preview(p.src)};
    el.querySelector('[data-act="remove"]').onclick = e => {e.stopPropagation();removePin(p.id)};
    el.querySelector('img').ondblclick = () => tavo.utils.preview(p.src);
    const barToggleBtn = el.querySelector('[data-act="barToggle"]');
    const barEl = el.querySelector('.bar');
    const applyBarCollapsed = () => {
      barEl.classList.toggle('collapsed', !!p.barCollapsed);
      barToggleBtn.textContent = p.barCollapsed ? '⌄' : '⌃';
      barToggleBtn.title = t(p.barCollapsed ? 'runtime.pinBarShow' : 'runtime.pinBarHide');
      barToggleBtn.setAttribute('aria-label', t(p.barCollapsed ? 'runtime.pinBarShow' : 'runtime.pinBarHide'));
    };
    barToggleBtn.onclick = e => { e.stopPropagation(); p.barCollapsed = !p.barCollapsed; applyBarCollapsed(); savePins(); };
    applyBarCollapsed();
    applyPin(p);
  }

  function bindPinDrag(el,p) {
    const grip = el.querySelector('.grip');
    const badge = el.querySelector('.sizebadge');
    const pointers = new Map(); // pointerId -> {x,y}, tracks every finger currently down on this element
    let mode = null; // 'drag' | 'resize' | 'pinch'
    let sx=0, sy=0, ox=0, oy=0, ow=0;
    let pinchStartDist=0, pinchStartWidth=0;
    let tapCand=null, lastTapAt=0, lastTapX=0, lastTapY=0; // double-tap detection (touch drag blocks the browser's own dblclick)

    const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
    const showBadge = () => { if(badge){ badge.textContent = Math.round(p.width)+'px'; badge.classList.add('show'); } };
    const hideBadge = () => badge?.classList.remove('show');

    const beginPinch = () => {
      const pts = [...pointers.values()];
      mode='pinch';
      pinchStartDist = dist(pts[0], pts[1]) || 1;
      pinchStartWidth = p.width;
    };

    el.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || e.target.closest('input')) return;
      const isGrip = e.target === grip;
      el.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (pointers.size >= 2) {
        tapCand = null;
        beginPinch();
        showBadge();
      } else {
        mode = isGrip ? 'resize' : 'drag';
        sx=e.clientX; sy=e.clientY; ox=p.x; oy=p.y; ow=p.width;
        tapCand = (!isGrip && e.target === el) ? {t:performance.now(), x:e.clientX, y:e.clientY} : null; // the image itself ignores touches, so a tap on the picture lands on the frame
        if (isGrip) showBadge();
      }
      e.preventDefault();
    });

    el.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});

      if (mode==='pinch' && pointers.size>=2) {
        const pts=[...pointers.values()];
        const d=dist(pts[0],pts[1]);
        p.width = Math.max(90, Math.min(innerWidth*.75, pinchStartWidth*(d/pinchStartDist)));
        applyPin(p); showBadge();
        e.preventDefault();
        return;
      }
      if (mode==='drag') {
        p.x=Math.max(0,Math.min(innerWidth-el.offsetWidth, ox+e.clientX-sx));
        p.y=Math.max(0,Math.min(innerHeight-el.offsetHeight, oy+e.clientY-sy));
        applyPin(p);
      } else if (mode==='resize') {
        p.width=Math.max(90,Math.min(innerWidth*.75, ow+e.clientX-sx));
        applyPin(p); showBadge();
      }
      e.preventDefault();
    });

    const endPointer = e => {
      const wasSingle = pointers.size === 1;
      pointers.delete(e.pointerId);
      if (e.type === 'pointerup' && wasSingle && tapCand) {
        const now = performance.now(), moved = Math.hypot(e.clientX - tapCand.x, e.clientY - tapCand.y);
        if (now - tapCand.t < 450 && moved < 12) {
          if (now - lastTapAt < 380 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 40) {
            lastTapAt = 0;
            try { tavo.utils.preview(p.src); } catch {}
          } else { lastTapAt = now; lastTapX = e.clientX; lastTapY = e.clientY; }
        }
      }
      tapCand = null;
      try{ el.releasePointerCapture?.(e.pointerId); }catch{}
      if (pointers.size===0) {
        if (mode) savePins();
        mode=null;
        hideBadge();
      } else if (mode==='pinch' && pointers.size===1) {
        // one finger lifted mid-pinch: smoothly hand off to a plain drag from here, no jump
        savePins();
        const [pos] = [...pointers.values()];
        mode='drag'; sx=pos.x; sy=pos.y; ox=p.x; oy=p.y;
        hideBadge();
      }
    };
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
  }

  // A character's avatar is normally a path inside the app. A web address is allowed only if it passes the same public-image rules
  // as every other picture here; anything else (other schemes, private addresses) is not loaded.
  function safeAvatarSrc(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    try { if (s.startsWith(location.origin + '/')) return s; } catch {}                      // the app's own address
    if (/^https?:\/\//i.test(s)) return (isFetchableUrl(s) && !isAdHost(s)) ? s : '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//') || s.includes('\\')) return '';
    return s;
  }
  function renderProfiles() {
    tavo.chat.current().then(chat=>{
      profilesEl.innerHTML='';
      const chars=chat?.characters || [];
      if(!chars.length){profilesEl.innerHTML=`<div class="emon-iv-empty">${esc(t('runtime.noProfiles'))}</div>`;return;}
      for(const ch0 of chars){
        const ch={...ch0,avatar:safeAvatarSrc(ch0&&ch0.avatar)};
        const card=document.createElement('button');card.className='emon-iv-card';
        card.innerHTML=`<img src="${esc(ch.avatar||'')}" alt="" loading="lazy" decoding="async"><div class="name">${esc(ch.name||t('runtime.profile'))}</div>`;
        card.onclick=()=>{
          if(!ch.avatar)return;
          currentPreview={src:ch.avatar,original:ch.avatar,source:'direct',title:ch.name};
          previewImg.src=ch.avatar;previewMeta.textContent=t('runtime.profile');previewEl.classList.add('show');
          setStatus(t('runtime.ready'));
        };
        profilesEl.appendChild(card);
      }
    }).catch(e=>console.error(e));
  }

  // ---------- Saved-preview action sheet: tap a saved image for a full set of actions ----------
  // ---- Panel look: everything the little monkey opens. Choices made there are stored globally. Applied live on <html>
  // because modals are portaled to <body>, outside #emon-iv-root.
  const PANEL_FONTS={system:'',serif:'Georgia,"Times New Roman",serif',rounded:'ui-rounded,"Nunito","Trebuchet MS","Segoe UI",system-ui,sans-serif',mono:'ui-monospace,Menlo,Consolas,monospace',handwriting:'"Segoe Print","Bradley Hand","Comic Sans MS",cursive'};
  const PANEL_BGS={default:'',forest:'linear-gradient(160deg,#12331f,#0c1d15 60%,#08140f)',ocean:'linear-gradient(160deg,#0d3350,#0a1e30 60%,#070f1a)',sunset:'linear-gradient(160deg,#4a1f36,#2b1522 55%,#150c14)',rose:'linear-gradient(160deg,#48192b,#26111c 60%,#12080d)',midnight:'linear-gradient(160deg,#1a2040,#0e1224 60%,#080a14)',aurora:'linear-gradient(150deg,#0d3735,#1c1e42 55%,#0d0f1f)'};
  const FAB_THEMES={violet:['#9b6cff','#6337d9'],forest:['#34d399','#047857'],sunset:['#fb923c','#db2777'],ocean:['#38bdf8','#0369a1'],rose:['#fb7185','#9d174d'],mono:['#9ca3af','#374151']};
  const FAB_ICONS={classic:'🖼️',leaf:'🌿',moon:'🌙',star:'⭐',blossom:'🌸',butterfly:'🦋',wave:'🌊',orb:'🔮'};
  const WALL_VAR='emonImageViewerWallpaper';
  const LOOK_VAR='emonImageViewerLook';
  const wallPickBtn=byId('emon-iv-wall-pick');
  const wallRemoveBtn=byId('emon-iv-wall-remove');
  let wallBusy=false;
  function getWallPath(){ try{ const v=tavo.get(WALL_VAR,'global'); return (typeof v==='string' && /^files\/global\/[\w.-]+$/.test(v)) ? v : ''; }catch{ return ''; } }
  function getLookOverrides(){ try{ const v=tavo.get(LOOK_VAR,'global'); return (v && typeof v==='object') ? v : {}; }catch{ return {}; } }
  const LOOK_DEFAULTS={panelFont:'system',panelBackground:'default',wallpaperUrl:'',wallpaperDim:0.6,fabIcon:'leaf',fabTheme:'forest'};
  function lookVal(key){ const o=getLookOverrides(); return (o[key]!==undefined && o[key]!==null) ? o[key] : LOOK_DEFAULTS[key]; }
  function setLookVal(key,val){ try{ tavo.set(LOOK_VAR,{...getLookOverrides(),[key]:val},'global'); }catch{} applyPanelLook(); }
  function applyFabLook(){
    const th=FAB_THEMES[lookVal('fabTheme')]||FAB_THEMES.forest;
    fab.style.setProperty('--emon-fab-a',th[0]); fab.style.setProperty('--emon-fab-b',th[1]);
    const span=fab.querySelector('span'); if(span) span.textContent=FAB_ICONS[lookVal('fabIcon')]||FAB_ICONS.leaf;
  }
  function applyPanelLook(){
    try{
      const rootEl=document.documentElement;
      const fontVal=PANEL_FONTS[lookVal('panelFont')]||'';
      if(fontVal) rootEl.style.setProperty('--emon-iv-font',fontVal); else rootEl.style.removeProperty('--emon-iv-font');
      const dim=Math.max(0.2,Math.min(0.9,Number(lookVal('wallpaperDim') ?? 0.6)));
      const shade=`linear-gradient(rgba(8,11,18,${dim}),rgba(8,11,18,${dim}))`;
      const devicePath=getWallPath();
      const link=String(lookVal('wallpaperUrl')||'').trim();
      let bgVal=PANEL_BGS[lookVal('panelBackground')]||'';
      if(devicePath){ let abs=devicePath; try{ abs=new URL(devicePath,document.baseURI).href; }catch{} bgVal=`${shade},url("${abs}")`; }                                    // picked from the phone wins
      else if(/^https?:\/\/[^\s"'()<>\\]+$/i.test(link) && isFetchableUrl(link)) bgVal=`${shade},url(${link})`;      // then a pasted link
      if(bgVal) rootEl.style.setProperty('--emon-iv-bg',bgVal); else rootEl.style.removeProperty('--emon-iv-bg');
      if(wallRemoveBtn) wallRemoveBtn.disabled=!devicePath;
      applyFabLook();
    }catch{}
  }
  // Phone photos are huge; shrink to a sensible size so the panel stays quick to open.
  function downscaleToJpeg(dataUrl,max){
    return new Promise((res,rej)=>{
      const img=new Image();
      img.onload=()=>{
        const r=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
        const w=Math.max(1,Math.round(img.naturalWidth*r)), h=Math.max(1,Math.round(img.naturalHeight*r));
        const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
        const cx=cv.getContext('2d'); cx.fillStyle='#0e131d'; cx.fillRect(0,0,w,h); cx.drawImage(img,0,0,w,h);
        res(cv.toDataURL('image/jpeg',0.86));
      };
      img.onerror=()=>rej(new Error('decode'));
      img.src=dataUrl;
    });
  }
  async function pickWallpaper(){
    if(wallBusy) return; wallBusy=true;
    if(wallPickBtn) wallPickBtn.disabled=true;
    try{
      const picked=await tavo.file.import({extensions:['jpg','jpeg','png','webp','avif','bmp'],scope:'tmp'});
      const f=picked && picked[0];
      if(!f) return;
      const dataUrl=await tavo.file.load(f.path,{encoding:'dataUrl'});
      if(!dataUrl) throw new Error('read');
      const jpeg=await downscaleToJpeg(dataUrl,1280);
      const oldPath=getWallPath();
      const path=await tavo.file.save(`emon-iv-wallpaper-${Date.now()}.jpg`,jpeg,{scope:'global',encoding:'dataUrl'});
      if(!path) throw new Error('save');
      tavo.set(WALL_VAR,path,'global');
      if(oldPath) tavo.file.delete(oldPath).catch(()=>{});
      tavo.file.delete(f.path).catch(()=>{});
      applyPanelLook();
      tavo.utils.toast(t('runtime.wallSet'));
    }catch(e){ console.error('[Image Preview] wallpaper',e); tavo.utils.toast(t('runtime.wallFailed')); }
    finally{ wallBusy=false; if(wallPickBtn) wallPickBtn.disabled=false; }
  }
  async function removeWallpaper(){
    const oldPath=getWallPath();
    if(!oldPath) return;
    try{ tavo.set(WALL_VAR,null,'global'); await tavo.file.delete(oldPath).catch(()=>{}); }catch{}
    applyPanelLook();
    tavo.utils.toast(t('runtime.wallRemoved'));
  }
  if(wallPickBtn) wallPickBtn.onclick=pickWallpaper;
  if(wallRemoveBtn) wallRemoveBtn.onclick=removeWallpaper;

  // The look pop-up (opened by tapping the monkey)
  const lookModal=byId('emon-iv-look-modal');
  const lookLink=byId('emon-iv-look-link');
  const lookDim=byId('emon-iv-look-dim');
  const lookSelects={
    panelBackground:[byId('emon-iv-look-bg'),[['default','settings.bgDefault'],['forest','settings.bgForest'],['ocean','settings.bgOcean'],['sunset','settings.bgSunset'],['rose','settings.bgRose'],['midnight','settings.bgMidnight'],['aurora','settings.bgAurora']]],
    panelFont:[byId('emon-iv-look-font'),[['system','settings.fontSystem'],['serif','settings.fontSerif'],['rounded','settings.fontRounded'],['mono','settings.fontMono'],['handwriting','settings.fontHandwriting']]],
    fabIcon:[byId('emon-iv-look-fabicon'),[['leaf','settings.fabIconLeaf'],['classic','settings.fabIconClassic'],['moon','settings.fabIconMoon'],['star','settings.fabIconStar'],['blossom','settings.fabIconBlossom'],['butterfly','settings.fabIconButterfly'],['wave','settings.fabIconWave'],['orb','settings.fabIconOrb']]],
    fabTheme:[byId('emon-iv-look-fabtheme'),[['forest','settings.fabThemeForest'],['violet','settings.fabThemeViolet'],['sunset','settings.fabThemeSunset'],['ocean','settings.fabThemeOcean'],['rose','settings.fabThemeRose'],['mono','settings.fabThemeMono']]]
  };
  function syncLookModal(){
    for(const [key,[sel,opts]] of Object.entries(lookSelects)){
      if(!sel) continue;
      sel.innerHTML=opts.map(([v,k])=>`<option value="${esc(v)}">${esc(t(k))}</option>`).join('');
      sel.value=String(lookVal(key)||opts[0][0]);
    }
    if(lookLink) lookLink.value=String(lookVal('wallpaperUrl')||'');
    if(lookDim) lookDim.value=String(lookVal('wallpaperDim') ?? 0.6);
    applyPanelLook();
  }
  for(const [key,[sel]] of Object.entries(lookSelects)){ if(sel) sel.onchange=()=>setLookVal(key,sel.value); }
  if(lookDim) lookDim.oninput=()=>setLookVal('wallpaperDim',Number(lookDim.value));
  if(lookLink) lookLink.onchange=()=>{
    const v=lookLink.value.trim();
    if(v && (!/^https?:\/\/[^\s"'()<>\\]+$/i.test(v) || !isFetchableUrl(v))){ tavo.utils.toast(t('runtime.lookLinkBad')); return; }
    setLookVal('wallpaperUrl',v);
  };
  const lookResetBtn=byId('emon-iv-look-reset');
  if(lookResetBtn) lookResetBtn.onclick=()=>{ try{ tavo.set(LOOK_VAR,null,'global'); }catch{} syncLookModal(); tavo.utils.toast(t('runtime.lookResetDone')); };
  const lookCloseBtn=byId('emon-iv-look-close');
  if(lookCloseBtn) lookCloseBtn.onclick=()=>hideModal(lookModal);
  bindBackdropClose(lookModal,()=>hideModal(lookModal));

  // The monkey: chews a banana until poked, gets grumpy, then opens the look pop-up.
  const monkeyBtn=byId('emon-iv-monkey');
  let monkeyBusy=false;
  if(monkeyBtn) monkeyBtn.onclick=()=>{
    if(monkeyBusy) return; monkeyBusy=true;
    const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    monkeyBtn.classList.add('angry');
    setTimeout(()=>{ syncLookModal(); showModal(lookModal); },reduced?0:700);
    setTimeout(()=>{ monkeyBtn.classList.remove('angry'); monkeyBusy=false; },reduced?200:1150);
  };

  // "Extract images from text" (see entry.js): entry.js finds the links and hands them here as a
  // plain array; this only renders the picker and saves the picks (via persistRemote). Pinning any
  // of them onto the chat afterward happens from Saved Previews' Select mode, not from here.
  const extractModal = byId('emon-iv-extract-modal');
  const extractGrid = byId('emon-iv-extract-grid');
  const extractSubtitle = byId('emon-iv-extract-subtitle');
  const extractCloseBtn = byId('emon-iv-extract-close');
  const extractSaveSelectedBtn = byId('emon-iv-extract-save-selected');
  const extractSaveAllBtn = byId('emon-iv-extract-save-all');
  const extractSelectAllBtn = byId('emon-iv-extract-select-all');
  const extractSelectNoneBtn = byId('emon-iv-extract-select-none');
  const extractNote = byId('emon-iv-extract-note');
  const extractRescanRow = byId('emon-iv-extract-rescan-row');
  const extractRescanBtn = byId('emon-iv-extract-rescan');
  const extractTools = byId('emon-iv-extract-tools');
  const extractRetryBtn = byId('emon-iv-extract-retry');
  const extractAdsBtn = byId('emon-iv-extract-ads');
  let extractGen = 0, extractAds = [], extractAdSet = new Set(), extractAdsShown = false, extractScan = null;
  const scanChatBtn = byId('emon-iv-scan-chat');
  let extractItems = [];
  const EXTRACT_MAX = 200;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // One click handler and one error handler for the whole grid instead of two per tile: far fewer listeners
  // to keep alive (up to 200 tiles) on a small phone. Image "error" events do not bubble, so that one
  // listens in the capture phase.
  if (extractGrid) {
    extractGrid.addEventListener('click', (e) => {
      const tile = e.target.closest && e.target.closest('.emon-iv-extract-tile');
      const it = tile && extractItems[Number(tile.dataset.i)];
      if (!it) return;
      if (it.broken) { extractRetry(tile, it); return; }     // a picture that did not load: tap it to try again
      if (it.already) return;                                 // already-saved tiles can't be picked
      it.picked = !it.picked;
      tile.classList.toggle('picked', it.picked);
      updateExtractButtons();
    });
  }
  if (extractRetryBtn) extractRetryBtn.onclick = retryBroken;
  if (extractAdsBtn) extractAdsBtn.onclick = () => { extractAdsShown = !extractAdsShown; rebuildScanItems(); };

  function renderExtractGrid() {
    if (!extractGrid) return;
    const gen = ++extractGen;
    extractGrid.innerHTML = extractItems.length
      ? extractItems.map((it, i) =>
          `<div class="emon-iv-extract-tile${it.already ? ' saved' : it.picked ? ' picked' : ''}${it.ad ? ' ad' : ''}" data-i="${i}"><img data-src="${esc(it.url)}" alt="" decoding="async" referrerpolicy="no-referrer">${it.already ? `<span class="badge">${esc(t('runtime.tileSaved'))}</span>` : ''}</div>`
        ).join('')
      : `<div class="emon-iv-empty" style="grid-column:1/-1">${esc(t('runtime.scanNone'))}</div>`;
    extractGrid.querySelectorAll('.emon-iv-extract-tile').forEach(tile => {
      const i = Number(tile.dataset.i), img = tile.querySelector('img');
      if (img) tileLoad(img, ok => extractTileResult(gen, i, ok));
    });
    updateExtractButtons();
  }
  function extractTileResult(gen, i, ok) {
    if (gen !== extractGen) return;
    const it = extractItems[i], tile = extractGrid && extractGrid.querySelector(`.emon-iv-extract-tile[data-i="${i}"]`);
    if (!it || !tile) return;
    if (ok) { if (it.broken) { it.broken = false; if (!it.already) it.picked = true; tile.classList.remove('broken'); tile.classList.toggle('picked', !!it.picked); } }   // a picture that finally loaded is selected again like the others
    else if (!it.broken) { it.broken = true; it.picked = false; tile.classList.add('broken'); tile.classList.remove('picked'); }
    updateExtractButtons();
  }
  function extractRetry(tile, it) {
    if (!tile || !it) return;
    it.broken = false; tile.classList.remove('broken');
    const im = tile.querySelector('img'); if (im) tileRetry(im);
    updateExtractButtons();
  }
  function retryBroken() {
    if (!extractGrid) return;
    extractGrid.querySelectorAll('.emon-iv-extract-tile.broken').forEach(tile => extractRetry(tile, extractItems[Number(tile.dataset.i)]));
  }
  function extractToolsUpdate() {
    const failed = extractItems.filter(it => it.broken).length;
    if (extractRetryBtn) { extractRetryBtn.hidden = !failed; if (failed) extractRetryBtn.textContent = t('runtime.retryFailed', { n: failed }); }
    if (extractAdsBtn) { extractAdsBtn.hidden = !extractAds.length; if (extractAds.length) extractAdsBtn.textContent = t(extractAdsShown ? 'runtime.adsHide' : 'runtime.adsShow', { n: extractAds.length }); }
    if (extractTools) extractTools.hidden = !(failed || extractAds.length);
  }
  function rebuildScanItems() {
    if (!extractScan) return;
    const arr = extractAdsShown ? extractScan.kept.concat(extractScan.hiddenAds) : extractScan.kept;
    showExtractPicker(arr.map(([u]) => u), { scan: true, note: extractScan.noteFor(arr), keep: true }).catch(() => {});
  }

  // Tiles already in Saved Previews can't be picked, so they never count as "selected" or in "Save all".
  function extractedUsable(selectedOnly){
    return extractItems.filter(it => (!selectedOnly || it.picked) && !it.broken && !it.already);
  }

  function updateExtractButtons() {
    extractToolsUpdate();
    const selected = extractedUsable(true).length;
    const usable = extractedUsable(false).length;
    const found = extractItems.filter(it => !it.broken).length;
    const saved = extractItems.filter(it => it.already && !it.broken).length;
    if (extractSubtitle) {
      extractSubtitle.textContent = saved
        ? t('runtime.extractSubtitleSaved', { n: found, saved, selected })
        : t('runtime.extractSubtitle', { n: found, selected });
    }
    if (extractSaveSelectedBtn) {
      extractSaveSelectedBtn.textContent = t('runtime.saveExtractSelected').replace('{n}', String(selected));
      extractSaveSelectedBtn.disabled = selected === 0;
    }
    if (extractSaveAllBtn) {
      extractSaveAllBtn.textContent = t('runtime.saveExtractAll').replace('{n}', String(usable));
      extractSaveAllBtn.disabled = usable === 0;
    }
    if (extractSaving) {   // a save is still running (even if the picker was closed and reopened): show where it is, keep the buttons locked
      if (extractProgress && extractSubtitle) extractSubtitle.textContent = t('runtime.savingProgress', extractProgress);
      if (extractSaveSelectedBtn) extractSaveSelectedBtn.disabled = true;
      if (extractSaveAllBtn) extractSaveAllBtn.disabled = true;
    }
  }

  let extractSaving = false, extractProgress = null;
  function extractResultText(saved, skipped, failed) {
    if (!saved && skipped && !failed) return t('runtime.resNothingNew', { n: skipped });
    const parts = [];
    if (saved) parts.push(t('runtime.resSaved', { n: saved }));
    if (skipped) parts.push(t('runtime.resSkipped', { n: skipped }));
    if (failed) parts.push(t('runtime.resFailed', { n: failed }));
    return parts.join(' · ');
  }
  async function saveExtracted(list) {
    if (extractSaving) return;
    extractSaving = true;
    if (extractSaveSelectedBtn) extractSaveSelectedBtn.disabled = true;
    if (extractSaveAllBtn) extractSaveAllBtn.disabled = true;
    try {
      let saved = 0, skipped = 0, failed = 0, idx = 0;
      prefetchPeeks(list.map(it => it.url));
      for (const it of list) {
        extractProgress = { i: ++idx, n: list.length };
        if (extractSubtitle) extractSubtitle.textContent = t('runtime.savingProgress', extractProgress);
        try {
          // Already in Saved Previews (maybe saved a moment ago from somewhere else)? Leave it alone.
          if (await findExistingBySource(it.url, true)) { skipped++; continue; }
          await persistRemote(it.url, 'emon-preview', true);
          saved++;
        } catch (e) { failed++; console.warn('[Image Preview] extracted save failed', e); }
      }
      await loadSavedPreviews();
      hideModal(extractModal);
      const msg = extractResultText(saved, skipped, failed);
      if (msg) tavo.utils.toast(msg);
    } finally {
      extractSaving = false; extractProgress = null;
    }
  }

  if (extractSaveSelectedBtn) extractSaveSelectedBtn.onclick = () => {
    if (extractSaving) return;
    const picked = extractedUsable(true);
    if (picked.length) saveExtracted(picked);
  };
  if (extractSaveAllBtn) extractSaveAllBtn.onclick = () => {
    if (extractSaving) return;
    const usable = extractedUsable(false);
    if (usable.length) saveExtracted(usable);
  };
  if (extractCloseBtn) extractCloseBtn.onclick = () => hideModal(extractModal);
  if (extractSelectAllBtn) extractSelectAllBtn.onclick = () => {
    extractItems.forEach(it => { if (!it.broken && !it.already) it.picked = true; });
    extractGrid.querySelectorAll('.emon-iv-extract-tile:not(.broken):not(.saved)').forEach(tile => tile.classList.add('picked'));
    updateExtractButtons();
  };
  if (extractSelectNoneBtn) extractSelectNoneBtn.onclick = () => {
    extractItems.forEach(it => { it.picked = false; });
    extractGrid.querySelectorAll('.emon-iv-extract-tile').forEach(tile => tile.classList.remove('picked'));
    updateExtractButtons();
  };
  bindBackdropClose(extractModal, () => hideModal(extractModal));

  // Web addresses of everything already in Saved Previews, so the picker can mark them and skip them.
  async function savedSourceSet() {
    const out = new Set();
    try {
      const files = await listChatFilesMatching(f => SAVED_RE.test(f.name) && /^image\//i.test(f.mimeType || ''));
      const map = getSourceMap();
      for (const f of files) if (map[f.path]) out.add(map[f.path]);
    } catch {}
    return out;
  }

  // Shows the picker for a list of found links. `meta` is null for "Extract images from text" (entry.js), or
  // { scan:true, note, keep } for "Scan this chat for images" (adds the summary line and the Rescan button).
  // `keep` marks a rescan: the person's tile choices carry over, and the result says what changed.
  async function showExtractPicker(raw, meta) {
    if (!termsAgreed()) { requireTerms(() => showExtractPicker(raw, meta)); return null; }
    const scan = !!(meta && meta.scan);
    const keep = !!(meta && meta.keep);
    if (!scan) { extractScan = null; extractAds = []; extractAdSet = new Set(); extractAdsShown = false; }
    // Only public web addresses (and, for a chat scan, no ad/tracker hosts), and at most EXTRACT_MAX tiles: a
    // huge or hostile paste or card must never make the phone open thousands of connections, or connect to
    // other devices on your network.
    const good = [...new Set(raw.filter(u => typeof u === 'string' && isFetchableUrl(u) && !(scan && isAdHost(u))))];
    const prevItems = extractItems;
    if (!good.length) {
      if (keep) { extractItems = []; if (extractNote) extractNote.style.display = 'none'; renderExtractGrid(); }
      else tavo.utils.toast(t(scan ? 'runtime.scanNone' : 'runtime.extractNone'));
      return { total: 0, added: 0, removed: keep ? prevItems.length : 0 };
    }
    const urls = good.slice(0, EXTRACT_MAX);
    if (good.length > urls.length) tavo.utils.toast(t('runtime.extractCapped', { shown: urls.length, total: good.length }));
    const saved = await savedSourceSet();
    const prev = keep ? new Map(prevItems.map(it => [it.url, it])) : null;
    const next = urls.map(u => {
      const old = prev && prev.get(u);
      const already = saved.has(srcKey(u));
      return { url: u, picked: !already && (old ? old.picked : true), broken: false, already, ad: extractAdSet.has(u) };
    });
    const nextUrls = new Set(urls);
    const added = prev ? next.filter(it => !prev.has(it.url)).length : next.length;
    const removed = prev ? [...prev.keys()].filter(u => !nextUrls.has(u)).length : 0;
    const same = !!prev && !added && !removed && next.every(it => prev.get(it.url).already === it.already);
    if (extractNote) { extractNote.textContent = (meta && meta.note) || ''; extractNote.style.display = (meta && meta.note) ? '' : 'none'; }
    if (extractRescanRow) extractRescanRow.style.display = scan ? 'grid' : 'none';
    if (!same) {                                   // an unchanged rescan keeps the grid (and its loaded images) as is
      const top = keep && extractGrid ? extractGrid.scrollTop : 0;
      extractItems = next;
      renderExtractGrid();
      if (keep && extractGrid) extractGrid.scrollTop = top;
    } else retryBroken();                          // …but pictures that failed are asked for again
    // showModal() portals this to document.body, so it renders fine without forcing the main
    // panel open — Extract results behaves like a standalone tool launched from the input menu.
    if (!keep && !extractModal.classList.contains('show')) showModal(extractModal);
    return { total: next.length, added, removed };
  }

  bus('emon-iv-extract-results', (e) => {
    const raw = e?.detail?.urls;
    if (!Array.isArray(raw) || !raw.length) return;
    const clearInput = !!(e && e.detail && e.detail.clearInput);
    requireTerms(() => {
      showExtractPicker(raw, null).then(res => {
        // the pasted text is cleared only once the picker really opened, so a link we can't use never costs a typed message
        if (clearInput && res && res.total > 0) { try { tavo.input.clear(); } catch {} }
      }).catch(err => console.error('[Image Preview] extract picker', err));
    });
  });

  // ---- Scan this chat for images ----
  // Reads (never changes) the open chat's character card(s), persona, lorebooks and messages, runs the same
  // bounded link finder as "Extract images from text" over each piece, and shows what it found in the picker
  // above. It runs only when someone taps the button (or the sidebar entry), never on its own, and it sends
  // nothing anywhere: the only network traffic afterwards is the picker loading the thumbnails you can see.
  //
  // findImageUrls() below is the same finder that entry.js uses (kept identical; a test compares them).
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
      if (i === j && j < n && name === '') i++;
    }
    return null;
  }
  const FIND_MAX_TEXT = 300000;
  const FIND_MAX_URLS = 1000;
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
  function findImageUrls(text) {
    const src = String(text || '').slice(0, FIND_MAX_TEXT);
    const urls = [];
    const seen = new Set();
    const add = (raw) => {
      if (!raw || urls.length >= FIND_MAX_URLS) return;
      let u = raw.trim().replace(/&amp;/g, '&');
      if (u.startsWith('//')) u = 'https:' + u;                       // protocol-relative link, common in copied page source
      if (!u || u.length > 2048 || seen.has(u)) return;
      seen.add(u);
      urls.push(u);
    };
    const lower = src.toLowerCase();
    let pos = 0, nextGt = -2;
    while (urls.length < FIND_MAX_URLS) {
      const i = lower.indexOf('<img', pos);
      if (i === -1) break;
      const c = src.charCodeAt(i + 4);
      if (!(c === 32 || c === 9 || c === 10 || c === 13 || c === 12 || c === 47 || c === 62)) { pos = i + 4; continue; }
      if (nextGt < i + 4) nextGt = src.indexOf('>', i + 4);
      if (nextGt === -1) break;
      if (nextGt - i > 4000) { pos = i + 4; continue; }
      add(imgSrcFromTag(src.slice(i + 4, nextGt)));
      pos = nextGt + 1;
    }
    let m;
    const mdRe = /!\[[^\]]{0,300}\]\(([^)\s]{1,2048})\)/g;
    while ((m = mdRe.exec(src))) add(m[1]);
    // Some hosts keep the file type in the middle of the address (DataCat: ".../ID.webp/<long id>"): that last part belongs to it too.
    // And a shortened copy of an address that is already in the list is never added as a picture of its own.
    const bareRe = /https?:\/\/[^\s"'<>]{1,1500}?\.(?:png|jpe?g|gif|webp|avif|bmp)(?:\/[A-Za-z0-9_-]{16,128})?(?:\?[^\s"'<>]{0,1500})?/gi;
    while ((m = bareRe.exec(src))) {
      const b = trimLinkEnd(m[0]);
      if (urls.some(u => u.length > b.length && u.startsWith(b))) continue;
      add(b);
    }
    return urls;
  }

  const SCAN_MAX_MESSAGES = 5000;        // newest first; older ones are skipped beyond this
  const SCAN_MAX_TEXT_TOTAL = 6000000;   // overall text budget for one scan
  const SCAN_CARD_FIELDS = ['description', 'personality', 'scenario', 'firstMes', 'mesExample', 'creatorNotes', 'systemPrompt', 'postHistoryInstructions'];
  let scanBusy = false;
  let rescanFlashTimer = 0;

  function setScanBusy(on) {
    scanBusy = on;
    if (on) clearTimeout(rescanFlashTimer);
    for (const b of [scanChatBtn, extractRescanBtn]) {
      if (!b) continue;
      b.disabled = on;
      b.textContent = on ? t('runtime.scanning') : t(b === scanChatBtn ? 'runtime.scanChat' : 'runtime.scanRescan');
    }
  }

  // After a rescan the Rescan button briefly says what happened and a toast repeats it, so a tap never
  // looks like nothing happened (even when there is nothing new).
  function reportRescan(text) {
    if (!text) return;
    tavo.utils.toast(text);
    if (!extractRescanBtn) return;
    clearTimeout(rescanFlashTimer);
    extractRescanBtn.textContent = text;
    rescanFlashTimer = setTimeout(() => { if (!scanBusy) extractRescanBtn.textContent = t('runtime.scanRescan'); }, 2800);
  }

  async function scanChatForImages(isRescan = false) {
    if (!termsAgreed()) { requireTerms(() => scanChatForImages(isRescan)); return; }   // the chat is not read before the Terms are agreed to
    if (scanBusy) return;
    const startedAt = Date.now();
    let outcome = '';                                   // what to tell the person after a rescan
    const say = (text) => { if (isRescan) outcome = text; else tavo.utils.toast(text); };
    setScanBusy(true);
    try {
      let chat = null;
      try { chat = await tavo.chat.current(); } catch {}
      if (!chat || chat.id == null) { say(t('runtime.scanNoChat')); return; }

      const found = new Map();                     // url -> group; insertion order is the display order
      const clean = cleanIntroOn(), adHidden = new Map();
      let budget = SCAN_MAX_TEXT_TOTAL, pieces = 0, truncated = false, sinceYield = 0;
      const take = async (group, text) => {
        if (typeof text !== 'string' || !text) return;
        if (budget <= 0) { truncated = true; return; }
        const piece = text.length > FIND_MAX_TEXT ? text.slice(0, FIND_MAX_TEXT) : text;
        budget -= piece.length;
        const pr = clean ? promoImageUrls(piece) : null;     // pictures inside promo links, and one-pixel trackers
        for (const u of findImageUrls(piece)) {
          if (pr && pr.has(u)) { if (!adHidden.has(u)) adHidden.set(u, group); continue; }
          if (!found.has(u) && found.size < FIND_MAX_URLS) found.set(u, group);
        }
        sinceYield += piece.length;
        if (++pieces % 40 === 0 || sinceYield > 120000) { sinceYield = 0; await new Promise(r => setTimeout(r, 0)); }   // let the screen breathe on huge chats
      };

      // 1) character card(s) in this chat
      for (const c of (Array.isArray(chat.characters) ? chat.characters : [])) {
        let ch = null;
        try { ch = c && c.id != null ? await tavo.character.get(c.id) : null; } catch {}
        if (!ch) continue;
        for (const f of SCAN_CARD_FIELDS) await take('card', ch[f]);
        for (const f of ['alternateGreetings', 'groupOnlyGreetings']) if (Array.isArray(ch[f])) for (const g of ch[f].slice(0, 200)) await take('card', g);
      }
      await take('card', chat.overrideScenario);

      // 2) the persona
      if (chat.persona && chat.persona.id != null) {
        try { const per = await tavo.persona.get(chat.persona.id); if (per) await take('card', per.description); } catch {}
      }

      // 3) lorebooks attached to the chat (enabled entries only)
      for (const lb of (Array.isArray(chat.lorebooks) ? chat.lorebooks.slice(0, 20) : [])) {
        let book = null;
        try { book = lb && lb.id != null ? await tavo.lorebook.get(lb.id) : null; } catch {}
        const entries = book && Array.isArray(book.entries) ? book.entries.slice(0, 1000) : [];
        for (const en of entries) if (en && en.enabled !== false) await take('lore', en.content);
      }

      // 4) messages, newest first
      let msgs = [];
      try {
        // Ask Tavo for the newest messages only: a very long chat is not loaded whole just to be cut down afterwards.
        let from = 0;
        try { const total = Number(await tavo.message.count()); if (Number.isFinite(total) && total > SCAN_MAX_MESSAGES) { from = Math.floor(total - SCAN_MAX_MESSAGES); truncated = true; } } catch {}
        const all = await tavo.message.find(from > 0 ? [from] : []);
        if (Array.isArray(all)) msgs = all;
      } catch {}
      let looked = 0;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (looked >= SCAN_MAX_MESSAGES) { truncated = true; break; }
        looked++;
        await take('msgs', msgs[i] && msgs[i].content);
      }

      // The person may have switched chats while this ran: results belong to the chat that was scanned.
      let now = null;
      try { now = await tavo.chat.current(); } catch {}
      if (!now || now.id !== chat.id) { say(t('runtime.scanChatChanged')); return; }

      // Only public, non-tracker links are kept; counts are for what is actually shown.
      const kept = [...found].filter(([u]) => isFetchableUrl(u) && !isAdHost(u));
      const hiddenAds = [...adHidden].filter(([u]) => !found.has(u) && isFetchableUrl(u) && !isAdHost(u));
      extractAds = hiddenAds.map(([u]) => u); extractAdSet = new Set(extractAds);
      if (!kept.length) {
        if (isRescan) await showExtractPicker([], { scan: true, keep: true });   // nothing left: don't leave a stale list up
        say(t('runtime.scanNone'));
        return;
      }
      const noteFor = (arr) => {
        const counts = { card: 0, lore: 0, msgs: 0 };
        for (const [, g] of arr) counts[g]++;
        let n = t('runtime.scanSummary', { total: arr.length, card: counts.card, lore: counts.lore, msgs: counts.msgs });
        if (truncated) n += t('runtime.scanPartial');
        return n;
      };
      extractScan = { kept, hiddenAds, noteFor };
      const shown = extractAdsShown ? kept.concat(hiddenAds) : kept;
      const res = await showExtractPicker(shown.map(([u]) => u), { scan: true, note: noteFor(shown), keep: isRescan });
      if (isRescan) {
        outcome = res.added ? t('runtime.scanNewFound', { n: res.added, total: res.total })
          : res.removed ? t('runtime.scanUpdated', { total: res.total })
          : t('runtime.scanNoNew', { total: res.total });
      }
    } catch (err) {
      console.error('[Image Preview] scan', err);
      say(t('runtime.scanFailed'));
    } finally {
      if (isRescan) { const wait = 500 - (Date.now() - startedAt); if (wait > 0) await sleep(wait); }   // long enough to notice
      setScanBusy(false);
      if (isRescan) reportRescan(outcome);
    }
  }

  if (scanChatBtn) scanChatBtn.onclick = () => scanChatForImages(false);
  if (extractRescanBtn) extractRescanBtn.onclick = () => scanChatForImages(true);
  bus('emon-iv-scan-chat', () => requireTerms(() => scanChatForImages()));
  bus('emon-iv-character-page', () => requireTerms(() => openCharacterPage()));

  // ---- Recycle Bin picker (opened from the chat's right sidebar — see entry.js) ----
  const recycleModal = byId('emon-iv-recycle-modal');
  const recycleGrid = byId('emon-iv-recycle-grid');
  const recycleSubtitle = byId('emon-iv-recycle-subtitle');
  const recycleCloseBtn = byId('emon-iv-recycle-close');
  const recycleSelectAllBtn = byId('emon-iv-recycle-select-all');
  const recycleSelectNoneBtn = byId('emon-iv-recycle-select-none');
  const recycleRestoreBtn = byId('emon-iv-recycle-restore');
  const recycleDeleteBtn = byId('emon-iv-recycle-delete');
  let recycleEntries = [];
  let recycleSelected = new Set();

  function updateRecycleButtons() {
    const n = recycleSelected.size;
    if (recycleRestoreBtn) { recycleRestoreBtn.textContent = t('runtime.recycleRestore').replace('{n}', String(n)); recycleRestoreBtn.disabled = n === 0; }
    if (recycleDeleteBtn) { recycleDeleteBtn.textContent = t('runtime.recycleDeleteForever').replace('{n}', String(n)); recycleDeleteBtn.disabled = n === 0; }
  }

  let recycleBusy = false;

  function renderRecycleGrid() {
    if (!recycleGrid) return;
    recycleSelected.clear();
    if (recycleSubtitle) recycleSubtitle.textContent = t('runtime.recycleSubtitle').replace('{n}', String(recycleEntries.length));
    if (!recycleEntries.length) {
      recycleGrid.innerHTML = `<div class="emon-iv-empty">${esc(t('runtime.recycleEmpty'))}</div>`;
      updateRecycleButtons();
      return;
    }
    const days = recycleRetentionDays();
    recycleGrid.innerHTML = recycleEntries.map((e, i) => {
      const left = Math.max(0, Math.ceil((recycleExpiryAt(e) - Date.now()) / 86400000));
      const leftLabel = left <= 0 ? t('runtime.recycleExpiringSoon') : t('runtime.recycleDaysLeft').replace('{d}', String(left)).replace('{max}', String(days));
      return `<div class="emon-iv-recycle-card" data-i="${i}">
        <button type="button" class="emon-iv-recycle-preview-btn" data-i="${i}" aria-label="${esc(t('runtime.fullscreen'))}">⛶</button>
        <img src="${esc(e.path)}" alt="" loading="lazy" decoding="async">
        <span class="recycle-name">${esc(e.name || t('runtime.image'))}</span>
        <span class="recycle-meta">${esc(e.chatName || t('runtime.unknownChat'))} · ${esc(leftLabel)}</span>
      </div>`;
    }).join('');
    recycleGrid.querySelectorAll('.emon-iv-recycle-card').forEach(card => {
      const i = Number(card.dataset.i);
      card.addEventListener('click', () => {
        const id = recycleEntries[i].id;
        if (recycleSelected.has(id)) recycleSelected.delete(id); else recycleSelected.add(id);
        card.classList.toggle('picked');
        updateRecycleButtons();
      });
    });
    recycleGrid.querySelectorAll('.emon-iv-recycle-preview-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const i = Number(btn.dataset.i);
        try { tavo.utils.preview(recycleEntries[i].path); } catch {}
      });
    });
    updateRecycleButtons();
  }

  async function openRecycleBin() {
    if (!termsAgreed()) { requireTerms(() => openRecycleBin()); return; }   // the bin does not even open before the Terms are agreed to
    await purgeExpiredRecycleBin();
    recycleEntries = getRecycleBin().slice().sort((a,b) => b.deletedAt - a.deletedAt);
    renderRecycleGrid();
    showModal(recycleModal);
  }

  if (recycleSelectAllBtn) recycleSelectAllBtn.onclick = () => {
    recycleSelected = new Set(recycleEntries.map(e => e.id));
    recycleGrid.querySelectorAll('.emon-iv-recycle-card').forEach(c => c.classList.add('picked'));
    updateRecycleButtons();
  };
  if (recycleSelectNoneBtn) recycleSelectNoneBtn.onclick = () => {
    recycleSelected.clear();
    recycleGrid.querySelectorAll('.emon-iv-recycle-card').forEach(c => c.classList.remove('picked'));
    updateRecycleButtons();
  };
  if (recycleRestoreBtn) recycleRestoreBtn.onclick = async () => {
    if (recycleBusy) return;
    const chosen = recycleEntries.filter(e => recycleSelected.has(e.id));
    if (!chosen.length) return;
    recycleBusy = true;
    hideModal(recycleModal);
    try { await restoreRecycleEntries(chosen); } finally { recycleBusy = false; }
  };
  if (recycleDeleteBtn) recycleDeleteBtn.onclick = async () => {
    if (recycleBusy) return;
    const chosen = recycleEntries.filter(e => recycleSelected.has(e.id));
    if (!chosen.length) return;
    recycleBusy = true; recycleRestoreBtn && (recycleRestoreBtn.disabled = true); recycleDeleteBtn.disabled = true;
    try {
      await permanentlyDeleteRecycleEntries(chosen);
      recycleEntries = getRecycleBin().slice().sort((a,b) => b.deletedAt - a.deletedAt);
      renderRecycleGrid();
    } finally { recycleBusy = false; }
  };
  if (recycleCloseBtn) recycleCloseBtn.onclick = () => hideModal(recycleModal);
  bindBackdropClose(recycleModal, () => hideModal(recycleModal));
  bus('emon-iv-open-recycle', () => requireTerms(() => { openRecycleBin(); }));


  // ---- Character page ----
  // The open chat's character card as one scrollable page, like Janitor's intro: picture, text, picture, text… Creator notes,
  // description, personality and scenario are read from the card on this phone and drawn here with their pictures and GIFs in
  // place. Text is only ever turned into plain elements (a short allow-list of tags, bright text colours, safe picture links),
  // never inserted as HTML, so a card can't run anything or load anything private.
  const pageEl = byId('emon-iv-page');
  const pageBody = byId('emon-iv-page-body');
  const pageChars = byId('emon-iv-page-chars');
  const pageCloseBtn = byId('emon-iv-page-close');
  const pageBtn = byId('emon-iv-page-btn');
  // ════════ Clean intro, links and picture loading ════════════════════════════════════════════════════════════
  // Banners and links that only lead somewhere else (invites, support pages, socials, other bot sites, forms) are left out of the
  // "clean" views; any other link becomes a small pill that opens Page view, so nobody has to leave Tavo.
  const PROMO_HOSTS = [
    'discord.gg', 'discord.com', 'discordapp.com', 'discord.me', 'patreon.com', 'ko-fi.com', 'buymeacoffee.com', 'linktr.ee', 'linktree.com',
    'twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'fb.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'twitch.tv', 't.me', 'telegram.me',
    'bsky.app', 'threads.net', 'saucepan.ai', 'harpy.chat', 'janitorai.com', 'jannyai.com', 'chub.ai', 'characterhub.org', 'datacat.run',
    'forms.gle', 'gumroad.com', 'paypal.me', 'onlyfans.com', 'fansly.com'
  ];
  const IMG_EXT_RE = /\.(?:png|jpe?g|gif|webp|avif|bmp)$/i;
  const PG_MAX_LINKS = 40;
  function cleanIntroOn() {
    try { const v = tavo.get('emonImageViewerCleanIntro', 'global'); return !(v === false || v === 0 || v === '0'); } catch { return true; }
  }
  function setCleanIntro(on) { try { tavo.set('emonImageViewerCleanIntro', !!on, 'global'); } catch {} }
  // What a link points at: { kind: 'promo' | 'image' | 'page' | 'none', url }.  'none' = not something that can be opened (mailto:, #top, javascript:, a private address…).
  function linkKind(href) {
    let u = String(href == null ? '' : href).trim().replace(/&amp;/g, '&');
    if (u.startsWith('//')) u = 'https:' + u;
    if (!u || u.length > 2048 || !/^https?:\/\//i.test(u) || !isPublicHttpUrl(u)) return { kind: 'none', url: '' };
    const h = hostOf(u);
    if (isAdHost(u) || PROMO_HOSTS.some(a => h === a || h.endsWith('.' + a))) return { kind: 'promo', url: u };
    if (isBlockedFileType(u)) return { kind: 'none', url: '' };
    let path = ''; try { path = new URL(u).pathname; } catch {}
    return { kind: IMG_EXT_RE.test(path) ? 'image' : 'page', url: u };
  }
  // Scraper sites stamp their own name on what they copy, e.g. "[retrieved by https://datacat.run on 2026-09-16 08:23:32 UTC]".
  const STAMP_WORDS = /(?:retrieved|downloaded|scraped|exported|extracted|archived|fetched)\s+(?:by|from|via|using|with)\s+(?:https?:\/\/|www\.)/i;
  const STAMP_BRACKET_RE = /\[[ \t]*(?:retrieved|downloaded|scraped|exported|extracted|archived|fetched)[ \t]+(?:by|from|via|using|with)[ \t]+(?:https?:\/\/|www\.)[^\]\n<]{0,200}\]/gi;
  const STAMP_LINE_RE = /^[ \t]*(?:<[^>\n]{0,200}>[ \t]*)*(?:retrieved|downloaded|scraped|exported|extracted|archived|fetched)[ \t]+(?:by|from|via|using|with)[ \t]+(?:https?:\/\/|www\.)[^\n<]{0,200}[ \t]*(?:<\/?[a-z][^>\n]{0,100}>[ \t]*)*$/gim;
  function stripStamps(text, ctx) {
    if (typeof text !== 'string' || text.length > 400000 || !STAMP_WORDS.test(text)) return text;
    const hit = () => { if (ctx && ctx.hidden) ctx.hidden.stamps++; return ''; };
    return text.replace(STAMP_BRACKET_RE, hit).replace(STAMP_LINE_RE, hit);
  }
  // Does any <img ...> tag in the text carry a width= or height= ? One pass, each tag looked at once (the old pattern restarted its search
  // to the end of the text from every "<img" and could hang the app on a message made of "<img <img <img ...").
  function imgHasSizeAttr(text) {
    const lower = text.toLowerCase();
    let pos = 0, gt = -2;
    for (;;) {
      const i = lower.indexOf('<img', pos);
      if (i < 0) return false;
      if (gt < i + 4) gt = lower.indexOf('>', i + 4);
      const span = gt < 0 ? lower.slice(i + 4) : lower.slice(i + 4, gt);   // a tag left unfinished at the very end counts too, like the old pattern
      if (/\b(?:width|height)\s*=/.test(span)) return true;
      if (gt < 0) return false;
      pos = gt + 1;
    }
  }
  // Pictures inside a link to a promo site, and one-pixel trackers: the chat scan leaves them out of its list.
  function promoImageUrls(text) {
    const out = new Set();
    if (typeof text !== 'string' || text.length > 300000 || !/<img[\s>]/i.test(text)) return out;
    if (!/<a[\s>]/i.test(text) && !imgHasSizeAttr(text)) return out;
    if (pgTooComplex(text)) return out;
    let doc; try { doc = new DOMParser().parseFromString(text, 'text/html'); } catch { return out; }
    const norm = (raw) => { let u = String(raw || '').trim().replace(/&amp;/g, '&'); if (u.startsWith('//')) u = 'https:' + u; return u; };
    doc.querySelectorAll('img').forEach(im => {
      const u = norm(im.getAttribute('src') || im.getAttribute('data-src')); if (!u) return;
      const a = im.closest('a'), w = parseInt(im.getAttribute('width'), 10), h = parseInt(im.getAttribute('height'), 10);
      if ((w > 0 && w <= 2) || (h > 0 && h <= 2) || (a && linkKind(a.getAttribute('href')).kind === 'promo')) out.add(u);
    });
    return out;
  }

  // ── Grids load their pictures a few at a time, and a picture that fails is asked for again before it is given up on.
  // (A host that is slow, or that answers "too many requests" to 40 pictures asked for at once, must not leave a tile dead for good.)
  const TILE_PARALLEL = 4, TILE_RETRIES = 2, TILE_TIMEOUT_MS = 30000;
  const _tileQ = []; let _tileBusy = 0;
  function tileLoad(img, cb) { img._cb = cb; img._tries = 0; _tileQ.push(img); tilePump(); }
  function tileRetry(img) { img._tries = 0; _tileQ.push(img); tilePump(); }
  function tilePump() {
    while (_tileBusy < TILE_PARALLEL && _tileQ.length) {
      const img = _tileQ.shift();
      if (!img.isConnected || !img.dataset.src) continue;
      _tileBusy++;
      let done = false, timer = 0;
      const end = (ok) => {
        if (done) return; done = true; clearTimeout(timer);
        img.removeEventListener('load', onLoad); img.removeEventListener('error', onErr);
        _tileBusy--;
        if (ok) { try { img._cb && img._cb(true); } catch {} }
        else if (img._tries < TILE_RETRIES && img.isConnected) {
          // a fresh <img> for each new try: a failed one is not reliably asked for again by setting the same address
          const fresh = img.cloneNode(false); fresh.removeAttribute('src'); fresh._cb = img._cb; fresh._tries = img._tries + 1;
          img.replaceWith(fresh);
          setTimeout(() => { if (fresh.isConnected) { _tileQ.push(fresh); tilePump(); } }, 1200 * fresh._tries + Math.random() * 400);
        } else { try { img._cb && img._cb(false); } catch {} }
        tilePump();
      };
      const onLoad = () => end(true), onErr = () => end(false);
      img.addEventListener('load', onLoad); img.addEventListener('error', onErr);
      timer = setTimeout(() => { try { img.removeAttribute('src'); } catch {} end(false); }, TILE_TIMEOUT_MS);
      try { img.referrerPolicy = 'no-referrer'; img.decoding = 'async'; } catch {}
      img.src = img.dataset.src;
    }
  }

  // ── Tavily (an optional second web-search engine, and a way to read pages that need a closer look) ──
  const TAVILY_VAR = 'emonImageViewerTavilyKey', ENGINE_VAR = 'emonImageViewerEngine';
  function getTavilyKey() { try { return String(tavo.get(TAVILY_VAR, 'global') || '').trim(); } catch { return ''; } }
  function getEnginePref() { try { const v = tavo.get(ENGINE_VAR, 'global'); return v === 'tavily' ? 'tavily' : v === 'brave' ? 'brave' : ''; } catch { return ''; } }
  async function tavilyPost(path, body, key, ms) {
    const r = await fetchTimeout('https://api.tavily.com/' + path, {
      method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify(body)
    }, ms || 12000);
    if (!r.ok) throw Object.assign(new Error('tavily http ' + r.status), { status: r.status });
    return r.json();
  }
  async function webViaTavily(text, key) {
    const data = await tavilyPost('search', { query: text, search_depth: 'basic', max_results: 8, include_answer: false, include_images: false, include_raw_content: false }, key, 12000);
    const items = ((data && Array.isArray(data.results)) ? data.results : []).slice(0, 8).map(x => ({
      title: String((x && x.title) || text).slice(0, 160),
      text: stripTagsLinear((x && x.content) || '', '').slice(0, 500),
      url: (x && typeof x.url === 'string') ? x.url : ''
    }));
    if (!items.length) throw new Error('tavily: no results');
    return { items, engine: 'Tavily' };
  }
  // A result that is only another search engine's results page is not worth previewing.
  const SEARCH_HOSTS = ['duckduckgo.com', 'google.com', 'bing.com', 'search.brave.com', 'yahoo.com', 'startpage.com'];
  function isSearchPageUrl(u) {
    try { const x = new URL(u), h = x.hostname.replace(/^www\./, ''); return SEARCH_HOSTS.some(a => h === a || h.endsWith('.' + a)) && /(?:^|[?&])(?:q|p|query)=/.test(x.search); } catch { return false; }
  }

  const PG_MAX_TEXT = 300000, PG_MAX_IMAGES = 100, PG_MAX_NODES = 12000, PG_MAX_DEPTH = 40;
  const PG_SKIP = new Set(['script','style','iframe','object','embed','noscript','template','svg','math','link','meta','base','form','button','input','textarea','select','option','audio','video','source','track','canvas','head','title','frame','frameset','applet','dialog']);
  const PG_BLOCK = { p:'p', div:'div', section:'div', article:'div', center:'div', header:'div', footer:'div', main:'div', aside:'div', nav:'div', figure:'div', figcaption:'div', blockquote:'blockquote', pre:'pre', h1:'h3', h2:'h3', h3:'h4', h4:'h4', h5:'h5', h6:'h5', ul:'ul', ol:'ol', li:'li', table:'div', tbody:'div', thead:'div', tfoot:'div', tr:'div', dl:'div', dd:'div', details:'div' };
  const PG_INLINE = { strong:'strong', b:'strong', em:'em', i:'em', cite:'em', u:'u', s:'s', strike:'s', del:'s', code:'code', kbd:'code', samp:'code', span:'span', font:'span', small:'small', sub:'sub', sup:'sup', mark:'span', a:'span', abbr:'span', q:'span', td:'span', th:'span', dt:'strong', summary:'strong', label:'span' };
  let pageSeq = 0, pageCharId = null;

  // Only bright colours are kept (a very dark one would vanish on the dark page), and only as plain numbers.
  function pgColor(v) {
    const s = String(v || '');
    const mm = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(s);
    const val = (mm ? mm[1] : s).trim();
    let r, g, b, x;
    if ((x = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i.exec(val))) { r = +x[1]; g = +x[2]; b = +x[3]; }
    else if ((x = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(val))) {
      let h = x[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else return '';
    if (![r, g, b].every(n => n >= 0 && n <= 255)) return '';
    return ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) >= 0.4 ? `rgb(${r},${g},${b})` : '';
  }
  function pgMacros(s, names) {
    return String(s)
      .replace(/\{\{\s*char\s*\}\}|<\s*(?:bot|char)\s*>/gi, () => names.char)
      .replace(/\{\{\s*user\s*\}\}|<\s*user\s*>/gi, () => names.user);
  }
  function pgImage(out, raw, ctx) {
    if (ctx.noInline) return;
    let u = String(raw || '').trim().replace(/&amp;/g, '&');
    if (u.startsWith('//')) u = 'https:' + u;
    const isData = /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,[A-Za-z0-9+\/=]+$/i.test(u) && u.length <= PG_MAX_TEXT;   // embedded pictures (not SVG)
    if (!isData) {
      if (!/^https?:\/\//i.test(u) || u.length > 2048) return;
      if (!isFetchableUrl(u) || isAdHost(u)) return;
    }
    if (ctx.images >= PG_MAX_IMAGES) { ctx.moreImages = true; return; }
    ctx.images++; ctx.nodes++;
    const im = document.createElement('img');
    im.className = 'emon-iv-pg-img'; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
    try { im.referrerPolicy = 'no-referrer'; } catch {}
    im.addEventListener('error', () => { im.style.display = 'none'; });
    im.addEventListener('load', () => { const show = () => im.classList.add('ld'); try { if (im.decode) im.decode().then(show, show); else show(); } catch { show(); } });
    im.addEventListener('click', () => { try { tavo.utils.preview(im); } catch {} });
    im.src = u;
    out.appendChild(im);
  }
  // A link in the text: invites, socials and other sites are left out of the clean view; any other page or picture link becomes a pill
  // that opens Page view (so nobody has to leave Tavo). Links are never real links here.
  function pgLink(parent, rawUrl, label, ctx) {
    const lk = linkKind(rawUrl);
    const words = String(label || '').replace(/\s+/g, ' ').trim();
    const shown = words || String(rawUrl);
    if (ctx.linksAsText || lk.kind === 'none') { parent.appendChild(document.createTextNode(shown)); return; }
    if (lk.kind === 'promo') { if (ctx.clean) { ctx.hidden.links++; return; } parent.appendChild(document.createTextNode(shown)); return; }
    if (ctx.links >= PG_MAX_LINKS) { parent.appendChild(document.createTextNode(shown)); return; }
    pgLinkChip(parent, lk, words, ctx);
  }
  function pgLinkChip(parent, lk, label, ctx) {
    ctx.links++; ctx.nodes += 3;
    const host = hostOf(lk.url).replace(/^www\./, '');
    const chip = document.createElement('span');
    chip.className = 'emon-iv-pg-link'; chip.setAttribute('role', 'button'); chip.tabIndex = 0; chip.title = host;
    const ic = document.createElement('i'); ic.textContent = lk.kind === 'image' ? '🖼️' : '🌐';
    const tx = document.createElement('b'); tx.textContent = (label || host).slice(0, 70);
    chip.append(ic, tx);
    if (label && label.toLowerCase() !== host) { const hs = document.createElement('small'); hs.textContent = host; chip.append(hs); }
    const go = () => openWebPreview(lk.url, { back: { scroll: pageBody ? pageBody.scrollTop : 0 } });
    chip.addEventListener('click', go);
    chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    parent.appendChild(chip);
  }
  // **bold**, *italic*, `code`, ![](picture), [text](link) and bare links inside plain text
  function pgInline(parent, text, ctx) {
    const re = /!\[[^\]\n]{0,200}\]\(\s*((?:https?:)?\/\/[^\s)]{1,2048}|data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]{1,300000})(?:\s+"[^"\n]*")?\s*\)|(?<!!)\[([^\]\n]{1,200})\]\(\s*((?:https?:)?\/\/[^\s)]{1,2048})(?:\s+"[^"\n]*")?\s*\)|\*\*([^*\n]+?)\*\*|(?<![*\w])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![*\w])|`([^`\n]{1,300})`|(https?:\/\/[^\s<>"'\])]{4,2000})/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[1]) pgImage(parent, m[1], ctx);
      else if (m[3]) pgLink(parent, m[3], m[2], ctx);
      else if (m[7]) {
        const full = m[7], bare = full.replace(/[.,;:!?'"]+$/, '');
        pgLink(parent, bare, '', ctx);
        if (bare.length < full.length) parent.appendChild(document.createTextNode(full.slice(bare.length)));
      } else { const e = document.createElement(m[4] ? 'strong' : m[5] ? 'em' : 'code'); e.textContent = m[4] || m[5] || m[6]; parent.appendChild(e); ctx.nodes++; }
      last = re.lastIndex;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }
  // A few harmless look-alike properties are carried over (centering, size, bold, italic, underline, a generic font family). Each is rebuilt
  // from a number or a fixed word: nothing the card wrote is ever copied into the page as it is.
  const PG_STYLE_KEYS = new Set(['text-align', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'font-family']);
  const PG_SIZE_KW = { 'xx-small': .7, 'x-small': .8, small: .9, medium: 1, large: 1.2, 'x-large': 1.45, 'xx-large': 1.8, 'xxx-large': 2.1 };
  function pgStyleMap(str) {
    const o = {}; str = String(str || '');
    if (!str || str.length > 3000) return o;
    for (const part of str.split(';')) {
      const i = part.indexOf(':'); if (i < 1) continue;
      const k = part.slice(0, i).trim().toLowerCase();
      if (PG_STYLE_KEYS.has(k)) o[k] = part.slice(i + 1).trim().toLowerCase();
    }
    return o;
  }
  function pgFormat(el, n, tag, isBlock, cur) {
    const st = pgStyleMap(n.getAttribute('style'));
    let al = st['text-align'] || String(n.getAttribute('align') || '').trim().toLowerCase();
    if (tag === 'center') al = 'center';
    if (isBlock && (al === 'center' || al === 'right')) el.style.textAlign = al;
    let abs = null;
    if (tag === 'font' && n.getAttribute('size')) abs = ({ 1: .75, 2: .88, 3: 1, 4: 1.2, 5: 1.5, 6: 1.9, 7: 2.2 })[parseInt(n.getAttribute('size'), 10)] || null;
    const fs = st['font-size'];
    if (fs) {
      const m = fs.length <= 24 ? /^(\d+(?:\.\d+)?|\.\d+)\s*(px|pt|em|rem|%)$/.exec(fs) : null;   // short on purpose: a long run of digits made the old pattern crawl
      if (m) { const v = parseFloat(m[1]); abs = m[2] === 'px' ? v / 16 : m[2] === 'pt' ? v / 12 : m[2] === '%' ? cur * v / 100 : m[2] === 'em' ? cur * v : v; }
      else if (fs === 'smaller') abs = cur * .85; else if (fs === 'larger') abs = cur * 1.2; else if (fs in PG_SIZE_KW) abs = PG_SIZE_KW[fs];
    }
    let next = cur;
    if (abs != null && isFinite(abs)) {
      abs = Math.min(2.2, Math.max(0.75, abs));
      if (Math.abs(abs - cur) > 0.03) { el.style.fontSize = (abs / cur).toFixed(3) + 'em'; next = abs; }
    }
    const fw = st['font-weight'];
    if (fw && /^(?:bold|bolder|[6-9]00)$/.test(fw) && !/^(?:strong|h\d)$/.test(el.tagName.toLowerCase())) el.style.fontWeight = '700';
    const fst = st['font-style']; if (fst === 'italic' || fst === 'oblique') el.style.fontStyle = 'italic';
    const td = st['text-decoration'] || st['text-decoration-line'] || '';
    if (/underline/.test(td)) el.style.textDecoration = /line-through/.test(td) ? 'underline line-through' : 'underline'; else if (/line-through/.test(td)) el.style.textDecoration = 'line-through';
    const ff = st['font-family'];
    if (ff) { if (/\bmonospace\b/.test(ff)) el.style.fontFamily = 'monospace'; else if (/\bcursive\b/.test(ff)) el.style.fontFamily = 'cursive'; else if (/\bsans-serif\b/.test(ff)) el.style.fontFamily = 'sans-serif'; }
    return next;
  }
  // A card made of tens of thousands of tags, or tags nested hundreds deep, is not a real card (and can make a parser crawl): it is shown
  // as plain words instead. Tags that close themselves (p, li, td…) are not counted as nesting.
  // One pass over the text that remembers where the next ">" is, so the work stays proportional to the length of the text (the old tag
  // pattern searched on to the end again from every "<" and could hang the app on a card made of "<a <a <a ...").
  function pgTooComplex(s) {
    const SELF = /^(?:br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr|p|li|dd|dt|tr|td|th|option|optgroup|colgroup|rt|rp)$/i;
    const n = s.length;
    const isAl = (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
    const isAn = (c) => isAl(c) || (c >= 48 && c <= 57);
    let depth = 0, tags = 0, pos = 0, gt = -2;
    for (;;) {
      const i = s.indexOf('<', pos);
      if (i < 0) return false;
      let j = i + 1;
      const closing = s.charCodeAt(j) === 47;
      if (closing) j++;
      if (!isAl(s.charCodeAt(j))) { pos = i + 1; continue; }
      let k = j + 1;
      while (k < n && isAn(s.charCodeAt(k))) k++;
      if (gt < k) gt = s.indexOf('>', k);
      if (gt < 0) return false;                                  // no ">" left, so no tag can close any more
      if (++tags > 60000) return true;
      if (closing) { if (depth > 0) depth--; }
      else if (s.charCodeAt(gt - 1) !== 47 && !SELF.test(s.slice(j, k)) && ++depth > 200) return true;
      pos = gt + 1;
    }
  }
  // Cuts every <...> span out of a text in one pass (a pattern like /<[^>]+>/g searches to the end of the text from every "<" when no ">" follows).
  function stripTagsLinear(s, repl) {
    s = String(s == null ? '' : s);
    let out = '', pos = 0, gt = -2;
    for (;;) {
      const i = s.indexOf('<', pos);
      if (i < 0) break;
      if (gt < i) gt = s.indexOf('>', i);
      if (gt < 0) break;
      out += s.slice(pos, i) + repl;
      pos = gt + 1;
    }
    return out + s.slice(pos);
  }
  // A short line that was mostly a promo link ("Join my [Discord](...) and support me on [Patreon](...)!") goes away as a whole,
  // instead of leaving "Join my and support me on !" behind.
  function pgDropPromoLines(text, ctx) {
    if (text.indexOf('//') < 0) return text;
    const MD = /(?<!!)\[([^\]\n]{1,200})\]\(\s*((?:https?:)?\/\/[^\s)]{1,2048})(?:\s+"[^"\n]*")?\s*\)/g, BARE = /https?:\/\/[^\s<>"'\])]{4,2000}/g;
    const out = [];
    for (const line of text.split('\n')) {
      if (line.length > 400 || line.indexOf('//') < 0) { out.push(line); continue; }
      let hit = 0;
      const rest = line.replace(MD, (m, label, url) => linkKind(url).kind === 'promo' ? (hit++, '') : label)
        .replace(BARE, (u) => linkKind(u.replace(/[.,;:!?'"]+$/, '')).kind === 'promo' ? (hit++, '') : u);
      if (hit && rest.replace(/[\s.,;:!?'"()\-–—*_~|♡♥❤✨]+/g, ' ').trim().length <= 80) { ctx.hidden.links += hit; continue; }
      out.push(line);
    }
    return out.join('\n');
  }
  function pgRender(src, names, ctx) {
    if (!ctx.hidden) ctx.hidden = { ads: 0, links: 0, stamps: 0 };
    if (ctx.links == null) ctx.links = 0;
    const raw = String(src || '');
    if (raw.length > PG_MAX_TEXT) ctx.cut = true;
    let text = pgMacros(raw.slice(0, PG_MAX_TEXT), names);
    if (ctx.clean) text = stripStamps(text, ctx);          // scraper stamps like "[retrieved by …]"
    if (pgTooComplex(text)) { text = stripTagsLinear(text, ' '); ctx.cut = true; }
    const isHtml = /<\s*(?:p|div|br|h[1-6]|ul|ol|li|center|blockquote|hr)\b/i.test(text);
    if (ctx.clean && !isHtml) text = pgDropPromoLines(text, ctx);
    if (!isHtml) text = text.replace(/\n[ \t]*(?:\n[ \t]*){2,}/g, '\n\n').trim();   // long runs of blank lines become one gap
    const doc = new DOMParser().parseFromString(text, 'text/html');       // inert: nothing in it runs or loads
    const frag = document.createDocumentFragment();
    const addText = (out, v) => {
      if (isHtml) {
        const s = v.replace(/[\t\r\n ]+/g, ' ');
        if (!s.trim()) { const prev = out.lastChild; if (prev && (prev.nodeType === 3 || (prev.nodeType === 1 && PG_INLINE[prev.tagName.toLowerCase()]))) out.appendChild(document.createTextNode(' ')); return; }
        pgInline(out, out.lastChild ? s : s.replace(/^ /, ''), ctx);
        return;
      }
      // plain / Markdown-style text: keep the line breaks, turn "# Title" and "---" into a heading and a rule
      const lines = v.split('\n');
      lines.forEach((ln, i) => {
        const h = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(ln);
        if (h) { const e = document.createElement(h[1].length <= 2 ? 'h3' : h[1].length === 3 ? 'h4' : 'h5'); pgInline(e, h[2], ctx); out.appendChild(e); ctx.nodes++; return; }
        if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(ln)) { out.appendChild(document.createElement('hr')); ctx.nodes++; return; }
        pgInline(out, i < lines.length - 1 ? ln + '\n' : ln, ctx);
      });
    };
    const walk = (node, out, depth, cur = 1) => {
      for (let n = node.firstChild; n; n = n.nextSibling) {
        if (ctx.nodes > PG_MAX_NODES) { ctx.cut = true; return; }
        if (n.nodeType === 3) { addText(out, n.nodeValue || ''); continue; }
        if (n.nodeType !== 1) continue;
        const tag = n.tagName.toLowerCase();
        if (PG_SKIP.has(tag)) continue;
        if (tag === 'br') { out.appendChild(document.createElement('br')); ctx.nodes++; continue; }
        if (tag === 'hr') { out.appendChild(document.createElement('hr')); ctx.nodes++; continue; }
        if (tag === 'img') {
          if (ctx.clean) { const w = parseInt(n.getAttribute('width'), 10), hh = parseInt(n.getAttribute('height'), 10); if ((w > 0 && w <= 2) || (hh > 0 && hh <= 2)) { ctx.hidden.ads++; continue; } }   // one-pixel trackers
          pgImage(out, n.getAttribute('src') || n.getAttribute('data-src') || '', ctx); continue;
        }
        if (tag === 'a') {
          const lk = linkKind(n.getAttribute('href')), imgs = n.querySelectorAll('img').length;
          if (lk.kind === 'promo' && ctx.clean) { if (imgs) ctx.hidden.ads += imgs; else ctx.hidden.links++; continue; }   // a banner or link that only leads somewhere else
          if (lk.kind === 'page' || lk.kind === 'image') {
            if (imgs) { walk(n, out, depth + 1, cur); if (lk.kind === 'page') pgLink(out, lk.url, '', ctx); }              // a picture that links to a page: keep the picture, add a "look" pill
            else pgLink(out, lk.url, n.textContent || '', ctx);
            continue;
          }
        }
        const blockTag = PG_BLOCK[tag], inlineTag = PG_INLINE[tag];
        if (depth >= PG_MAX_DEPTH || (!blockTag && !inlineTag)) { walk(n, out, depth + 1, cur); continue; }   // unknown or too deep: keep the words, drop the tag
        const el = document.createElement(blockTag || inlineTag); ctx.nodes++;
        const col = pgColor(tag === 'font' ? n.getAttribute('color') : n.getAttribute('style'));
        if (col) el.style.color = col;
        const nextCur = pgFormat(el, n, tag, !!blockTag, cur);
        const hid0 = ctx.hidden.links;
        walk(n, el, depth + 1, nextCur);
        // a short line that was mostly a promo link ("Join my ... and support me on ...!") goes away as a whole instead of leaving its leftover words
        if (blockTag && ctx.clean && ctx.hidden.links > hid0 && !el.querySelector('img,hr') && el.textContent.replace(/[\s.,;:!?'"()\-–—*_~|♡♥❤✨]+/g, ' ').trim().length <= 80) continue;
        // empty paragraphs (cards use runs of them for spacing) would stack into huge gaps: they are left out
        if (blockTag && !el.textContent.trim() && !el.querySelector('img,hr')) continue;
        out.appendChild(el);
      }
    };
    walk(doc.body || doc.documentElement, frag, 0);
    if (!isHtml) {
      frag.normalize();   // neighbouring text pieces become one, so newline runs left by skipped pictures can be squeezed
      // a line break right next to a picture would only add an empty gap (pictures already have their own space)
      for (let n = frag.firstChild; n; ) {
        const next = n.nextSibling;
        if (n.nodeType === 3) {
          const prevImg = !!(n.previousSibling && n.previousSibling.nodeType === 1 && n.previousSibling.tagName === 'IMG');
          const nextImg = !!(next && next.nodeType === 1 && next.tagName === 'IMG');
          let v = n.nodeValue.replace(/\n{3,}/g, '\n\n');
          if (prevImg) v = v.replace(/^[ \t]*\n+/, '');
          if (nextImg) v = v.replace(/\n+[ \t]*$/, '');
          if (!v.trim() && (prevImg || nextImg)) frag.removeChild(n); else if (v !== n.nodeValue) n.nodeValue = v;
        }
        n = next;
      }
    }
    return { frag, plain: !isHtml };
  }
  function pgEmpty(key) { return `<div class="emon-iv-pg-empty">${esc(t(key))}</div>`; }
  function pgChips(list, activeId) {
    pageChars.innerHTML = '';
    if (list.length < 2) return;
    for (const c of list) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = String(c.name || '…').slice(0, 40);
      if (String(c.id) === String(activeId)) b.className = 'on';
      b.onclick = () => openCharacterPage(c.id);
      pageChars.appendChild(b);
    }
  }
  async function openCharacterPage(wantId) {
    if (!termsAgreed()) { requireTerms(() => openCharacterPage(wantId)); return; }
    const seq = ++pageSeq;
    if (panel.classList.contains('open')) setPanelOpen(false);   // the main panel steps aside while the Character page is open
    showModal(pageEl);
    try {
      const chat = await tavo.chat.current();
      if (seq !== pageSeq) return;
      const list = Array.isArray(chat && chat.characters) ? chat.characters.filter(c => c && c.id != null) : [];
      if (!list.length) { pageChars.innerHTML = ''; pageBody.innerHTML = pgEmpty('runtime.pageNoChar'); return; }
      const has = (v) => v != null && list.some(c => String(c.id) === String(v));
      const id = has(wantId) ? wantId : has(pageCharId) ? pageCharId : list[0].id;
      pageCharId = id;
      pgChips(list, id);
      const ch = await tavo.character.get(Number(id));
      if (seq !== pageSeq) return;
      pageBody.innerHTML = '';
      if (!ch) { pageBody.innerHTML = pgEmpty('runtime.pageFail'); return; }
      const names = {
        char: esc(String(ch.nickname || ch.name || '').slice(0, 80)),
        user: esc(String((chat && chat.persona && chat.persona.name) || t('runtime.pageYou')).slice(0, 80)),
      };
      const frag = document.createDocumentFragment();
      const clean = cleanIntroOn();
      const hiddenAll = { ads: 0, links: 0, stamps: 0, creator: 0 };
      const head = document.createElement('div'); head.className = 'emon-iv-pg-head';
      if (safeAvatarSrc(ch.avatar)) { const av = document.createElement('img'); av.alt = ''; av.loading = 'lazy'; av.src = safeAvatarSrc(ch.avatar); av.addEventListener('error', () => { av.style.display = 'none'; }); head.appendChild(av); }
      const meta = document.createElement('div');
      const nm = document.createElement('div'); nm.className = 'emon-iv-pg-name'; nm.textContent = String(ch.name || ''); meta.appendChild(nm);
      const creator = String(ch.creator || '').trim();
      if (creator && clean && /(?:^|\s)(?:https?:)?\/\/|^www\./i.test(creator)) hiddenAll.creator = 1;      // a "creator" that is only a profile link is advertising, not a name
      else if (creator) { const by = document.createElement('div'); by.className = 'emon-iv-pg-by'; by.textContent = t('runtime.pageBy', { name: creator.slice(0, 60) }); meta.appendChild(by); }
      head.appendChild(meta); frag.appendChild(head);
      const bar = document.createElement('div'); frag.appendChild(bar);
      const ctx = { nodes: 0, images: 0, moreImages: false, cut: false, clean, hidden: hiddenAll, links: 0 };
      let any = false;
      for (const [k1, k2, key] of [['creatorNotes', 'creator_notes', 'runtime.pageSecNotes'], ['description', '', 'runtime.pageSecDesc'], ['personality', '', 'runtime.pageSecPers'], ['scenario', '', 'runtime.pageSecScen']]) {
        const val = (typeof ch[k1] === 'string' && ch[k1]) ? ch[k1] : (k2 && typeof ch[k2] === 'string' ? ch[k2] : '');
        if (!val.trim()) continue;
        const sec = document.createElement('div'); sec.className = 'emon-iv-pg-sec';
        const lab = document.createElement('div'); lab.className = 'emon-iv-pg-label'; lab.setAttribute('data-i18n', key); lab.textContent = t(key); sec.appendChild(lab);
        const box = document.createElement('div'); box.className = 'emon-iv-pg-txt';
        const r = pgRender(val, names, ctx); if (r.plain) box.classList.add('plain'); box.appendChild(r.frag);
        sec.appendChild(box); frag.appendChild(sec); any = true;
      }
      if (!any) { const e = document.createElement('div'); e.className = 'emon-iv-pg-empty'; e.setAttribute('data-i18n', 'runtime.pageEmpty'); e.textContent = t('runtime.pageEmpty'); frag.appendChild(e); }
      {
        const hid = hiddenAll.ads + hiddenAll.links + hiddenAll.stamps + hiddenAll.creator;
        const mk = (key, params) => { const sp = document.createElement('span'); if (!params) sp.setAttribute('data-i18n', key); sp.textContent = t(key, params); return sp; };
        const btn = (key, on) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-i18n', key); b.textContent = t(key); b.onclick = () => { setCleanIntro(on); openCharacterPage(pageCharId).catch(() => {}); }; return b; };
        if (!clean) { bar.className = 'emon-iv-pg-clean raw'; bar.append(mk('runtime.pageRawNote'), btn('runtime.pageCleanOn', true)); }
        else if (hid > 0) { bar.className = 'emon-iv-pg-clean'; bar.append(mk('runtime.pageCleanNote', { n: hid }), btn('runtime.pageCleanShow', false)); }
        else bar.remove();
      }
      for (const [flag, key] of [[ctx.moreImages, 'runtime.pageMoreImg'], [ctx.cut, 'runtime.pageCut']]) {
        if (!flag) continue;
        const n = document.createElement('div'); n.className = 'emon-iv-pg-note'; n.setAttribute('data-i18n', key); n.textContent = t(key); frag.appendChild(n);
      }
      pageBody.appendChild(frag);
      pageBody.scrollTop = 0;
    } catch (e) {
      console.error('[Image Preview] character page', e);
      if (seq === pageSeq) pageBody.innerHTML = pgEmpty('runtime.pageFail');
    }
  }
  if (pageBtn) pageBtn.onclick = () => openCharacterPage();
  if (pageCloseBtn) pageCloseBtn.onclick = () => hideModal(pageEl);
  const pageClose2Btn = byId('emon-iv-page-close2');
  if (pageClose2Btn) pageClose2Btn.onclick = () => hideModal(pageEl);
  bindBackdropClose(pageEl, () => hideModal(pageEl));

  // ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
  //  Page view — look at a web page's pictures and words without leaving Tavo.
  //  The page is downloaded as plain data and read by this panel: nothing on it runs, no ad or tracker is ever contacted,
  //  and only public pictures are shown. It never changes the chat or the character card.
  // ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
  const webEl = byId('emon-iv-web');
  const webOpenBtn = byId('emon-iv-web-open');
  const webCloseBtn = byId('emon-iv-web-close');
  const webTitleEl = byId('emon-iv-web-title');
  const webHostEl = byId('emon-iv-web-host');
  const webBadgeEl = byId('emon-iv-web-badge');
  const webChipsEl = byId('emon-iv-web-chips');
  const webUrlInput = byId('emon-iv-web-url');
  const webGoBtn = byId('emon-iv-web-go');
  const webStatusEl = byId('emon-iv-web-status');
  const webBodyEl = byId('emon-iv-web-body');
  const webSaveBtn = byId('emon-iv-web-save');
  const webRefreshBtn = byId('emon-iv-web-refresh');
  const webBrowserBtn = byId('emon-iv-web-browser');
  const WEB_MAX_IMAGES = 80, WEB_MAX_TEXT = 14000, WEB_MAX_BLOCKS = 140, WEB_FILE = 'emon-iv-pages.json', WEB_KEEP = 20, WEB_PAGE_MS = 25000;
  let webSeq = 0, webModel = null, webPicked = new Set(), webSaving = false, webBack = null, webGen = 0, webLastUrl = '';

  function webErr(code) { const e = new Error(code); e.code = code; return e; }
  function webSay(text) { if (webStatusEl) webStatusEl.textContent = text || ''; }
  const webHost = (u) => hostOf(u).replace(/^www\./, '');

  // ---- read the page ----
  // The page itself is downloaded (with a time limit and a size limit), read, and deleted again.
  async function webDownload(url) {
    const peek = await peekCached(url);
    if (peek && peek.kind === 'blocked') throw webErr('blocked');
    if (peek && peek.kind === 'big') throw webErr('big');
    if (peek && peek.kind === 'image') return { image: true };
    const dl = tavo.file.save(`emon-page-${Date.now()}-${Math.floor(Math.random() * 1e6)}.html`, url, { scope: 'chat' });
    let file;
    try { file = await withTimeout(dl, WEB_PAGE_MS); }
    catch (e) { dl.then(late => tavo.file.delete(late, { scope: 'chat' })).catch(() => {}); throw webErr(e && e.code === 'timeout' ? 'timeout' : 'fetch'); }
    try {
      const size = await fileSizeOf(file);
      if (size > PAGE_MAX_BYTES) throw webErr('big');
      const html = await tavo.file.load(file, { encoding: 'utf8' });
      if (!html) throw webErr('fetch');
      return { html: String(html) };
    } finally { await tavo.file.delete(file, { scope: 'chat' }).catch(() => {}); }
  }
  function webImageModel(url) {
    return { url, title: titleFromUrl(url), host: webHost(url), images: [{ url, full: '', alt: '' }], text: '', blocked: 0, via: 'image' };
  }
  // Pictures and words of a downloaded page. Ads, trackers and one-pixel images are counted, never kept.
  function parseWebPage(html, pageUrl) {
    const doc = new DOMParser().parseFromString(String(html).slice(0, 3000000), 'text/html');   // inert: nothing in it runs or loads
    const host = webHost(pageUrl);
    const baseTag = doc.querySelector('base[href]');
    const base = (baseTag && absUrl(pageUrl, baseTag.getAttribute('href'))) || pageUrl;
    const meta = (sel) => { const m = doc.querySelector(sel); return m ? String(m.getAttribute('content') || '').trim() : ''; };
    const title = (meta('meta[property="og:title"]') || (doc.title || '').trim() || meta('meta[name="twitter:title"]') || host).replace(/\s+/g, ' ').slice(0, 140);
    let blocked = doc.querySelectorAll('script[src],iframe,ins,embed,object').length;     // present on the page, never loaded here
    const imgs = [], seen = new Set();
    const add = (raw, o = {}) => {
      if (!raw || imgs.length >= WEB_MAX_IMAGES) return;
      const u = absUrl(base, decodeHtml(String(raw).trim()));
      if (!u || !/^https?:\/\//i.test(u) || u.length > 2048 || !isFetchableUrl(u)) return;
      if (isAdHost(u) || (o.node && inAdContext(o.node)) || (!o.hero && isAdPath(u))) { blocked++; return; }
      const w = parseInt(o.w, 10) || 0, h = parseInt(o.h, 10) || 0;
      if ((w && w <= 2) || (h && h <= 2) || (w && h && isAdSize(w, h))) { blocked++; return; }   // tracking pixels and banner sizes
      if (!o.hero && ((w && w < 80) || (h && h < 80))) return;                                   // icons, bullets, avatars
      const k = u.replace(/#.*$/, '').replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+(?:\?|$))/i, '');
      if (seen.has(k)) return; seen.add(k);
      let full = '';
      if (o.full) { const f = absUrl(base, decodeHtml(String(o.full).trim())); if (f && /^https?:\/\//i.test(f) && isFetchableUrl(f) && !isAdHost(f)) full = f; }
      imgs.push({ url: u, full: (full && full !== u) ? full : '', alt: String(o.alt || '').replace(/\s+/g, ' ').trim().slice(0, 120) });
    };
    ['meta[property="og:image"]', 'meta[property="og:image:secure_url"]', 'meta[name="twitter:image"]', 'meta[itemprop="image"]']
      .forEach(sel => doc.querySelectorAll(sel).forEach(n => add(n.getAttribute('content'), { hero: true })));
    doc.querySelectorAll('img').forEach(node => {
      if (node.closest('nav,footer,[role="navigation"]')) return;
      let raw = node.getAttribute('src') || node.getAttribute('data-src') || node.getAttribute('data-lazy-src') || node.getAttribute('data-original') || '';
      const ss = node.getAttribute('srcset') || node.getAttribute('data-srcset') || '';
      if (ss) { const parts = ss.split(',').map(p => p.trim().split(/\s+/)).filter(p => p[0]); parts.sort((a, b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0)); if (parts[0]) raw = parts[0][0]; }
      const a = node.closest('a'), href = a ? a.getAttribute('href') : '';
      if (a && linkKind(absUrl(base, href)).kind === 'promo') { blocked++; return; }          // a banner that only leads somewhere else
      const full = href && IMG_EXT_RE.test(String(href).split(/[?#]/)[0]) ? href : '';        // a thumbnail that links to its full-size picture
      add(raw, { node, w: node.getAttribute('width'), h: node.getAttribute('height'), alt: node.getAttribute('alt'), full });
    });
    doc.querySelectorAll('a[href]').forEach(a => {
      if (a.querySelector('img') || a.closest('nav,footer')) return;
      const href = a.getAttribute('href') || '';
      if (IMG_EXT_RE.test(href.split(/[?#]/)[0])) add(href, { node: a, alt: a.textContent });
    });
    let bg = 0;
    doc.querySelectorAll('[style*="url("]').forEach(el => {
      if (bg >= 20) return;
      const m = /url\(\s*['"]?([^'")]+)/i.exec(el.getAttribute('style') || ''); if (m) { bg++; add(m[1], { node: el }); }
    });
    // the words: headings and paragraphs of the main part of the page
    const root = doc.querySelector('article, main, [role="main"]') || doc.body || doc.documentElement;
    const NOISE = 'nav,header,footer,aside,form,button,select,[role="navigation"],[role="banner"],[role="complementary"],[aria-hidden="true"]';
    const lines = [], seenT = new Set(); let chars = 0;
    root.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,figcaption,pre').forEach(el => {
      if (chars >= WEB_MAX_TEXT || lines.length >= WEB_MAX_BLOCKS) return;
      if (el.closest(NOISE) || inAdContext(el)) return;
      const tag = el.tagName.toLowerCase();
      let s = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!s || (!/^h[1-4]$/.test(tag) && s.length < 25)) return;
      if (s.length > 2500) s = s.slice(0, 2500) + '…';
      const key = s.slice(0, 120); if (seenT.has(key)) return; seenT.add(key);
      chars += s.length;
      lines.push(tag === 'h1' || tag === 'h2' ? '## ' + s : /^h[34]$/.test(tag) ? '### ' + s : tag === 'li' ? '- ' + s : tag === 'blockquote' ? '> ' + s : s);
    });
    const head = String(html).slice(0, 8000);
    const challenge = /just a moment|attention required|verify you are human|enable javascript and cookies|cf-browser-verification|challenge-platform/i.test(head);
    return { url: pageUrl, title, host, images: imgs, text: lines.join('\n\n').slice(0, WEB_MAX_TEXT), blocked, via: 'page', challenge };
  }
  // Tavily reads the page on its own servers (for pages that only show their pictures with JavaScript); only the link is sent.
  async function webViaTavilyPage(url, key) {
    const data = await tavilyPost('extract', { urls: [url], include_images: true, extract_depth: 'basic', format: 'markdown' }, key, 28000);
    const r = data && Array.isArray(data.results) ? data.results[0] : null;
    if (!r) throw webErr('tavily');
    const imgs = [], seen = new Set();
    const addI = (u) => {
      u = String(u || '').trim();
      if (!u || !/^https?:\/\//i.test(u) || u.length > 2048 || !isFetchableUrl(u) || isAdHost(u) || isAdPath(u) || seen.has(u) || imgs.length >= WEB_MAX_IMAGES) return;
      seen.add(u); imgs.push({ url: u, full: '', alt: '' });
    };
    (Array.isArray(r.images) ? r.images : []).forEach(x => addI(typeof x === 'string' ? x : x && x.url));
    const content = String(r.raw_content || '').slice(0, 200000);
    findImageUrls(content).forEach(addI);
    const text = content.replace(/!\[[^\]]{0,300}\]\([^)]{0,2048}\)/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, WEB_MAX_TEXT);
    const t0 = (/^#{1,2}\s+(.+)$/m.exec(text) || [])[1];
    return { url, title: String(t0 || webHost(url)).slice(0, 140), host: webHost(url), images: imgs, text, blocked: 0, via: 'tavily' };
  }
  async function webFetchModel(url, seq) {
    if (looksLikeImage(url)) return webImageModel(url);
    const tk = getTavilyKey(), canTavily = !!tk && !isPrivacyMode();
    let model = null, failure = null;
    try {
      const dl = await webDownload(url);
      if (seq !== webSeq) return null;
      if (dl.image) return webImageModel(url);
      if (!isHtmlish(dl.html)) { if (await probeImage(url)) return webImageModel(url); throw webErr('notpage'); }
      model = parseWebPage(dl.html, url);
    } catch (e) { failure = e; }
    const empty = !model || (!model.images.length && model.text.length < 300);
    if (empty && canTavily && !(failure && (failure.code === 'blocked' || failure.code === 'big'))) {
      webSay(t('runtime.webTavilyTry'));
      try { const m2 = await webViaTavilyPage(url, tk); if (seq !== webSeq) return null; if (m2 && (m2.images.length || m2.text)) return m2; }
      catch (e) { console.warn('[Image Preview] tavily page', e); }
    }
    if (failure && empty) throw failure;
    if (empty) throw webErr(model && model.challenge ? 'challenge' : 'empty');
    return model;
  }

  // ---- recent pages (kept on this phone, so a page you looked at before opens again without asking the site) ----
  let webPagesCache = null;
  async function webPagesLoad() {
    if (webPagesCache) return webPagesCache;
    let list = [];
    try {
      const raw = await tavo.file.load(WEB_FILE, { scope: 'global' });
      const v = raw ? JSON.parse(raw) : [];
      if (Array.isArray(v)) list = v.filter(p => p && typeof p.u === 'string' && normalizeUrl(p.u)).slice(0, WEB_KEEP);
    } catch {}
    return (webPagesCache = list);
  }
  async function webPagesSave() { try { await tavo.file.save(WEB_FILE, JSON.stringify(webPagesCache || []), { scope: 'global' }); } catch {} }
  async function webRemember(model, saved) {
    const list = await webPagesLoad();
    const i = list.findIndex(p => p.u === model.url);
    const was = i >= 0 ? list[i] : null;
    const entry = {
      u: model.url, t: String(model.title || '').slice(0, 120), at: Date.now(), n: model.images.length, s: !!saved || !!(was && was.s),
      imgs: model.images.slice(0, WEB_MAX_IMAGES).map(x => (x.full ? [x.url, x.full] : x.url)), x: String(model.text || '').slice(0, 1500), via: model.via || ''
    };
    if (i >= 0) list.splice(i, 1);
    list.unshift(entry); if (list.length > WEB_KEEP) list.length = WEB_KEEP;
    await webPagesSave();
  }
  function webFromCache(e) {
    const imgs = (Array.isArray(e.imgs) ? e.imgs : []).map(x => Array.isArray(x) ? { url: String(x[0]), full: String(x[1] || ''), alt: '' } : { url: String(x), full: '', alt: '' })
      .filter(x => /^https?:\/\//i.test(x.url) && isFetchableUrl(x.url) && !isAdHost(x.url)).slice(0, WEB_MAX_IMAGES);
    return { url: e.u, title: String(e.t || webHost(e.u)), host: webHost(e.u), images: imgs, text: String(e.x || ''), blocked: 0, via: e.via || 'page', cached: true };
  }

  // ---- screens ----
  function webSetHero(m) {
    const host = m ? (m.host || webHost(m.url)) : '';
    if (webBadgeEl) { const c = host.replace(/[^a-z0-9]/gi, '').charAt(0); webBadgeEl.textContent = c ? c.toUpperCase() : '🌐'; }
    if (webTitleEl) webTitleEl.textContent = (m && m.title) ? m.title : t('runtime.webTitle');
    if (webHostEl) webHostEl.textContent = host;
    if (webUrlInput && m && m.url) webUrlInput.value = m.url;
    if (webChipsEl) {
      webChipsEl.textContent = '';
      const chip = (cls, text) => { const c = document.createElement('span'); c.className = 'emon-iv-web-chip ' + cls; c.textContent = text; webChipsEl.appendChild(c); };
      if (m && m.blocked > 0) chip('shield', '🛡 ' + t('runtime.webBlocked', { n: m.blocked }));
      if (m && m.via === 'tavily') chip('', '✨ ' + t('runtime.webViaTavily'));
      if (m && m.cached) chip('', '💾 ' + t('runtime.webSavedCopy'));
    }
  }
  function webSetActions() {
    const m = webModel;
    if (webSaveBtn) webSaveBtn.hidden = !(m && m.images.length);
    if (webRefreshBtn) webRefreshBtn.hidden = !m;
    if (webBrowserBtn) webBrowserBtn.hidden = !(m || webLastUrl);
    webSaveUi();
  }
  function webSaveUi() {
    if (!webSaveBtn || !webModel) return;
    const n = webPicked.size;
    webSaveBtn.textContent = webSaving ? t('runtime.webSaving') : n ? t('runtime.webSavePicked', { n }) : t('runtime.webSaveAll', { n: webModel.images.length });
    webSaveBtn.disabled = webSaving;
  }
  function webShowLoading() {
    webBodyEl.textContent = '';
    const grid = document.createElement('div'); grid.className = 'emon-iv-web-grid skeleton';
    for (let i = 0; i < 6; i++) { const s = document.createElement('div'); s.className = 'emon-iv-web-tile sk'; grid.appendChild(s); }
    webBodyEl.appendChild(grid);
    if (webSaveBtn) webSaveBtn.hidden = true; if (webRefreshBtn) webRefreshBtn.hidden = true;
    if (webBrowserBtn) webBrowserBtn.hidden = !webLastUrl;
  }
  function webMessage(icon, text, extra) {
    webBodyEl.textContent = '';
    const box = document.createElement('div'); box.className = 'emon-iv-web-empty';
    const i = document.createElement('div'); i.className = 'ic'; i.textContent = icon; box.appendChild(i);
    const p = document.createElement('div'); p.className = 'tx'; p.textContent = text; box.appendChild(p);
    if (extra) { const s = document.createElement('div'); s.className = 'sub'; s.textContent = extra; box.appendChild(s); }
    webBodyEl.appendChild(box);
    return box;
  }
  function webRenderError(url, e) {
    const code = (e && e.code) || 'fetch';
    const known = { blocked: 1, big: 1, timeout: 1, fetch: 1, notpage: 1, challenge: 1, empty: 1 };
    const key = known[code] ? 'runtime.webErr_' + code : 'runtime.webErr_fetch';
    webSay('');
    const tip = (code === 'empty' || code === 'challenge' || code === 'fetch') && !getTavilyKey() ? t('runtime.webErrTip') : '';
    const box = webMessage(code === 'challenge' ? '🛡️' : '🫥', t(key), tip);
    const row = document.createElement('div'); row.className = 'emon-iv-web-erract';
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'emon-iv-btn'; retry.textContent = t('runtime.webRetry');
    retry.onclick = () => webLoad(url, true);
    row.appendChild(retry); box.appendChild(row);
    webModel = null; webLastUrl = url; webSetActions();
  }
  function webRender(model) {
    webSetHero(model); webSay('');
    webBodyEl.textContent = '';
    const gen = ++webGen, loads = [];
    const frag = document.createDocumentFragment();
    if (model.images.length) {
      const grid = document.createElement('div'); grid.className = 'emon-iv-web-grid';
      model.images.forEach((x, i) => {
        const tile = document.createElement('div'); tile.className = 'emon-iv-web-tile'; tile.dataset.i = String(i); tile.style.setProperty('--d', Math.min(i, 10) * 35 + 'ms');
        const img = document.createElement('img'); img.alt = x.alt || ''; img.dataset.src = x.url; tile.appendChild(img);
        if (/\.gif(?:[?#]|$)/i.test(x.full || x.url)) { const g = document.createElement('span'); g.className = 'gif'; g.textContent = 'GIF'; tile.appendChild(g); }
        const sv = document.createElement('span'); sv.className = 'tag'; sv.textContent = t('runtime.tileSaved'); tile.appendChild(sv);
        const pick = document.createElement('button'); pick.type = 'button'; pick.className = 'pick'; pick.textContent = '✓'; tile.appendChild(pick);
        grid.appendChild(tile);
        loads.push([img, tile]);
      });
      frag.appendChild(grid);
      savedSourceSet().then(set => { if (gen !== webGen) return; grid.querySelectorAll('.emon-iv-web-tile').forEach(tl => { const x = model.images[Number(tl.dataset.i)]; if (x && set.has(srcKey(x.full || x.url))) tl.classList.add('saved'); }); }).catch(() => {});
    } else {
      const n = document.createElement('div'); n.className = 'emon-iv-pg-note'; n.textContent = t('runtime.webNoPictures'); frag.appendChild(n);
    }
    if (model.text) {
      const sec = document.createElement('div'); sec.className = 'emon-iv-pg-sec emon-iv-web-read';
      const lab = document.createElement('div'); lab.className = 'emon-iv-pg-label'; lab.textContent = t('runtime.webText'); sec.appendChild(lab);
      const box = document.createElement('div'); box.className = 'emon-iv-pg-txt';
      const ctx = { nodes: 0, images: 0, moreImages: false, cut: false, clean: true, hidden: { ads: 0, links: 0, stamps: 0 }, links: 0, noInline: true, linksAsText: true };
      const esc4 = model.text.replace(/&/g, '&amp;').replace(/</g, '&lt;');          // page words are shown as words, never as markup
      const r = pgRender(esc4, { char: '{{char}}', user: '{{user}}' }, ctx); if (r.plain) box.classList.add('plain'); box.appendChild(r.frag);
      sec.appendChild(box); frag.appendChild(sec);
    }
    webBodyEl.appendChild(frag); webBodyEl.scrollTop = 0;
    loads.forEach(([img, tile]) => tileLoad(img, ok => { if (gen !== webGen) return; tile.classList.toggle('ok', ok); tile.classList.toggle('bad', !ok); }));   // after the tiles are on screen
    webSetActions();
  }
  async function webLanding(msg) {
    webSeq++; webModel = null; webPicked.clear(); webLastUrl = '';
    webSetHero(null); webSay(msg || '');
    if (!msg && webUrlInput) webUrlInput.value = '';
    webBodyEl.textContent = '';
    const box = document.createElement('div');
    const hello = document.createElement('div'); hello.className = 'emon-iv-web-hello';
    const ic = document.createElement('div'); ic.className = 'ic'; ic.textContent = '🌐'; hello.appendChild(ic);
    const h = document.createElement('div'); h.className = 'tx'; h.textContent = t('runtime.webHelloTitle'); hello.appendChild(h);
    const p = document.createElement('div'); p.className = 'sub'; p.textContent = t('runtime.webHelloText'); hello.appendChild(p);
    box.appendChild(hello);
    const list = await webPagesLoad();
    if (list.length) {
      const lab = document.createElement('div'); lab.className = 'emon-iv-pg-label'; lab.textContent = t('runtime.webRecent'); box.appendChild(lab);
      list.forEach(e => {
        const row = document.createElement('div'); row.className = 'emon-iv-web-row'; row.setAttribute('role', 'button'); row.tabIndex = 0;
        const dot = document.createElement('div'); dot.className = 'dot'; dot.textContent = (webHost(e.u).charAt(0) || '🌐').toUpperCase(); row.appendChild(dot);
        const tx = document.createElement('div'); tx.className = 'mid';
        const t1 = document.createElement('b'); t1.textContent = e.t || webHost(e.u); tx.appendChild(t1);
        const t2 = document.createElement('small'); t2.textContent = webHost(e.u) + ' · ' + t('runtime.webPictures', { n: e.n || 0 }) + (e.s ? ' · 💾 ' + t('runtime.webSavedTag') : ''); tx.appendChild(t2);
        row.appendChild(tx);
        const x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = '✕'; x.title = t('runtime.webForget');
        x.onclick = async (ev) => { ev.stopPropagation(); const l = await webPagesLoad(); const k = l.findIndex(q => q.u === e.u); if (k >= 0) { l.splice(k, 1); await webPagesSave(); } row.remove(); };
        row.appendChild(x);
        const go = () => openWebPreview(e.u);
        row.addEventListener('click', go); row.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); });
        box.appendChild(row);
      });
    }
    webBodyEl.appendChild(box);
    webSetActions();
  }
  async function webLoad(url, refresh) {
    const seq = ++webSeq;
    webModel = null; webPicked.clear(); webLastUrl = url;
    webSetHero({ url, title: '', host: webHost(url) });
    webShowLoading(); webSay(t('runtime.webReading'));
    try {
      let model = null;
      if (!refresh) { const e = (await webPagesLoad()).find(p => p.u === url); if (e && Array.isArray(e.imgs) && e.imgs.length) model = webFromCache(e); }
      if (!model) model = await webFetchModel(url, seq);
      if (seq !== webSeq || !model) return;
      webModel = model; webRender(model);
      if (!model.cached) webRemember(model, false);
    } catch (e) {
      if (seq !== webSeq) return;
      console.warn('[Image Preview] page view', e && e.code, e);
      webRenderError(url, e);
    }
  }
  // Open Page view on a link (or, with no link, on the recent-pages screen). Never leaves Tavo.
  function openWebPreview(rawUrl, opts) {
    if (!webEl) return;
    if (!termsAgreed()) { requireTerms(() => openWebPreview(rawUrl, opts)); return; }
    if (opts && opts.back) webBack = opts.back;
    showModal(webEl);
    const text = String(rawUrl || '').trim();
    if (!text) { webLanding(); return; }
    const url = normalizeUrl(text);
    if (!url) { webLanding(t('runtime.webBadLink')); return; }
    webLoad(url, !!(opts && opts.refresh));
  }
  function webClose() {
    webSeq++; webGen++;
    const back = webBack; webBack = null;
    hideModal(webEl);
    if (back) { openCharacterPage(pageCharId).then(() => { try { pageBody.scrollTop = back.scroll || 0; } catch {} }).catch(() => {}); }
  }
  async function webSavePictures() {
    if (webSaving || !webModel) return;
    const idxs = webPicked.size ? [...webPicked].sort((a, b) => a - b) : webModel.images.map((_, i) => i);
    const list = idxs.map(i => webModel.images[i]).filter(Boolean).map(x => x.full || x.url);
    if (!list.length) return;
    webSaving = true; webSaveUi();
    try {
      let saved = 0, skipped = 0, failed = 0, n = 0;
      prefetchPeeks(list);
      for (const u of list) {
        webSay(t('runtime.savingProgress', { i: ++n, n: list.length }));
        try {
          if (await findExistingBySource(u, true)) { skipped++; continue; }
          await persistRemote(u, 'emon-preview', true); saved++;
        } catch (e) { failed++; console.warn('[Image Preview] page save failed', e); }
      }
      await loadSavedPreviews();
      const msg = extractResultText(saved, skipped, failed);
      webSay(msg || '');
      if (msg) tavo.utils.toast(msg);
      if (webModel) { webRemember(webModel, saved > 0 || skipped > 0); savedSourceSet().then(set => webBodyEl.querySelectorAll('.emon-iv-web-tile').forEach(tl => { const x = webModel && webModel.images[Number(tl.dataset.i)]; if (x && set.has(srcKey(x.full || x.url))) tl.classList.add('saved'); })).catch(() => {}); }
    } finally { webSaving = false; webSaveUi(); }
  }
  if (webBodyEl) webBodyEl.addEventListener('click', (e) => {
    const tile = e.target.closest && e.target.closest('.emon-iv-web-tile');
    if (!tile || !webModel) return;
    const i = Number(tile.dataset.i), x = webModel.images[i]; if (!x) return;
    if (e.target.closest('.pick')) {
      if (webPicked.has(i)) webPicked.delete(i); else webPicked.add(i);
      tile.classList.toggle('picked', webPicked.has(i)); webSaveUi(); return;
    }
    if (tile.classList.contains('bad')) { tile.classList.remove('bad'); const im = tile.querySelector('img'); if (im) tileRetry(im); return; }
    try { x.full ? tavo.utils.preview(x.full) : tavo.utils.preview(tile.querySelector('img') || x.url); } catch {}
  });
  if (webGoBtn) webGoBtn.onclick = () => openWebPreview(webUrlInput ? webUrlInput.value : '');
  if (webUrlInput) webUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); openWebPreview(webUrlInput.value); } });
  if (webCloseBtn) webCloseBtn.onclick = webClose;
  const webClose2Btn = byId('emon-iv-web-close2');
  if (webClose2Btn) webClose2Btn.onclick = webClose;
  bindBackdropClose(webEl, webClose);
  if (webSaveBtn) webSaveBtn.onclick = webSavePictures;
  if (webRefreshBtn) webRefreshBtn.onclick = () => { if (webModel) webLoad(webModel.url, true); };
  if (webBrowserBtn) webBrowserBtn.onclick = () => openSafe(webModel ? webModel.url : (webLastUrl || (webUrlInput ? webUrlInput.value : '')));
  if (webOpenBtn) webOpenBtn.onclick = () => { const v = urlEl ? urlEl.value.trim() : ''; openWebPreview(v); };
  bus('emon-iv-web-open', (e) => openWebPreview((e && e.detail && e.detail.url) || ''));


  const sheetEl = byId('emon-iv-sheet');
  const sheetThumb = byId('emon-iv-sheet-thumb');
  const sheetClose = byId('emon-iv-sheet-close');
  const sheetSubtitle = byId('emon-iv-sheet-subtitle');
  let sheetFile = null;
  function openCardSheet(f) {
    if (!sheetEl) return;
    sheetFile = f;
    sheetThumb.src = f.path;
    if (sheetSubtitle) sheetSubtitle.textContent = getSavedDisplayName(f);
    const askEl = byId('emon-iv-sheet-delete-ask'), btnEl = byId('emon-iv-sheet-delete-btn');
    if (askEl) askEl.style.display = 'none';
    if (btnEl) btnEl.style.display = '';
    showModal(sheetEl);
    // The thumbnail can still be loading (a local file read) when the sheet opens. overflow-anchor:none stops
    // the browser from auto-scrolling to compensate once it lands, but as a safety net, also re-pin to the top
    // when the load actually finishes, in case anything else nudges the scroll position in the meantime.
    const sheetCard = sheetEl.querySelector('.emon-iv-modal-card');
    sheetThumb.onload = sheetThumb.onerror = () => { if (sheetCard && sheetEl.classList.contains('show')) sheetCard.scrollTop = 0; };
  }
  function closeCardSheet() { hideModal(sheetEl); sheetFile = null; }
  if (sheetClose) sheetClose.onclick = closeCardSheet;
  bindBackdropClose(sheetEl, closeCardSheet);
  if (sheetEl) sheetEl.addEventListener('click', async e => {
    const b = e.target.closest('[data-sheet]'); if (!b || !sheetFile) return;
    const act = b.getAttribute('data-sheet'); const f = sheetFile;
    if (act === 'view') { tavo.utils.preview(f.path); closeCardSheet(); }
    else if (act === 'pin') { pinPreview({src: f.path, original: f.path, title: getSavedDisplayName(f)}); closeCardSheet(); }
    else if (act === 'device') { await saveToDevice({src: f.path}); }
    else if (act === 'copy') { await copyPreviewLink({src: f.path, original: getSourceMap()[f.path] || f.path}); }
    else if (act === 'rename') { closeCardSheet(); openSavedRenameModal(f); }
    else if (act === 'info') { closeCardSheet(); showImageInfo({src: f.path, original: f.path, title: getSavedDisplayName(f)}, null); }
    else if (act === 'delete') {
      byId('emon-iv-sheet-delete-btn').style.display = 'none';
      byId('emon-iv-sheet-delete-ask').style.display = '';
    }
    else if (act === 'delete-cancel') {
      byId('emon-iv-sheet-delete-ask').style.display = 'none';
      byId('emon-iv-sheet-delete-btn').style.display = '';
    }
    else if (act === 'delete-yes') { closeCardSheet(); await deleteSavedFile(f.path, true); }
  });

  let savedLoadSeq = 0;
  // The shelf draws 200 saved previews at a time; "Show more" adds the next batch, so nothing is out of reach.
  const SAVED_PAGE = 200;
  let savedShown = SAVED_PAGE;
  function makeSavedCard(f) {
    const card=document.createElement('button'); card.type='button'; card.className='emon-iv-card emon-iv-saved-card';
    const displayName = getSavedDisplayName(f);
    card.innerHTML=`<img src="${esc(f.path)}" alt="" loading="lazy" decoding="async"><span class="saved-name">${esc(displayName)}</span>`;
    if (savedSelectMode && savedSelectedPaths.has(f.path)) card.classList.add('picked');
    card.onclick=()=>{
      if (savedSelectMode) { toggleSavedSelect(f.path, card); return; }
      openCardSheet(f);
    };
    return card;
  }
  function renderSavedCards(files) {
    savedEl.querySelectorAll('.emon-iv-saved-more').forEach(n => n.remove());
    const have = savedEl.querySelectorAll('.emon-iv-saved-card').length;
    const upto = Math.min(files.length, savedShown);
    const frag = document.createDocumentFragment();
    for (let i = have; i < upto; i++) frag.appendChild(makeSavedCard(files[i]));
    savedEl.appendChild(frag);
    if (files.length > upto) {
      const more = document.createElement('button'); more.type = 'button'; more.className = 'emon-iv-card emon-iv-saved-more';
      more.textContent = t('runtime.savedMore', { n: files.length - upto });
      more.onclick = () => { savedShown += SAVED_PAGE; renderSavedCards(savedFilesCache); updateSavedSelectBar(); };
      savedEl.appendChild(more);
    }
  }

  async function loadSavedPreviews() {
    const seq = ++savedLoadSeq;
    try{
      const files = await listChatFilesMatching(f => SAVED_RE.test(f.name) && /^image\//i.test(f.mimeType || ''));
      if(seq !== savedLoadSeq) return; // a newer refresh superseded this one
      savedEl.innerHTML='';
      files.sort((a,b) => {
        const am = Date.parse(a.modifiedAt || '') || 0, bm = Date.parse(b.modifiedAt || '') || 0;
        return bm - am || String(b.name || '').localeCompare(String(a.name || ''));
      });
      savedFilesCache = files;
      syncSavedEmptyState(files.length > 0);
      if(!files.length){savedEl.innerHTML=`<div class="emon-iv-empty">${esc(t('runtime.noSaved'))}</div>`;updateSavedSelectBar();return;}
      renderSavedCards(files);
      updateSavedSelectBar();
    }catch(e){console.error('[Image Preview] saved list',e);savedEl.innerHTML=`<div class="emon-iv-empty">${esc(t('runtime.error'))}</div>`;}
  }

  // Select and Clear all only make sense when there is something to act on.
  function syncSavedEmptyState(hasFiles) {
    if (savedSelectToggleBtn) savedSelectToggleBtn.disabled = !hasFiles;
    if (clearSavedBtn) clearSavedBtn.disabled = !hasFiles;
    if (!hasFiles && savedSelectMode) setSavedSelectMode(false);
  }

  function toggleSavedSelect(path, cardEl) {
    if (savedSelectedPaths.has(path)) savedSelectedPaths.delete(path); else savedSelectedPaths.add(path);
    cardEl.classList.toggle('picked');
    updateSavedSelectBar();
  }

  function updateSavedSelectBar() {
    const n = savedSelectedPaths.size;
    if (savedPinSelectedBtn) {
      savedPinSelectedBtn.textContent = t('runtime.pinSavedSelected').replace('{n}', String(n));
      savedPinSelectedBtn.disabled = n === 0 || savedActionBusy;
    }
    if (savedDeleteSelectedBtn) {
      savedDeleteSelectedBtn.textContent = t('runtime.deleteSavedSelected').replace('{n}', String(n));
      savedDeleteSelectedBtn.disabled = n === 0 || savedActionBusy;
    }
  }

  function setSavedSelectMode(on) {
    savedSelectMode = on;
    savedSelectedPaths.clear();
    if (savedSelectToggleBtn) savedSelectToggleBtn.textContent = t(on ? 'runtime.doneSelect' : 'runtime.selectMode');
    if (savedSelectActions) savedSelectActions.style.display = on ? '' : 'none';
    if (savedSelectCancelRow) savedSelectCancelRow.style.display = on ? '' : 'none';
    savedEl.querySelectorAll('.emon-iv-saved-card.picked').forEach(c => c.classList.remove('picked'));
    updateSavedSelectBar();
  }

  if (savedSelectToggleBtn) savedSelectToggleBtn.onclick = () => { if (!savedSelectMode && !savedFilesCache.length) return; setSavedSelectMode(!savedSelectMode); };
  if (savedSelectCancelBtn) savedSelectCancelBtn.onclick = () => setSavedSelectMode(false);
  if (savedPinSelectedBtn) savedPinSelectedBtn.onclick = async () => {
    if (savedActionBusy) return;
    const chosen = savedFilesCache.filter(f => savedSelectedPaths.has(f.path));
    if (!chosen.length) return;
    savedActionBusy = true; updateSavedSelectBar();
    try {
      let i = 0;
      const before = pins.length;
      for (const f of chosen) {
        if (pins.length >= MAX_PINS) break;
        await pinPreview({ src: f.path, original: f.path, title: getSavedDisplayName(f) }, i++, false);
      }
      const added = pins.length - before;
      setSavedSelectMode(false);
      if (added < chosen.length && pins.length >= MAX_PINS) tavo.utils.toast(t('runtime.pinLimitSome', { done: added, total: chosen.length, n: MAX_PINS }));
      else tavo.utils.toast(t('runtime.pinnedFromSaved').replace('{n}', String(added)));
    } finally { savedActionBusy = false; }
  };
  if (savedDeleteSelectedBtn) savedDeleteSelectedBtn.onclick = async () => {
    if (savedActionBusy) return;
    const chosen = savedFilesCache.filter(f => savedSelectedPaths.has(f.path));
    if (!chosen.length) return;
    const ok = typeof confirm === 'function' ? confirm(t('runtime.confirmDeleteSelected').replace('{n}', String(chosen.length))) : true;
    if (!ok) return;
    savedActionBusy = true; updateSavedSelectBar();
    try {
      const paths = new Set(chosen.map(f => f.path));
      const okPaths = new Set();
      for (const f of chosen) { if (await moveToRecycleBin(f)) okPaths.add(f.path); }
      pins.filter(p => okPaths.has(p.src) || okPaths.has(String(p.src).replace(/^files\/chat\//,''))).forEach(p => removePin(p.id, false));
      savePins(); renderPinsList();
      setSavedSelectMode(false);
      await loadSavedPreviews();
      tavo.utils.toast(t('runtime.deletedSelectedToBin').replace('{n}', String(chosen.length)));
    } finally { savedActionBusy = false; }
  };

  // A restored pin must never come back somewhere it can't be grabbed (under the top bar, or off the side after a
  // different screen size): its corner is brought back into the visible, tappable area.
  function keepPinReachable(p){
    const ins=safeInsets();
    const x=Number(p.x), y=Number(p.y), w=Number(p.width)||Number(cfg().defaultImageSize||220);
    const dp=defaultPinPos(w);
    p.x=Number.isFinite(x)?Math.max(72-w,Math.min(innerWidth-72,x)):dp.x;
    p.y=Number.isFinite(y)?Math.max(ins.top,Math.min(innerHeight-ins.bottom-72,y)):dp.y;
  }
  // Pin toolbars are built when a pin is created, so their button labels are refreshed in place when the language changes.
  function relabelPins(){
    const L={minus:'runtime.zoomOut',plus:'runtime.zoomIn',reset:'runtime.reset',rotate:'runtime.rotateBtn',flip:'runtime.flipBtn',full:'runtime.fullscreen',remove:'runtime.remove'};
    document.querySelectorAll('.emon-iv-pinned').forEach(el=>{
      const p=pins.find(x=>String(x.id)===String(el.getAttribute('data-emon-pin')));
      for(const act in L){ const b=el.querySelector('[data-act="'+act+'"]'); if(b) b.setAttribute('aria-label',t(L[act])); }
      const tg=el.querySelector('[data-act="barToggle"]');
      if(tg){ const k=(p&&p.barCollapsed===false)?'runtime.pinBarHide':'runtime.pinBarShow'; tg.title=t(k); tg.setAttribute('aria-label',t(k)); }
    });
  }
  function restorePins() {
    // pins already on screen belong to a previous copy of this panel (chat switch, plugin reload): drop them first
    document.querySelectorAll('[data-emon-pin]').forEach(n=>n.remove());
    pins=[]; pinsOverflow=[];
    if(cfg().rememberPins){
      try{
        const raw=tavo.get('emonImageViewerPins','chat');
        if(Array.isArray(raw)){
          const all=raw.filter(x=>x&&typeof x==='object'&&typeof x.src==='string'&&x.src)
                  .map(x=>({...x,id:++pinSeq,barCollapsed:typeof x.barCollapsed==='boolean'?x.barCollapsed:true}));
          pins=all.slice(0,MAX_PINS);
          pinsOverflow=all.slice(MAX_PINS).map(({id,...rest})=>rest);   // beyond the limit: kept safe, not drawn
          pins.forEach(keepPinReachable);
          pins.forEach(renderPin);
          if(pinsOverflow.length) setTimeout(()=>{ try{ tavo.utils.toast(t('runtime.pinsWaiting',{n:pinsOverflow.length})); }catch{} },700);
        }
      }catch{}
    }
    // renderText() ran before the pins were restored, so the list said "No pinned images yet" while pins were on screen
    renderPinsList();
  }

  // Floating button drag/open
  let fabDragging=false, fabStartX=0,fabStartY=0,fabOrigX=0,fabOrigY=0;
  const fabStart=e=>{
    if(fab.classList.contains('stealth')){fab.classList.add('peek');clearTimeout(fab._peekTimer);fab._peekTimer=setTimeout(()=>fab.classList.remove('peek'),1200)}
    const pt=e.touches?e.touches[0]:e;
    fabDragging=false;fabStartX=pt.clientX;fabStartY=pt.clientY;
    const r=fab.getBoundingClientRect();fabOrigX=r.left;fabOrigY=r.top;
  };
  const fabMove=e=>{
    const pt=e.touches?e.touches[0]:e;
    const dx=pt.clientX-fabStartX,dy=pt.clientY-fabStartY;
    if(Math.abs(dx)+Math.abs(dy)>8)fabDragging=true;
    if(!fabDragging)return;
    const ins=safeInsets();
    fab.style.left=Math.max(4,Math.min(innerWidth-fab.offsetWidth-4,fabOrigX+dx))+'px';
    fab.style.top=Math.max(ins.top,Math.min(innerHeight-fab.offsetHeight-ins.bottom,fabOrigY+dy))+'px';
    fab.style.right='auto';fab.style.bottom='auto';e.preventDefault();
  };
  let _panelTimer = null;
  function playPouchFx(){
    if(!pouchFx || !pouchRope || !pouchLoop || !fab || !panel || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    try{
      const fr=fab.getBoundingClientRect(), pr=panel.getBoundingClientRect();
      const fx=fr.left+fr.width/2, fy=fr.top+fr.height/2;
      const px=pr.right-14, py=pr.bottom-14;
      const mx=(fx+px)/2, my=(fy+py)/2-18;
      pouchFx.setAttribute('viewBox','0 0 '+Math.max(1,innerWidth)+' '+Math.max(1,innerHeight));
      pouchRope.setAttribute('d',`M ${px} ${py} Q ${mx} ${my} ${fx} ${fy}`);
      const len=Math.max(1,pouchRope.getTotalLength());
      pouchRope.style.setProperty('--rope-len',String(len));
      pouchLoop.setAttribute('cx',String(px)); pouchLoop.setAttribute('cy',String(py));
      pouchLoop.setAttribute('rx',String(Math.max(18,Math.min(46,pr.width*.09))));
      pouchLoop.setAttribute('ry',String(Math.max(14,Math.min(34,pr.height*.07))));
      pouchFx.classList.remove('play');
      void pouchFx.offsetWidth;
      pouchFx.classList.add('play');
      clearTimeout(pouchFx._timer);
      pouchFx._timer=setTimeout(()=>pouchFx.classList.remove('play'),380);
    }catch{}
  }
  function setPanelOpen(on){
    if(on && !termsAgreed()){ requireTerms(()=>setPanelOpen(true)); return; }   // the panel itself never opens before the Terms are agreed to
    clearTimeout(_panelTimer);
    if(on){ panel.classList.remove('closing'); panel.classList.add('open'); return; }
    if(!panel.classList.contains('open')) return;
    const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(reduced){ panel.classList.remove('open','closing'); return; }
    playPouchFx();
    panel.classList.add('closing'); panel.classList.remove('open');
    _panelTimer = setTimeout(()=>panel.classList.remove('closing'), 360);
  }
  const fabEnd=()=>{
    if(!fabDragging){
      if(panel.classList.contains('open')) setPanelOpen(false);
      else requireTerms(()=>setPanelOpen(true));      // the first tap asks for the quick agreement; nothing opens before it
    }
    else { const r=fab.getBoundingClientRect(); try{tavo.set('emonImageViewerFabPosition',{x:r.left,y:r.top},'global');}catch{} }
    fabDragging=false;
  };
  // Pointer Events handle mouse, touch, and pen. Do not bind touch events too; on mobile they can fire alongside pointer events and toggle the panel twice.
  fab.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;fabStart(e);fab.setPointerCapture?.(e.pointerId)});
  fab.addEventListener('pointermove',fabMove);
  fab.addEventListener('pointerup',fabEnd);
  fab.addEventListener('pointercancel',()=>{fabDragging=false});
  // Fired by the plugin's "Reset FAB position" sidebar action (see entry.js). Clearing the inline
  // overrides lets the default CSS corner position (see #emon-iv-fab) take over immediately.
  bus('emon-iv-fab-reset',()=>{
    try{
      fab.style.left='';fab.style.top='';fab.style.right='';fab.style.bottom='';
      fab.classList.remove('dragging');
      const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if(!reduced){
        fab.classList.remove('reset-pulse');
        void fab.offsetWidth; // restart the animation if it was already mid-play
        fab.classList.add('reset-pulse');
        setTimeout(()=>fab.classList.remove('reset-pulse'),560);
      }
    }catch{}
  });
  closeBtn.onclick=()=>setPanelOpen(false);
  previewBtn.onclick=()=>loadPreview(urlEl.value);
  urlEl.addEventListener('keydown',e=>{if(e.key==='Enter')loadPreview(urlEl.value)});
  // a second tap while the first is still working is ignored (it used to save or pin the same image twice)
  const tapOnce=fn=>{let busy=false;return async()=>{if(busy)return;busy=true;try{await fn();}finally{busy=false;}};};
  pinBtn.onclick=tapOnce(()=>pinPreview(currentPreview));
  saveBtn.onclick=tapOnce(()=>savePreview(currentPreview));
  importBtn.onclick=importLocalImage;
  refreshSavedBtn.onclick=loadSavedPreviews;
  clearSavedBtn.onclick=clearSavedFiles;
  fullBtn.onclick=()=>currentPreview?.src && tavo.utils.preview(currentPreview.src);
  openBtn.onclick=()=>currentPreview?.original && openSafe(currentPreview.original);
  if(saveDeviceBtn) saveDeviceBtn.onclick=()=>saveToDevice(currentPreview);
  if(copyLinkBtn) copyLinkBtn.onclick=()=>copyPreviewLink(currentPreview);
  if(infoOpenBtn) infoOpenBtn.onclick=()=>showImageInfo(currentPreview, previewImg);

  lookupTabs.forEach(b=>b.onclick=()=>setLookupMode(b.dataset.mode));
  lookupGo.onclick=runLookup;
  lookupClear.onclick=()=>{lookupInput.value='';lookupResult.innerHTML='';lookupResult.classList.remove('show');setLookupStatus('');};
  if(historyToggle){
    historyToggle.checked = isHistoryEnabled();
    if(historyOpenBtn) historyOpenBtn.style.display = historyToggle.checked ? '' : 'none';
    historyToggle.onchange = ()=>{
      setHistoryEnabled(historyToggle.checked);
      if(historyOpenBtn) historyOpenBtn.style.display = historyToggle.checked ? '' : 'none';
      if(!historyToggle.checked && historyPanel) historyPanel.style.display='none';
    };
  }
  if(historyOpenBtn) historyOpenBtn.onclick = ()=>{
    if(!historyPanel) return;
    const showing = historyPanel.style.display!=='none';
    historyPanel.style.display = showing ? 'none' : '';
    if(!showing) renderHistoryList();
  };
  if(historyClearBtn) historyClearBtn.onclick = ()=>{ setLookupHistory([]); renderHistoryList(); tavo.utils.toast(t('runtime.historyCleared')); };
  if(historyCloseBtn) historyCloseBtn.onclick = ()=>{ if(historyPanel) historyPanel.style.display='none'; };
  lookupInput.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')runLookup();});
  if(searchKeySave) searchKeySave.onclick=()=>{
    const val=String(searchKeyInput?.value||'').trim();
    if(!val){tavo.utils.toast(t('runtime.searchApiEnter'));return;}
    try{ tavo.set(currentEngine()==='tavily'?TAVILY_VAR:'emonImageViewerBraveKey',val,'global'); searchKeyInput.value=''; refreshSearchKeyUI(); tavo.utils.toast(t('runtime.searchApiSaved')); }
    catch(e){ console.error('[Image Preview] save key',e); tavo.utils.toast(t('runtime.error')); }
  };
  if(searchKeyClear) searchKeyClear.onclick=()=>{
    try{ tavo.set(currentEngine()==='tavily'?TAVILY_VAR:'emonImageViewerBraveKey','','global'); if(searchKeyInput) searchKeyInput.value=''; refreshSearchKeyUI(); tavo.utils.toast(t('runtime.searchApiRemoved')); }
    catch(e){ console.error('[Image Preview] clear key',e); tavo.utils.toast(t('runtime.error')); }
  };
  if(privacyToggle) privacyToggle.onclick=()=>{
    try{
      const next=!isPrivacyMode();
      tavo.set('emonImageViewerPrivacyMode', next,'global');
      refreshPrivacyUI();
      tavo.utils.toast(next ? t('runtime.privacyOnToast') : t('runtime.privacyOffToast'));
    }catch(e){ console.error('[Image Preview] privacy toggle',e); tavo.utils.toast(t('runtime.error')); }
  };
  // ---- Mini Game: a small local jump-over-obstacle runner to pass time while waiting for a reply. ----
  // Entirely local: no network calls. Only your chosen name/emoji, best score, in-progress run, relaxed-mode
  // preference and window position/size are saved (on this device, via tavo.set — same store used everywhere
  // else in this plugin, so it carries across chats the same way your Best score already does).
  const GAME_G = 1700;
  const GAME_JUMP_V = -460;
  const GAME_JUMP_HOLD_ACCEL = 950;
  const GAME_JUMP_HOLD_MS = 180;
  const GAME_JUMP_BUFFER_MS = 140;
  const GAME_GROUND_H = 24;
  const GAME_CHAR_SIZE = 30;
  const GAME_CHAR_X = 34;
  const GAME_DEFAULT_EMOJI = '🏃';
  const GAME_DEFAULT_W = 360;
  const GAME_DEFAULT_H = 190;

  // Higher, further-apart tiers so "True King" is a real milestone, not a first-run fluke —
  // plus funnier, more deflating titles at the bottom.
  const GAME_TITLES = [
    {min:5000, title:'👑 True King'},
    {min:3000, title:'🏆 Grand Champion'},
    {min:2000, title:'🛡️ Champion'},
    {min:1200, title:'⚔️ Knight'},
    {min:700,  title:'🏹 Squire'},
    {min:400,  title:'🪖 Recruit'},
    {min:220,  title:'🪑 Bench Warmer'},
    {min:120,  title:'🃏 Court Jester'},
    {min:60,   title:'🐣 Clumsy Hatchling'},
    {min:25,   title:'🧦 Lost Sock'},
    {min:8,    title:'🐌 Confused Snail'},
    {min:0,    title:'🥔 Potato Peasant'},
  ];
  function gameTitleFor(score){
    for(const g of GAME_TITLES) if(score>=g.min) return g.title;
    return GAME_TITLES[GAME_TITLES.length-1].title;
  }

  // Absurd, harmless, non-sexual one-liners for an early death — silly enough for anyone to read,
  // never mean-spirited toward the player themselves.
  const GAME_DEATH_LINES = [
    "Oopsie! A pigeon filed a formal complaint against you.",
    "You tripped over a rule you invented five seconds ago.",
    "Plot twist: the wall was your landlord the whole time.",
    "You have been legally reclassified as 'furniture'.",
    "A goat has taken your job. It's doing great.",
    "You blinked. The wall did not.",
    "Breaking news: local hero defeated by a small rectangle.",
    "Your license to run has been temporarily revoked.",
    "You have achieved 'horizontal' when 'vertical' was needed.",
    "The wall would like to thank you for your cooperation.",
    "You just got outsmarted by geometry.",
    "Somewhere, a physics teacher is nodding solemnly.",
    "You have unlocked: lying down unexpectedly.",
    "The ground called. It wants its face back.",
    "A wild wall appeared. It was super effective.",
  ];
  function gameDeathLineFor(score){
    // Only for genuinely early runs — a long run doesn't need a "you died instantly" joke.
    if(score>60) return '';
    const i = Math.floor(Math.random()*GAME_DEATH_LINES.length);
    return GAME_DEATH_LINES[i];
  }

  let gameRAF = null, gameLastT = 0, gs = null;
  let gameEmoji = GAME_DEFAULT_EMOJI, gameBest = 0, gamePlayerName = '', gameRelaxed = false;
  let jumpHeld = false, jumpHoldStart = 0, jumpBufferedAt = -9999;
  let gamePaused = false;
  let gameDeathLine = '';

  function getGameEmoji(){ try{ return String(tavo.get('emonImageViewerGameEmoji','global')||GAME_DEFAULT_EMOJI); }catch{ return GAME_DEFAULT_EMOJI; } }
  function getGameBest(){ try{ return Number(tavo.get('emonImageViewerGameBest','global'))||0; }catch{ return 0; } }
  function getGameName(){ try{ return String(tavo.get('emonImageViewerGameName','global')||'').trim(); }catch{ return ''; } }
  function getGameRelaxed(){ try{ return !!tavo.get('emonImageViewerGameRelaxed','global'); }catch{ return false; } }
  function getGameSavedRun(){ try{ const v=tavo.get('emonImageViewerGameRun','global'); return v&&typeof v==='object' ? v : null; }catch{ return null; } }
  function getGameWinRect(){ try{ const v=tavo.get('emonImageViewerGameWinRect','global'); return v&&typeof v==='object' ? v : null; }catch{ return null; } }
  function setGameBest(v){ try{ tavo.set('emonImageViewerGameBest', v,'global'); }catch{} }
  function setGameEmojiPref(v){ try{ tavo.set('emonImageViewerGameEmoji', v,'global'); }catch{} }
  function setGameName(v){ try{ tavo.set('emonImageViewerGameName', v,'global'); }catch{} }
  function setGameRelaxed(v){ try{ tavo.set('emonImageViewerGameRelaxed', v,'global'); }catch{} }
  function setGameSavedRun(v){ try{ tavo.set('emonImageViewerGameRun', v,'global'); }catch{} }
  function clearGameSavedRun(){ try{ tavo.set('emonImageViewerGameRun', null,'global'); }catch{} }
  function setGameWinRect(v){ try{ tavo.set('emonImageViewerGameWinRect', v,'global'); }catch{} }

  function sizeGameCanvas(){
    if(!gameCanvas) return;
    const rect = gameCanvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width || GAME_DEFAULT_W));
    const savedRect = getGameWinRect();
    const h = Math.max(140, Math.min(340, Math.round((savedRect&&savedRect.ch) || GAME_DEFAULT_H)));
    gameCanvas.width = w;
    gameCanvas.height = h;
    gameCanvas.style.height = h+'px';
  }

  function resetGame(fromSnapshot){
    if(!gameCanvas) return;
    const w = gameCanvas.width, h = gameCanvas.height;
    if(fromSnapshot){
      gs = { w, h, groundY: h-GAME_GROUND_H, charY:0, charV:0, obstacles:[],
             speed:fromSnapshot.speed||210, spawnTimer:0.9, spawnEvery:fromSnapshot.spawnEvery||1.6,
             score:fromSnapshot.score||0, alive:true, started:true };
    } else {
      gs = { w, h, groundY: h-GAME_GROUND_H, charY:0, charV:0, obstacles:[], speed:210, spawnTimer:0.9, spawnEvery:1.6, score:0, alive:true, started:false };
    }
    jumpHeld=false; jumpBufferedAt=-9999; gameDeathLine='';
  }

  function gamePointerDown(){
    if(!gs || gamePaused) return;
    if(!gs.started){ gs.started=true; return; }
    if(!gs.alive){ resetGame(false); return; }
    jumpHeld = true; jumpHoldStart = performance.now();
    if(gs.charY===0){ gs.charV = GAME_JUMP_V; }
    else { jumpBufferedAt = performance.now(); }
  }
  function gamePointerUp(){ jumpHeld = false; }

  function spawnObstacle(){
    const h = 20 + Math.random()*28;
    const w = 14 + Math.random()*14;
    gs.obstacles.push({x: gs.w+10, w, h});
  }

  function gameStep(dt){
    if(!gs || !gs.started || !gs.alive || gamePaused) return;

    if(gs.charY===0 && gs.charV===0 && jumpHeld && (performance.now()-jumpBufferedAt) < GAME_JUMP_BUFFER_MS){
      gs.charV = GAME_JUMP_V; jumpHoldStart = performance.now(); jumpBufferedAt = -9999;
    }

    let g = GAME_G;
    if(jumpHeld && gs.charV<0 && (performance.now()-jumpHoldStart) < GAME_JUMP_HOLD_MS) g -= GAME_JUMP_HOLD_ACCEL;
    gs.charV += g*dt;
    gs.charY += gs.charV*dt;
    if(gs.charY>0){ gs.charY=0; gs.charV=0; }

    if(gameRelaxed){
      // Relaxed Mode: fixed gentle pace, no ramp — for anyone who wants the timing pressure off.
      gs.speed = 175;
      gs.spawnEvery = 1.75;
    } else {
      const ramp = Math.max(0, gs.score-25);
      gs.speed = Math.min(460, 210 + ramp*1.1);
      gs.spawnEvery = Math.max(0.85, 1.55 - ramp*0.0025);
    }
    gs.spawnTimer -= dt;
    if(gs.spawnTimer<=0){ spawnObstacle(); gs.spawnTimer = gs.spawnEvery*(0.75+Math.random()*0.5); }

    const hitboxPad = gameRelaxed ? 0.85 : 1; // slightly smaller effective hitbox in Relaxed Mode = more forgiving
    const charBox = {x:GAME_CHAR_X-GAME_CHAR_SIZE*0.32*hitboxPad, y: gs.groundY+gs.charY-GAME_CHAR_SIZE*0.82, w:GAME_CHAR_SIZE*0.64*hitboxPad, h:GAME_CHAR_SIZE*0.82};
    for(const o of gs.obstacles){
      o.x -= gs.speed*dt;
      const oBox = {x:o.x, y: gs.groundY-o.h, w:o.w, h:o.h};
      if(charBox.x<oBox.x+oBox.w && charBox.x+charBox.w>oBox.x && charBox.y<oBox.y+oBox.h && charBox.y+charBox.h>oBox.y){
        gs.alive=false;
        const finalScore = Math.floor(gs.score);
        gameDeathLine = gameDeathLineFor(finalScore);
        if(finalScore>gameBest){ gameBest=finalScore; setGameBest(gameBest); }
        clearGameSavedRun(); // a finished run is no longer "in progress"
      }
    }
    gs.obstacles = gs.obstacles.filter(o=>o.x+o.w>-5);
    gs.score += dt*12;
  }

  function gameDraw(){
    if(!gs || !gctx) return;
    const ctx=gctx, w=gs.w, h=gs.h;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#ffffff16';
    ctx.fillRect(0, gs.groundY, w, 2);
    ctx.fillStyle='#f97373';
    for(const o of gs.obstacles) ctx.fillRect(o.x, gs.groundY-o.h, o.w, o.h);

    // draw the character mirrored so directional emoji (like the runner) face the direction of travel
    ctx.save();
    ctx.translate(GAME_CHAR_X, gs.groundY+gs.charY);
    ctx.scale(-1,1);
    ctx.font=`${GAME_CHAR_SIZE}px system-ui, sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillText(gameEmoji, 0, 0);
    ctx.restore();

    if(gamePaused){
      ctx.fillStyle='#00000095'; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#fff'; ctx.font='16px system-ui, sans-serif'; ctx.textAlign='center';
      ctx.fillText(t('runtime.gamePausedLabel'), w/2, h/2);
    }else if(!gs.started){
      ctx.fillStyle='#ffffffdd'; ctx.font='14px system-ui, sans-serif'; ctx.textAlign='center';
      ctx.fillText(t('runtime.gameTapStart'), w/2, h/2);
    }else if(!gs.alive){
      ctx.fillStyle='#00000090'; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='16px system-ui, sans-serif';
      ctx.fillText(t('runtime.gameOver'), w/2, h/2-22);
      if(gameDeathLine){
        ctx.font='11.5px system-ui, sans-serif'; ctx.fillStyle='#ffe08a';
        wrapText(ctx, gameDeathLine, w/2, h/2-2, w-40, 14);
      }
      ctx.font='13px system-ui, sans-serif'; ctx.fillStyle='#ffd27a';
      ctx.fillText(gameTitleFor(Math.floor(gs.score)), w/2, h/2+26);
      ctx.font='11px system-ui, sans-serif'; ctx.fillStyle='#ffffffaa';
      ctx.fillText(t('runtime.gameTapRestart'), w/2, h/2+44);
    }
    if(gameScoreEl) gameScoreEl.textContent = Math.floor(gs.score);
    if(gameBestEl) gameBestEl.textContent = gamePlayerName ? `${gameBest} · ${gameTitleFor(gameBest)} IS ${gamePlayerName}` : `${gameBest} · ${gameTitleFor(gameBest)}`;
  }

  function wrapText(ctx, text, cx, cy, maxWidth, lineHeight){
    const words = text.split(' ');
    let line = '', lines = [];
    for(const word of words){
      const test = line ? line+' '+word : word;
      if(ctx.measureText(test).width > maxWidth && line){ lines.push(line); line = word; }
      else line = test;
    }
    if(line) lines.push(line);
    ctx.textAlign='center';
    const startY = cy - ((lines.length-1)*lineHeight)/2;
    lines.forEach((l,i)=>ctx.fillText(l, cx, startY + i*lineHeight));
  }

  function gameLoop(ts){
    if(!gameLastT) gameLastT=ts;
    const dt = Math.min(0.05, (ts-gameLastT)/1000);
    gameLastT = ts;
    gameStep(dt);
    gameDraw();
    gameRAF = requestAnimationFrame(gameLoop);
  }

  function refreshGamePicker(){
    if(!gamePicker) return;
    const presets=['🏃','👾','⚡','🐉','💀'];
    gamePicker.querySelectorAll('button[data-emoji]').forEach(b=>b.classList.toggle('active', b.dataset.emoji===gameEmoji));
    if(gameCustomInput) gameCustomInput.value = presets.includes(gameEmoji) ? '' : gameEmoji;
  }

  function renderGameTiers(){
    if(!gameTiersList) return;
    const rows = GAME_TITLES.map(g=>{
      const isYours = gameBest>=g.min && (GAME_TITLES.find(x=>gameBest>=x.min)===g);
      return `<div class="grow${isYours?' you':''}"><span>${esc(g.title)}</span><span>${g.min}+</span></div>`;
    }).join('');
    gameTiersList.innerHTML = rows;
  }

  function openGameTiers(){ renderGameTiers(); gameTiersEl?.classList.add('show'); }
  function closeGameTiers(){ gameTiersEl?.classList.remove('show'); }

  function checkNameGate(){
    gamePlayerName = getGameName();
    if(gameNameGate) gameNameGate.classList.toggle('show', !gamePlayerName);
    return !!gamePlayerName;
  }

  function getGameSettingsOpen(){ try{ const v=tavo.get('emonImageViewerGameSettingsOpen','global'); return v===null||v===undefined ? false : !!v; }catch{ return false; } }
  function setGameSettingsOpen(v){ try{ tavo.set('emonImageViewerGameSettingsOpen', v,'global'); }catch{} }
  // The Jump Game's controls now live inside the ⚙ panel (see "game settings panel"), so they are never collapsed here.
  function applyGameSettingsCollapsed(){
    if(gameSettingsEl) gameSettingsEl.classList.remove('collapsed');
    if(gameSettingsToggle) gameSettingsToggle.setAttribute('aria-label', t('runtime.gameSettingsToggle'));
  }

  function startJump(){
    const hasName = checkNameGate();
    requestAnimationFrame(()=>{
      sizeGameCanvas();
      const saved = getGameSavedRun();
      resetGame(hasName ? saved : null);
      gamePaused = false;
      if(gamePauseBtn) gamePauseBtn.textContent = '⏸️';
      gameLastT = 0;
      if(gameRAF) cancelAnimationFrame(gameRAF);
      gameRAF = requestAnimationFrame(gameLoop);
    });
  }
  function stopJump(){
    if(gameRAF){ cancelAnimationFrame(gameRAF); gameRAF = null; }
  }

  function openGame(){
    if(!gameEl) return;
    gameEmoji = getGameEmoji();
    gameBest = getGameBest();
    gameRelaxed = getGameRelaxed();
    if(gameRelaxedToggle) gameRelaxedToggle.checked = gameRelaxed;
    clearTimeout(gameEl._closeT); gameEl.classList.remove('closing'); gameEl.classList.add('open');
    closeGameTiers();
    closeGameLib();
    closeSettingsPanel(true);
    refreshGamePicker();
    applyGameWindowRect();
    applyGameSettingsCollapsed();
    activateGame(getActiveGameId());
  }

  function persistRunSnapshot(){
    if(gs && gs.started && gs.alive){
      setGameSavedRun({score: gs.score, speed: gs.speed, spawnEvery: gs.spawnEvery});
    }
  }

  function closeGame(){
    if(!gameEl) return;
    if(gameMode==='jump') persistRunSnapshot();
    closeGameLib();
    closeSettingsPanel(true);
    gameEl.classList.add('closing');
    clearTimeout(gameEl._closeT);
    gameEl._closeT = setTimeout(()=>gameEl.classList.remove('open','closing'), 460);
    gameLoadToken++;
    stopJump();
    unloadGameFrame();
  }

  function togglePauseGame(){
    if(!gs || !gs.started || !gs.alive) return;
    gamePaused = !gamePaused;
    if(gamePauseBtn) gamePauseBtn.textContent = gamePaused ? '▶️' : '⏸️';
    if(gamePaused) persistRunSnapshot();
  }

  // ---- draggable header + resizable corner, distinct from the pinned-image drag/pinch ----
  function applyGameWindowRect(){
    const r = getGameWinRect();
    if(!r) return;
    const ins=safeInsets();
    gameEl.style.left = Math.max(0, Math.min(innerWidth-40, r.x)) + 'px';
    gameEl.style.top = Math.max(ins.top, Math.min(innerHeight-40-ins.bottom, r.y)) + 'px';
    gameEl.style.transform = 'none';
    if(r.w) gameEl.style.width = Math.max(260, Math.min(innerWidth*0.94, r.w)) + 'px';
  }

  function bindGameWindowControls(){
    if(!gameDragHandle || !gameEl) return;
    let dragging=false, sx=0, sy=0, ox=0, oy=0;
    gameDragHandle.addEventListener('pointerdown', e=>{
      if(e.target.closest('button')) return;
      dragging=true;
      const rect = gameEl.getBoundingClientRect();
      gameEl.style.left = rect.left+'px'; gameEl.style.top = rect.top+'px'; gameEl.style.transform='none';
      sx=e.clientX; sy=e.clientY; ox=rect.left; oy=rect.top;
      gameDragHandle.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    gameDragHandle.addEventListener('pointermove', e=>{
      if(!dragging) return;
      const ins=safeInsets();
      const nx = Math.max(0, Math.min(innerWidth-60, ox+e.clientX-sx));
      const ny = Math.max(ins.top, Math.min(innerHeight-60-ins.bottom, oy+e.clientY-sy));
      gameEl.style.left = nx+'px'; gameEl.style.top = ny+'px';
      e.preventDefault();
    });
    const endDrag = ()=>{
      if(!dragging) return;
      dragging=false;
      const rect = gameEl.getBoundingClientRect();
      saveGameWinRect(rect);
    };
    gameDragHandle.addEventListener('pointerup', endDrag);
    gameDragHandle.addEventListener('pointercancel', endDrag);

    if(!gameResizeHandle) return;
    let resizing=false, rsx=0, rsy=0, rw=0, rh=0;
    gameResizeHandle.addEventListener('pointerdown', e=>{
      resizing=true;
      rsx=e.clientX; rsy=e.clientY;
      rw = gameEl.getBoundingClientRect().width;
      rh = gameMode==='custom' ? (gameFrame ? gameFrame.offsetHeight : 300) : (gameCanvas ? gameCanvas.height : GAME_DEFAULT_H);
      gameResizeHandle.setPointerCapture?.(e.pointerId);
      e.preventDefault(); e.stopPropagation();
    });
    gameResizeHandle.addEventListener('pointermove', e=>{
      if(!resizing) return;
      const nw = Math.max(260, Math.min(innerWidth*0.94, rw+(e.clientX-rsx)));
      gameEl.style.width = nw+'px';
      if(gameMode==='custom'){
        const ih = Math.max(180, Math.min(560, rh+(e.clientY-rsy)));
        if(gameFrame) gameFrame.style.height = ih+'px';
        e.preventDefault(); e.stopPropagation();
        return;
      }
      const nh = Math.max(140, Math.min(340, rh+(e.clientY-rsy)));
      if(gameCanvas){ gameCanvas.height = nh; gameCanvas.style.height = nh+'px'; if(gs){ gs.h=nh; gs.groundY=nh-GAME_GROUND_H; } }
      e.preventDefault(); e.stopPropagation();
    });
    const endResize = e=>{
      if(!resizing) return;
      resizing=false;
      if(gameMode==='custom' && gameFrame){
        const liveH = gameFrame.offsetHeight;
        gameFrameBaseH = Math.max(180, Math.min(560, liveH - gamePadHeightApplied));
      }
      const rect = gameEl.getBoundingClientRect();
      saveGameWinRect(rect);
      if(gameCanvas && gameMode==='jump'){ gameCanvas.width = Math.round(rect.width); if(gs){ gs.w=gameCanvas.width; } }
    };
    gameResizeHandle.addEventListener('pointerup', endResize);
    gameResizeHandle.addEventListener('pointercancel', endResize);
  }

  if(gameCloseBtn) gameCloseBtn.onclick = closeGame;
  if(gamePauseBtn) gamePauseBtn.onclick = togglePauseGame;
  if(gameBestBtn) gameBestBtn.onclick = ()=>{ if(gameMode==='jump') openGameTiers(); else postToFrame({type:'tiers'}); };
  if(gameTiersClose) gameTiersClose.onclick = closeGameTiers;
  bindGameWindowControls();

  if(gameNameSave) gameNameSave.onclick = ()=>{
    const v = String(gameNameInput?.value||'').trim().slice(0,16);
    if(!v){ tavo.utils.toast(t('runtime.gameNameEnter')); return; }
    setGameName(v); gamePlayerName=v;
    gameNameGate?.classList.remove('show');
    if(gameMode==='jump') resetGame(getGameSavedRun());
    else activateGame(activeGameId);
  };
  if(gameChangeNameBtn) gameChangeNameBtn.onclick = ()=>{
    if(gameNameInput) gameNameInput.value = gamePlayerName || '';
    gameNameGate?.classList.add('show');
  };
  if(gameResetRunBtn) gameResetRunBtn.onclick = ()=>{
    clearGameSavedRun();
    resetGame(false);
    tavo.utils.toast(t('runtime.gameRunReset'));
  };
  if(gameResetBestBtn) gameResetBestBtn.onclick = ()=>{
    gameBest = 0; setGameBest(0);
    tavo.utils.toast(t('runtime.gameBestReset'));
  };
  if(gameRelaxedToggle) gameRelaxedToggle.onchange = ()=>{
    gameRelaxed = !!gameRelaxedToggle.checked;
    setGameRelaxed(gameRelaxed);
  };

  if(gameCanvas){
    gameCanvas.addEventListener('pointerdown', e=>{ e.preventDefault(); gamePointerDown(); });
    gameCanvas.addEventListener('pointerup', e=>{ e.preventDefault(); gamePointerUp(); });
    gameCanvas.addEventListener('pointercancel', gamePointerUp);
    gameCanvas.addEventListener('pointerleave', gamePointerUp);
  }
  winOn('keydown', e=>{
    if(gameEl && gameEl.classList.contains('open') && gameMode==='jump' && !gameEl.classList.contains('libopen') && !/^(INPUT|TEXTAREA)$/.test((e.target&&e.target.tagName)||'') && (e.code==='Space'||e.key===' ')){
      e.preventDefault();
      if(!e.repeat) gamePointerDown();
    }
  });
  winOn('keyup', e=>{
    if(gameMode==='jump' && (e.code==='Space'||e.key===' ')) gamePointerUp();
  });
  if(gamePicker){
    gamePicker.querySelectorAll('button[data-emoji]').forEach(b=>{
      b.onclick=()=>{ gameEmoji=b.dataset.emoji; setGameEmojiPref(gameEmoji); refreshGamePicker(); };
    });
  }
  if(gameCustomInput) gameCustomInput.addEventListener('change', ()=>{
    const v=String(gameCustomInput.value||'').trim();
    if(v){ gameEmoji=v; setGameEmojiPref(v); refreshGamePicker(); }
  });
  if(gameCustomClearBtn) gameCustomClearBtn.onclick = ()=>{
    gameEmoji = GAME_DEFAULT_EMOJI;
    setGameEmojiPref(GAME_DEFAULT_EMOJI);
    if(gameCustomInput) gameCustomInput.value = '';
    refreshGamePicker();
    tavo.utils.toast(t('runtime.gameCustomCleared'));
  };
  winOn('resize', ()=>{
    if(!gameEl || !gameEl.classList.contains('open')) return;
    const ins=safeInsets();
    const rect = gameEl.getBoundingClientRect();
    const nx = Math.max(0, Math.min(innerWidth-60, rect.left));
    const ny = Math.max(ins.top, Math.min(innerHeight-60-ins.bottom, rect.top));
    if(gameEl.style.transform==='none'){ gameEl.style.left=nx+'px'; gameEl.style.top=ny+'px'; }
  });
  // The panel close button closes only the Image Preview panel. The game has its own X button.

  // ---- Game library (v2.9.0): pick between built-in games and games you add yourself. ----
  // Added games are single HTML files. Each one runs inside a sandboxed iframe (allow-scripts only, no
  // same-origin), so it cannot touch your chats, Tavo data, or this plugin's page. The HTML itself is kept
  // in a global-scope file; only a tiny list (id / name / emoji / file name) lives in a variable.
  // Optional score protocol: a game may call
  //   parent.postMessage({emonGame:1, type:'score'|'gameover', score:NUMBER, low:true?}, '*')
  // and the window will show the score and remember a best score for that game.
  const GAMES_VAR = 'emonImageViewerGames';
  const GAME_BESTS_VAR = 'emonImageViewerGameBests';
  const GAME_ACTIVE_VAR = 'emonImageViewerGameActive';
  const GAMES_MAX = 30;
  const GAME_MAX_CHARS = 2000000;
  const GAME_FRAME_DEFAULT_H = 320;

  const gameFrame = byId('emon-iv-game-frame');
  const gameNameEl = byId('emon-iv-game-name');
  const gameSwitchBtn = byId('emon-iv-game-switch');
  const gameLibEl = byId('emon-iv-game-lib');
  const gameLibList = byId('emon-iv-game-lib-list');
  const gameLibClose = byId('emon-iv-game-lib-close');
  const gameAddOpen = byId('emon-iv-game-add-open');
  const gameAddForm = byId('emon-iv-game-add');
  const gameAddName = byId('emon-iv-game-add-name');
  const gameAddEmoji = byId('emon-iv-game-add-emoji');
  const gameAddCode = byId('emon-iv-game-add-code');
  const gameAddImport = byId('emon-iv-game-add-import');
  const gameAddSave = byId('emon-iv-game-add-save');
  const gameAddCancel = byId('emon-iv-game-add-cancel');
  const gameAddAi = byId('emon-iv-game-add-ai');

  let gameMode = 'jump';
  let activeGameId = 'jump';
  let gameLoadToken = 0;

  // ---------- built-in extra games (also handy as examples of the format) ----------
  // Built-in games can also keep progress: they send {emonGame:1,type:'save',data:{...}} and get that data
  // back in L.data the next time they load. They can show a best/title in the score row with
  // {type:'status', score, best, lib, label}. The parent can send them {type:'tiers'|'pause'|'resume'}.
  function snakeGame(L){
    var N = 16;
    var SKINS = [
      {id:'violet',name:'Violet',cost:0,head:'#c4b5fd',body:['#8b5cf6','#7c4fe0']},
      {id:'lcd',name:'Old LCD',cost:60,head:'#e3f2b0',body:['#8fb03c','#7a9a2f']},
      {id:'steel',name:'Steel',cost:100,head:'#f1f5f9',body:['#94a3b8','#64748b']},
      {id:'camo',name:'Camo',cost:150,head:'#cbd5a7',body:['#588157','#3a5a40','#6b705c']},
      {id:'ember',name:'Ember',cost:200,head:'#fde68a',body:['#f97316','#ea580c','#dc2626']},
      {id:'ocean',name:'Ocean',cost:200,head:'#a5f3fc',body:['#0ea5e9','#0284c7','#0369a1']},
      {id:'rose',name:'Rose',cost:250,head:'#ffe4e6',body:['#fb7185','#f43f5e']},
      {id:'candy',name:'Cotton Candy',cost:300,head:'#ffffff',body:['#f9a8d4','#a5b4fc','#99f6e4']},
      {id:'neon',name:'Neon',cost:400,head:'#ffffff',body:['#22d3ee','#a3e635']},
      {id:'gold',name:'Royal Gold',cost:500,head:'#fff7cc',body:['#facc15','#eab308','#ca8a04']},
      {id:'rainbow',name:'Rainbow',cost:800,head:'#ffffff',body:['#ffffff'],rainbow:true}
    ];
    var FOODS = [
      {id:'apple',name:'Apple',cost:0,e:'🍎'},
      {id:'cherry',name:'Cherry',cost:50,e:'🍒'},
      {id:'strawberry',name:'Strawberry',cost:100,e:'🍓'},
      {id:'donut',name:'Donut',cost:150,e:'🍩'},
      {id:'lollipop',name:'Lollipop',cost:200,e:'🍭'},
      {id:'blossom',name:'Blossom',cost:250,e:'🌸'},
      {id:'burger',name:'Burger',cost:300,e:'🍔'},
      {id:'butterfly',name:'Butterfly',cost:400,e:'🦋'},
      {id:'star',name:'Star',cost:500,e:'⭐'},
      {id:'gem',name:'Gem',cost:750,e:'💎'}
    ];
    var BOARDS = [
      {id:'night',name:'Night',cost:0,a:'#0a0f18',b:'#0e1522'},
      {id:'lcd',name:'Old Phone LCD',cost:80,a:'#a3b86c',b:'#98ae62'},
      {id:'plum',name:'Plum Dusk',cost:120,a:'#1b1220',b:'#26172d'},
      {id:'ocean',name:'Deep Ocean',cost:120,a:'#06202e',b:'#0a2c40'},
      {id:'forest',name:'Forest',cost:120,a:'#0d1f14',b:'#13301e'},
      {id:'paper',name:'Paper',cost:200,a:'#f1ebdd',b:'#e7dfcc'}
    ];
    var CATS = {skin:SKINS, food:FOODS, board:BOARDS};
    // The world is round in every mode: leave one edge, come back on the opposite one.
    var MODES = {
      easy:    {start:0.24, min:0.16, ramp:0.0025, mult:1, rocks:0},
      medium:  {start:0.18, min:0.11, ramp:0.003,  mult:2, rocks:0},
      extreme: {start:0.13, min:0.07, ramp:0.004,  mult:3, rocks:4}
    };
    var MODE_ORDER = ['easy','medium','extreme'];
    var TITLES = [
      {min:700, title:'🌀 Ouroboros'},
      {min:450, title:'🌍 World Serpent'},
      {min:320, title:'🌒 Eclipse Serpent'},
      {min:230, title:'🕷️ Dread Weaver'},
      {min:170, title:'💀 Crypt Lord'},
      {min:120, title:'🐍 Anaconda Eater'},
      {min:85,  title:'🩸 Blood Moon Hunter'},
      {min:60,  title:'👁️ Nightmare Watcher'},
      {min:40,  title:'🌑 Moonless Stalker'},
      {min:25,  title:'🪦 Graveyard Slither'},
      {min:12,  title:'🦇 Cave Whisperer'},
      {min:5,   title:'🕸️ Cobweb Crawler'},
      {min:0,   title:'🥚 Cursed Hatchling'}
    ];
    function titleFor(s){ for(var i=0;i<TITLES.length;i++) if(s>=TITLES[i].min) return TITLES[i].title; return TITLES[TITLES.length-1].title; }
    function byId(list,id){ for(var i=0;i<list.length;i++) if(list[i].id===id) return list[i]; return null; }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function f(s,o){ return String(s||'').replace(/\{(\w+)\}/g,function(_,k){ return o&&(k in o) ? o[k] : '{'+k+'}'; }); }
    function send(o){ try{ o.emonGame = 1; parent.postMessage(o,'*'); }catch(e){} }

    // ---- saved data, sanitised ----
    var D = (L.data && typeof L.data==='object') ? L.data : {};
    D.pts = Math.max(0, Math.floor(Number(D.pts)||0));
    if(!D.own || typeof D.own!=='object') D.own = {};
    if(!D.eq || typeof D.eq!=='object') D.eq = {};
    if(!D.best || typeof D.best!=='object') D.best = {};
    Object.keys(CATS).forEach(function(k){
      var list = CATS[k];
      if(!Array.isArray(D.own[k])) D.own[k] = [];
      if(D.own[k].indexOf(list[0].id) < 0) D.own[k].unshift(list[0].id);
      D.own[k] = D.own[k].filter(function(id){ return !!byId(list,id); });
      if(!byId(list,D.eq[k]) || D.own[k].indexOf(D.eq[k]) < 0) D.eq[k] = list[0].id;
    });
    MODE_ORDER.forEach(function(m){ D.best[m] = Math.max(0, Math.floor(Number(D.best[m])||0)); });
    if(!MODES[D.mode]) D.mode = 'medium';
    D.ctrl = D.ctrl === 'pad' ? 'pad' : 'gesture';

    var wrap = byId('wrap'), cv = byId('c'), ctx = cv.getContext('2d');
    var pad = byId('pad'), ov = byId('ov'), toastEl = byId('toast');
    var ptsEl = byId('pts');
    var pz = byId('pz'); pz.textContent = L.paused;
    var shopBtn = byId('shop'); shopBtn.querySelector('span').textContent = L.gsShop;
    var paused = false, pops = [];
    var ARROWS = {
      l:'<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15 5v14L6 12z"/></svg>',
      u:'<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 6l7 10H5z"/></svg>',
      d:'<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 18L5 8h14z"/></svg>',
      r:'<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9 5v14l9-7z"/></svg>'
    };
    pad.innerHTML = ['l','u','d','r'].map(function(k){ return '<button data-d="'+k+'" aria-label="'+k+'">'+ARROWS[k]+'</button>'; }).join('');

    var cell = 10, snake, dir, queue, food, rocks, alive, started, score, foods, runPts, newBest, acc = 0, last = 0;

    // ---- saving ----
    var saveT = null;
    function save(){ if(saveT){ clearTimeout(saveT); saveT = null; } send({type:'save', data:D}); }
    function saveSoon(){ if(!saveT) saveT = setTimeout(save, 800); }
    window.addEventListener('pagehide', save);

    function status(){
      var b = D.best[D.mode], lib = Math.max(D.best.easy, D.best.medium, D.best.extreme);
      send({type:'status', score:score, best:b, lib:lib, label: titleFor(b) + (L.name ? ' IS '+L.name : '')});
    }
    function toast(msg){
      toastEl.textContent = msg; toastEl.style.display = 'block';
      clearTimeout(toast.t); toast.t = setTimeout(function(){ toastEl.style.display = 'none'; }, 1700);
    }
    function paintBar(){ ptsEl.textContent = D.pts; }

    // ---- game ----
    function fit(){
      var s = Math.max(120, Math.floor(Math.min(wrap.clientWidth - 6, wrap.clientHeight - 6)));
      cv.width = s; cv.height = s; cell = s / N;
    }
    function applyCtrl(){ pad.style.display = D.ctrl === 'pad' ? 'flex' : 'none'; fit(); }
    function occupied(x,y){
      var i;
      for(i=0;i<snake.length;i++) if(snake[i].x===x && snake[i].y===y) return true;
      for(i=0;i<rocks.length;i++) if(rocks[i].x===x && rocks[i].y===y) return true;
      return !!(food && food.x===x && food.y===y);
    }
    function placeFood(){
      var p, guard = 0;
      do{ p = {x:Math.floor(Math.random()*N), y:Math.floor(Math.random()*N)}; guard++; }
      while(occupied(p.x,p.y) && guard < 400);
      food = p;
    }
    function addRock(){
      var guard = 0, p;
      do{
        p = {x:Math.floor(Math.random()*N), y:Math.floor(Math.random()*N)}; guard++;
      } while((occupied(p.x,p.y) || Math.abs(p.x-snake[0].x)+Math.abs(p.y-snake[0].y) < 5) && guard < 200);
      if(guard < 200) rocks.push(p);
    }
    function reset(){
      snake = [{x:8,y:8},{x:7,y:8},{x:6,y:8}]; dir = {x:1,y:0}; queue = []; rocks = []; food = null;
      score = 0; foods = 0; runPts = 0; newBest = false; alive = true; started = false; acc = 0;
      placeFood(); paintBar(); status();
    }
    function turn(dx,dy){
      if(paused || ov.className.indexOf('show') >= 0) return;
      var ref = queue.length ? queue[queue.length-1] : dir;
      if((dx===-ref.x && dy===-ref.y) || (dx===ref.x && dy===ref.y)) return;
      if(queue.length < 3) queue.push({x:dx,y:dy});
      if(alive && !started) started = true;
    }
    function die(){
      alive = false;
      if(score > D.best[D.mode]){ D.best[D.mode] = score; newBest = true; }
      save(); status(); paintBar();
    }
    function hit(list,x,y){ for(var i=0;i<list.length;i++) if(list[i].x===x && list[i].y===y) return true; return false; }
    function step(){
      var m = MODES[D.mode];
      if(queue.length) dir = queue.shift();
      // round world: past the last column you re-enter at the first, and the same for rows
      var hx = (snake[0].x + dir.x + N) % N, hy = (snake[0].y + dir.y + N) % N;
      if(hit(rocks,hx,hy)){ die(); return; }
      var ate = (hx===food.x && hy===food.y);
      // the tail cell is free to enter unless we are growing (then the tail stays put)
      if(hit(ate ? snake : snake.slice(0,-1), hx, hy)){ die(); return; }
      snake.unshift({x:hx,y:hy});
      if(ate){
        foods++; score += m.mult; D.pts += m.mult; runPts += m.mult;
        pops.push({x:hx, y:hy, v:m.mult, born:performance.now()});
        placeFood();
        if(m.rocks && foods % m.rocks === 0 && rocks.length < 10) addRock();
        paintBar(); status(); saveSoon();
      } else snake.pop();
    }

    function segColor(sk,i){
      if(sk.rainbow) return 'hsl('+((i*24 + performance.now()/12) % 360)+',80%,62%)';
      return i===0 ? sk.head : sk.body[i % sk.body.length];
    }
    function wrapLines(text,maxW){
      var words = String(text).split(' '), line = '', out = [];
      words.forEach(function(w){
        var test = line ? line+' '+w : w;
        if(ctx.measureText(test).width > maxW && line){ out.push(line); line = w; } else line = test;
      });
      if(line) out.push(line);
      return out;
    }
    function overlayLines(lines){
      var w = cv.width, gap = 6, total = 0;
      ctx.fillStyle = '#000000b0'; ctx.fillRect(0,0,w,w);
      var flat = [];
      lines.forEach(function(l){
        ctx.font = l.size+'px system-ui, sans-serif';
        wrapLines(l.t, w-28).forEach(function(s){ flat.push({t:s,size:l.size,color:l.color}); });
      });
      flat.forEach(function(l){ total += l.size + gap; });
      var y = (w - total)/2 + 6;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      flat.forEach(function(l){
        ctx.font = l.size+'px system-ui, sans-serif'; ctx.fillStyle = l.color;
        y += l.size; ctx.fillText(l.t, w/2, y); y += gap;
      });
    }
    function draw(){
      var w = cv.width, bd = byId(BOARDS, D.eq.board), sk = byId(SKINS, D.eq.skin), fd = byId(FOODS, D.eq.food), x, y;
      ctx.fillStyle = bd.a; ctx.fillRect(0,0,w,w);
      ctx.fillStyle = bd.b;
      for(x=0;x<N;x++) for(y=0;y<N;y++) if((x+y)%2===0) ctx.fillRect(x*cell, y*cell, cell, cell);
      rocks.forEach(function(r){
        ctx.fillStyle = '#334155'; ctx.fillRect(r.x*cell+1, r.y*cell+1, cell-2, cell-2);
        ctx.fillStyle = '#64748b'; ctx.fillRect(r.x*cell+2, r.y*cell+2, cell-5, cell-5);
      });
      ctx.font = Math.floor(cell*0.85)+'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText(fd.e, (food.x+0.5)*cell, (food.y+0.55)*cell);
      ctx.textBaseline = 'alphabetic';
      snake.forEach(function(q,i){
        ctx.fillStyle = segColor(sk,i);
        ctx.fillRect(q.x*cell+1, q.y*cell+1, cell-2, cell-2);
      });
      var hd = snake[0], cx = (hd.x+0.5)*cell, cy = (hd.y+0.5)*cell, px = -dir.y, py = dir.x;
      ctx.fillStyle = '#111';
      [-1,1].forEach(function(s){
        ctx.fillRect(cx + dir.x*cell*0.18 + px*s*cell*0.2 - 1, cy + dir.y*cell*0.18 + py*s*cell*0.2 - 1, 2.4, 2.4);
      });
      var nowT = performance.now();
      pops = pops.filter(function(p){ return nowT - p.born < 800; });
      pops.forEach(function(p){
        var age = (nowT - p.born) / 800;
        ctx.globalAlpha = 1 - age;
        ctx.font = 'bold ' + Math.floor(cell*0.95) + 'px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#fde68a'; ctx.fillText('+' + p.v, (p.x+0.5)*cell, (p.y+0.2)*cell - age*cell*1.2);
        ctx.globalAlpha = 1;
      });
      if(!alive){
        var lines = [
          {t:L.gameOver, size:20, color:'#ffffff'},
          {t:titleFor(score), size:13, color:'#ffd27a'}
        ];
        if(newBest) lines.push({t:L.gsNewBest, size:12, color:'#a7f3d0'});
        lines.push({t:'★ +'+runPts+' '+L.gsEarned, size:11.5, color:'#fde68a'});
        lines.push({t:L.gameTapRestart, size:11.5, color:'#ffffffaa'});
        overlayLines(lines);
      } else if(!started){
        var mm = MODES[D.mode];
        overlayLines([
          {t:L.gameTapStart, size:16, color:'#ffffff'},
          {t:L['gsInfo'+cap(D.mode)], size:11.5, color:'#ffffffcc'},
          {t:f(L.gsMult,{n:mm.mult}), size:11.5, color:'#fde68a'},
          {t:L.gsWorld, size:10.5, color:'#ffffff99'}
        ]);
      }
    }
    function loop(ts){
      if(!last) last = ts;
      acc += Math.min(0.1, (ts-last)/1000); last = ts;
      var m = MODES[D.mode], every = Math.max(m.min, m.start - foods*m.ramp);
      while(acc >= every){ if(started && alive && !paused && ov.className.indexOf('show') < 0) step(); acc -= every; }
      draw();
      requestAnimationFrame(loop);
    }

    // ---- input: swipe gestures or on-screen arrow buttons (chosen in Settings) ----
    var sx = 0, sy = 0, down = false, moved = false;
    cv.addEventListener('pointerdown', function(e){ down = true; moved = false; sx = e.clientX; sy = e.clientY; e.preventDefault(); });
    cv.addEventListener('pointermove', function(e){
      if(!down || D.ctrl !== 'gesture') return;
      var dx = e.clientX-sx, dy = e.clientY-sy;
      if(Math.max(Math.abs(dx),Math.abs(dy)) < 16) return;
      moved = true; sx = e.clientX; sy = e.clientY;
      if(Math.abs(dx) > Math.abs(dy)) turn(dx>0?1:-1, 0); else turn(0, dy>0?1:-1);
    });
    cv.addEventListener('pointerup', function(){
      if(down && !moved && !paused && ov.className.indexOf('show') < 0){
        if(!alive){ reset(); started = true; }
        else if(!started){ started = true; }
      }
      down = false;
    });
    cv.addEventListener('pointercancel', function(){ down = false; });
    var DIRS = {l:[-1,0], u:[0,-1], d:[0,1], r:[1,0]};
    [].forEach.call(pad.querySelectorAll('button'), function(b){
      b.addEventListener('pointerdown', function(e){
        e.preventDefault();
        if(paused || ov.className.indexOf('show') >= 0) return;
        var v = DIRS[b.getAttribute('data-d')];
        if(!alive) reset();
        started = true;
        turn(v[0], v[1]);
      });
    });
    window.addEventListener('keydown', function(e){
      var k = e.key;
      if(paused || ov.className.indexOf('show') >= 0) return;
      if(k==='ArrowUp'||k==='w'){ turn(0,-1); e.preventDefault(); }
      else if(k==='ArrowDown'||k==='s'){ turn(0,1); e.preventDefault(); }
      else if(k==='ArrowLeft'||k==='a'){ turn(-1,0); e.preventDefault(); }
      else if(k==='ArrowRight'||k==='d'){ turn(1,0); e.preventDefault(); }
      else if(k===' '){ if(!alive) reset(); started = true; e.preventDefault(); }
    });

    // ---- overlays: settings, store, titles ----
    var tab = 'skin';
    function closeOv(){ ov.className = ''; ov.innerHTML = ''; }
    // Settings (mode, controls) are declared to the window's gear panel and applied when it sends "set".
    function applyMode(v){
      if(!MODES[v]) return;
      if(started && alive) return;
      if(v !== D.mode){ D.mode = v; reset(); save(); }
    }
    function applyControls(v){
      if(v !== 'pad' && v !== 'gesture') return;
      send({type:'padHeight', on: v === 'pad'});
      D.ctrl = v; applyCtrl(); save();
    }
    function sendSettings(){
      send({type:'settings', items:[
        {id:'mode', label:L.gsMode, value:D.mode, locked:!!(started && alive), note:L.gsLocked,
         hint:L['gsInfo'+cap(D.mode)]+' '+f(L.gsMult,{n:MODES[D.mode].mult}),
         options:MODE_ORDER.map(function(m){ return {v:m, t:L['gs'+cap(m)]}; })},
        {id:'ctrl', label:L.gsControls, value:D.ctrl, locked:false,
         options:[{v:'gesture',t:L.gsCtrlGesture},{v:'pad',t:L.gsCtrlPad}]}
      ]});
    }
    function previewHTML(cat,it){
      if(cat==='skin') return '<canvas class="pv" width="64" height="18" data-skin="'+it.id+'"></canvas>';
      if(cat==='food') return '<span class="pve">'+it.e+'</span>';
      return '<span class="pvb" style="background:linear-gradient(90deg,'+it.a+' 50%,'+it.b+' 50%)"></span>';
    }
    function paintSkinPreviews(){
      [].forEach.call(ov.querySelectorAll('canvas[data-skin]'), function(c){
        var sk = byId(SKINS, c.getAttribute('data-skin')), g = c.getContext('2d'), i;
        g.clearRect(0,0,64,18);
        for(i=4;i>=0;i--){ g.fillStyle = segColor(sk,i); g.fillRect(2+i*12, 2, 11, 14); }
      });
    }
    function renderStore(){
      var h = '<div class="ovh"><b>'+L.gsStore+'</b><span class="pbig">★ '+D.pts+'</span><button class="x" data-act="close">×</button></div>';
      h += '<div class="tabs">' + ['skin','food','board'].map(function(k){
        return '<button class="tab'+(k===tab?' on':'')+'" data-act="tab" data-k="'+k+'">'+L['gsTab'+cap(k)]+'</button>';
      }).join('') + '</div><div class="tag">'+L.gsStoreTag+'</div><div class="rows">';
      CATS[tab].forEach(function(it){
        var owned = D.own[tab].indexOf(it.id) >= 0, eq = D.eq[tab] === it.id, btn;
        if(eq) btn = '<button class="eq" disabled>✓ '+L.gsEquipped+'</button>';
        else if(owned) btn = '<button data-act="equip" data-id="'+it.id+'">'+L.gsEquip+'</button>';
        else btn = '<button class="buy'+(D.pts<it.cost?' dis':'')+'" data-act="buy" data-id="'+it.id+'">'+L.gsBuy+' '+it.cost+' ★</button>';
        h += '<div class="row">'+previewHTML(tab,it)+'<span class="nm">'+it.name+'</span>'+btn+'</div>';
      });
      ov.innerHTML = h + '</div>'; ov.className = 'show';
      paintSkinPreviews();
    }
    function renderTiers(){
      var cur = titleFor(D.best[D.mode]);
      var h = '<div class="ovh"><b>'+L.gsTiers+'</b><button class="x" data-act="close">×</button></div><div class="rows">';
      TITLES.forEach(function(t){ h += '<div class="row'+(t.title===cur?' you':'')+'"><span class="nm">'+t.title+'</span><span class="mn">'+t.min+'+</span></div>'; });
      ov.innerHTML = h + '</div>'; ov.className = 'show';
    }
    ov.addEventListener('click', function(e){
      var b = e.target.closest('[data-act]'); if(!b) return;
      var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), v = b.getAttribute('data-v');
      if(act==='close'){ closeOv(); return; }
      if(act==='tab'){ tab = b.getAttribute('data-k'); renderStore(); return; }
      var it = byId(CATS[tab], id); if(!it) return;
      if(act==='equip' && D.own[tab].indexOf(id) >= 0){ D.eq[tab] = id; save(); renderStore(); return; }
      if(act==='buy'){
        if(D.own[tab].indexOf(id) >= 0) return;
        if(D.pts < it.cost){ toast(L.gsNoPoints); return; }
        D.pts -= it.cost; D.own[tab].push(id); D.eq[tab] = id;
        save(); paintBar(); renderStore(); toast(L.gsBought);
      }
    });
    shopBtn.addEventListener('click', renderStore);
    window.addEventListener('message', function(e){
      var d = e.data; if(!d || d.emonGame !== 1) return;
      if(d.type === 'tiers') renderTiers();
      else if(d.type === 'pause'){ paused = true; pz.classList.add('show'); }
      else if(d.type === 'resume'){ paused = false; pz.classList.remove('show'); }
      else if(d.type === 'settings?') sendSettings();
      else if(d.type === 'set'){
        if(d.id === 'mode') applyMode(String(d.value));
        else if(d.id === 'ctrl') applyControls(String(d.value));
        sendSettings();
      }
      else if(d.type === 'reset' && d.what === 'best'){
        MODE_ORDER.forEach(function(m){ D.best[m] = 0; });
        newBest = false; save(); status();
      }
    });
    window.addEventListener('resize', fit);
    send({type:'padHeight', on: D.ctrl === 'pad'});
    applyCtrl(); reset(); sendSettings(); requestAnimationFrame(loop);
  }

  function bombGame(L){
    // New emoji sets unlock as you climb, so the board never feels familiar for long:
    // levels 1-2 animals, 3-4 food, 5-6 sky & nature, 7-8 objects, 9-10 spooky, 11+ everything mixed.
    var SETS = [
      ['🐶','🐱','🦊','🐼','🐸','🦄','🐙','🐧','🐵','🐢','🦉','🐝'],
      ['🍉','🍕','🍔','🍩','🍒','🥑','🌽','🍇','🍪','🥕','🍓','🍍'],
      ['🚀','🌙','⭐','🪐','🌈','⚡','🔥','🌊','🌵','🍄','🌻','🌸'],
      ['🎸','🎲','🧩','🔑','⏰','📷','🎧','🧭','🪁','💎','🔮','🎈'],
      ['👻','💀','🦇','🐉','🦂','🏺','🧿','👽','🤡','🎃','🦖','🌋']
    ];
    function setIdx(n){ return n <= 10 ? Math.floor((n-1)/2) : 5; }
    function poolFor(n){
      var i = setIdx(n);
      if(i < 5) return SETS[i].slice();
      var all = []; SETS.forEach(function(s){ all = all.concat(s); }); return all;
    }
    var TITLES = [
      {min:20, title:'👑 The Unblowable'},
      {min:14, title:'🌌 Mind Like a Vault'},
      {min:10, title:'🧠 Memory Monarch'},
      {min:7,  title:'🦉 Cool Head Under Fire'},
      {min:5,  title:'🕵️ Bomb Squad Rookie'},
      {min:3,  title:'🧯 Fuse Whisperer'},
      {min:2,  title:'✂️ Blue-Wire Guesser'},
      {min:1,  title:'🧦 Sock Defuser'},
      {min:0,  title:'💣 Bomb Snack'}
    ];
    // Loving roasts. {name} becomes the player's name.
    var ROAST_EARLY = [
      {t:'👑➜🩰 A Princess in Distress', l:'Yesterday, {name} was King of Kings. Today? Sitting in the tower, waiting to be rescued.'},
      {t:'🥔 Certified Potato of the Realm', l:'Mommy says: "I did not carry you for nine months for this, {name}."'},
      {t:'🍚 Go Eat Your Rice', l:'Mommy: "You have been on that phone for hours, {name}. Rice. Now."'},
      {t:'🐌 Speed of a Sleepy Snail', l:'The cards saw you coming, {name}. They planned this together.'},
      {t:'🧦 Lost Sock Energy', l:'{name} walked in with confidence and walked out with a lesson.'},
      {t:'📵 Phone Confiscated', l:'Mommy: "Hand it over, {name}. Your brain is on leave today."'},
      {t:'🐔 Brave Chicken Award', l:'Big plans, {name}. Small results. Still a lovable chicken.'},
      {t:'🪑 Retired Before Starting', l:'{name}, the bench is warm and it has been missing you.'}
    ];
    var ROAST_MID = [
      {t:'🦸 Hero of the First Levels', l:'The next level sends its regards, {name}. Also a small, loving laugh.'},
      {t:'🥲 Almost Somebody', l:'Mommy: "I am proud of you, {name}. Now drink some water, you look pale."'},
      {t:'🍜 Instant Noodle Brain', l:'Two minutes of genius, {name}. Then the water went cold.'},
      {t:'🎭 Main Character, Wrong Movie', l:'{name} was cooking. Then forgot the stove was on.'},
      {t:'🧯 Fire Extinguisher Required', l:'The fuse was short, {name}. So was the focus.'},
      {t:'🐢 The Tortoise Who Did Not Win', l:'Slow, steady, and still late, {name}.'},
      {t:'📚 Studied Hard, Forgot the Exam', l:'Mommy: "You remember every cartoon, {name}, but not where the cat was?"'},
      {t:'🤡 Court Jester, Promoted', l:'Your Majesty {name}, the whole kingdom laughed. Lovingly.'}
    ];
    var ROAST_LATE = [
      {t:'🔥 Legend, Slightly Burnt', l:'{name} went further than most people dare. The bomb just wanted attention.'},
      {t:'🫡 Respect, Then Boom', l:'Even the bomb saluted you, {name}.'},
      {t:'🧠 Big Brain, Small Timer', l:'It was not your memory, {name}. It was the clock\'s ego.'},
      {t:'🏔️ Almost at the Summit', l:'Mommy: "Rest, {name}. The mountain will still be there tomorrow."'},
      {t:'🎖️ Bomb Squad Veteran', l:'Retire with honour, {name}. Or try once more. We both know you will.'},
      {t:'🌪️ Chaos Survived, Mostly', l:'{name} outlasted the tricks. The tricks outlasted the timer.'},
      {t:'👑 King Without a Crown', l:'Not today\'s winner, {name}. Definitely tomorrow\'s problem.'},
      {t:'🥹 So Close It Hurts', l:'Mommy: "Come and eat, {name}. You did enough. I am watching, and I am proud."'}
    ];
    var WISDOM = [
      'Knowledge cancels fear. What you understand, you no longer dread.',
      'Grades measure how well you follow a system. Life measures what you do when no system is watching.',
      'Security is a good thing to have and a poor thing to worship.',
      'Money is a tool. The moment it starts giving orders, you have become the tool.',
      'Athens silenced Socrates. More than twenty-four centuries later, we are still asking his questions.',
      'Be careful with anyone who needs your obedience more than your understanding.',
      'Working hard matters. Knowing what you are working hard for matters more.',
      'A cage with a good salary is still a cage. Choose it with open eyes, or choose another.',
      'Comfort is a fine place to rest and a terrible place to live.',
      'You do not need permission to become greater. You need a decision, then a long stretch of ordinary days.',
      'Real life is messy, unfair and unclear. Nobody is coming with the answer key. Begin anyway.',
      'Everyone you admire once felt lost. The difference is that they kept walking while lost.',
      'Fear is often just an unread book about the thing in front of you.',
      'The loudest voices tell you what to want. The quiet ones ask what you value.',
      'Failure is not the opposite of success. It is the tuition.',
      'You are not late. You are on your own road, and no one else has walked it.',
      'Be kind to people who can do nothing for you. That is where character is tested.',
      'Most of what scares you is a story you have never checked.',
      'Learn for understanding, not for applause. Applause fades, understanding compounds.',
      'A free mind is built slowly: read, doubt, test, listen, then decide.',
      'The easiest people to control are the ones who never ask why.',
      'You can lose money and recover it. You can lose time and never get it back. Spend the second one carefully.',
      'Do not confuse being busy with being alive.',
      'Respect is earned by what you do in private, when nothing rewards you for it.',
      'Wisdom is not knowing everything. It is knowing what matters, and acting like it.'
    ];
    function f(s,o){ return String(s||'').replace(/\{(\w+)\}/g,function(_,k){ return o&&(k in o) ? o[k] : '{'+k+'}'; }); }
    function send(o){ try{ o.emonGame = 1; parent.postMessage(o,'*'); }catch(e){} }
    function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j = Math.floor(Math.random()*(i+1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function titleFor(n){ for(var i=0;i<TITLES.length;i++) if(n>=TITLES[i].min) return TITLES[i].title; return TITLES[TITLES.length-1].title; }
    var NAME = L.name || 'Player';

    var D = (L.data && typeof L.data==='object') ? L.data : {};
    D.best = Math.max(0, Math.floor(Number(D.best)||0));
    D.got = Array.isArray(D.got) ? D.got.filter(function(i){ return typeof i==='number' && i>=0 && i<WISDOM.length; }) : [];
    D.roast = typeof D.roast==='number' ? D.roast : -1;

    var grid = byId('g'), stage = byId('stage'), ov = byId('ov'), toastEl = byId('toast');
    var lvEl = byId('lv'), mvEl = byId('mv'), tmEl = byId('tm'), tkEl = byId('tk');

    var level = 1, cleared = 0, P = null, state = 'idle';
    var first = null, lock = false, moves = 0, mism = 0, matched = 0, remaining = 0, shufflesLeft = 0, gen = 0;
    var running = false, timerStarted = false, tId = null, tLast = 0, holdSet = {};
    var pz = byId('pz'); pz.textContent = L.paused;
    var prevHTML = null;

    function params(n){
      var pairs = [6,8,8,10,10,12,12,12][Math.min(n,8)-1];
      var time = pairs*5 + 5 - Math.max(0,n-8)*2; time = Math.max(time, pairs*3 + 5);
      var slack = Math.max(1.65, 2.1 - 0.05*(n-1));
      return {
        pairs: pairs, time: Math.round(time), target: Math.ceil(pairs*slack),
        swapEvery: n<3 ? 0 : (n===3 ? 5 : (n===4 ? 4 : 3)),
        shuffles: n<=4 ? 1 : 0,
        peek: Math.max(800, 2100 - (n-1)*150)
      };
    }
    function fmt(s){ s = Math.max(0, Math.ceil(s)); return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2); }
    function status(){
      send({type:'status', score:cleared, best:D.best, lib:D.best, label:titleFor(D.best) + ' IS ' + NAME});
    }
    function save(){ send({type:'save', data:D}); }
    function toast(msg){
      toastEl.textContent = msg; toastEl.style.display = 'block';
      clearTimeout(toast.t); toast.t = setTimeout(function(){ toastEl.style.display = 'none'; }, 1800);
    }
    function paint(){
      lvEl.textContent = L.gbLv+' '+level;
      mvEl.textContent = L.gbMoves+' '+moves+'/'+(P?P.target:0);
      tmEl.textContent = '💣 '+fmt(remaining);
      tmEl.className = (timerStarted && remaining <= 10) ? 'hot' : '';
      tkEl.textContent = (P && P.swapEvery) ? '🌀 '+(P.swapEvery - (mism % P.swapEvery)) : '';
    }

    // ---- timer (with holds so it pauses behind menus / when the game is hidden) ----
    function stopTimer(){ running = false; if(tId){ clearInterval(tId); tId = null; } }
    function anyHold(){ for(var k in holdSet) if(holdSet[k]) return true; return false; }
    function startTimer(){
      if(running || anyHold() || state !== 'play') return;
      running = true; tLast = performance.now(); tId = setInterval(tick, 100);
    }
    // Named holds: a menu, the window's pause button / panels, and a hidden page each stop the timer on their own.
    function setHold(name, on){
      holdSet[name] = !!on;
      if(anyHold()) stopTimer(); else if(timerStarted) startTimer();
    }
    function tick(){
      var now = performance.now(); remaining -= (now - tLast)/1000; tLast = now;
      if(remaining <= 0){ remaining = 0; paint(); onBoom(); return; }
      paint();
    }
    document.addEventListener('visibilitychange', function(){ setHold('hidden', document.hidden); });

    // ---- board ----
    function layout(count){
      var cols = count<=16 ? 4 : (count<=20 ? 5 : 6), rows = Math.ceil(count/cols), gap = 6;
      var W = stage.clientWidth - 8, H = stage.clientHeight - 8;
      var cs = Math.max(24, Math.floor(Math.min((W - gap*(cols-1))/cols, (H - gap*(rows-1))/rows)));
      grid.style.gridTemplateColumns = 'repeat('+cols+','+cs+'px)';
      grid.style.gridAutoRows = cs+'px'; grid.style.gap = gap+'px';
      grid.style.fontSize = Math.floor(cs*0.52)+'px';
    }
    function hideCard(c){ c.classList.remove('up'); c.textContent = '?'; }
    function showCard(c){ c.classList.add('up'); c.textContent = c.dataset.e; }
    function buildBoard(){
      grid.innerHTML = '';
      var faces = shuffle(poolFor(level)).slice(0, P.pairs), deck = shuffle(faces.concat(faces));
      deck.forEach(function(e){
        var b = document.createElement('button');
        b.className = 'c'; b.dataset.e = e; b.textContent = '?';
        b.onclick = function(){ flip(b); };
        grid.appendChild(b);
      });
      layout(deck.length);
    }
    function beginLevel(){
      gen++; P = params(level); cleared = level - 1;
      first = null; lock = true; moves = 0; mism = 0; matched = 0; timerStarted = false;
      remaining = P.time; shufflesLeft = P.shuffles; stopTimer();
      closeCard(); buildBoard(); paint(); status();
      state = 'peek';
      [].forEach.call(grid.children, showCard);
      toast('👀 '+L.gbMemorize);
      var g = gen;
      setTimeout(function(){
        if(g !== gen) return;
        [].forEach.call(grid.children, hideCard);
        state = 'play'; lock = false;
      }, P.peek);
    }
    function flip(b){
      if(state !== 'play' || lock || b.classList.contains('up') || b.classList.contains('done')) return;
      showCard(b);
      if(!timerStarted){ timerStarted = true; startTimer(); }
      if(!first){ first = b; return; }
      moves++;
      var a = first; first = null;
      if(a.dataset.e === b.dataset.e){
        a.classList.add('done'); b.classList.add('done'); matched++;
        paint();
        if(matched === P.pairs){ win(); return; }
        if(moves >= P.target){ fail('moves'); }
        return;
      }
      mism++; lock = true; paint();
      var g = gen;
      setTimeout(function(){
        if(g !== gen || state !== 'play') return;
        hideCard(a); hideCard(b); lock = false;
        if(moves >= P.target){ fail('moves'); return; }
        if(P.swapEvery && mism % P.swapEvery === 0) doSwap();
      }, 650);
    }
    function doSwap(){
      var list = [].filter.call(grid.children, function(c){ return !c.classList.contains('done') && !c.classList.contains('up'); });
      if(list.length < 2) return;
      shuffle(list);
      var a = list[0], b = list[1], an = a.nextSibling, bn = b.nextSibling;
      if(an === b) grid.insertBefore(b, a);
      else if(bn === a) grid.insertBefore(a, b);
      else { grid.insertBefore(a, bn); grid.insertBefore(b, an); }
      a.classList.add('swap'); b.classList.add('swap');
      setTimeout(function(){ a.classList.remove('swap'); b.classList.remove('swap'); }, 900);
      toast('🌀 '+L.gbSwapped);
    }
    function reshuffle(){
      var cards = [].filter.call(grid.children, function(c){ return !c.classList.contains('done'); });
      var vals = shuffle(cards.map(function(c){ return c.dataset.e; }));
      cards.forEach(function(c,i){
        c.dataset.e = vals[i]; hideCard(c); c.classList.add('swap');
        setTimeout(function(){ c.classList.remove('swap'); }, 900);
      });
      first = null; lock = false;
    }
    function onBoom(){
      if(state !== 'play') return;
      if(shufflesLeft > 0){
        shufflesLeft--; gen++; reshuffle();
        remaining = Math.round(P.time * 0.6); paint(); toast('💥 '+L.gbShuffled);
      } else fail('bomb');
    }

    // ---- cards (win / lose / intro / wisdom) ----
    function card(html){ ov.innerHTML = '<div class="card">'+html+'</div>'; ov.className = 'show center'; prevHTML = null; }
    function closeCard(){ if(modalOpen) closeModal(false); ov.className = ''; ov.innerHTML = ''; prevHTML = null; }
    // A "modal" (wisdom list, titles, restart question) sits on top of whatever card/board is showing and
    // pauses the bomb while it is open. Closing it puts the previous card back.
    var modalOpen = false, modalHeld = false, prevCls = '';
    function modal(html, cls){
      if(modalOpen) return;
      modalOpen = true;
      prevHTML = ov.className.indexOf('show') >= 0 ? ov.innerHTML : null; prevCls = ov.className;
      modalHeld = (state === 'play'); if(modalHeld) setHold('modal', true);
      ov.innerHTML = html; ov.className = 'show' + (cls ? ' '+cls : '');
    }
    function closeModal(restore){
      if(!modalOpen) return;
      modalOpen = false;
      if(restore !== false && prevHTML){ ov.innerHTML = prevHTML; ov.className = prevCls; }
      else { ov.className = ''; ov.innerHTML = ''; }
      prevHTML = null;
      if(modalHeld){ modalHeld = false; setHold('modal', false); }
    }
    function preview(n){
      var p = params(n), h = '<div class="pv">💣 '+f(L.gbTimeInfo,{s:p.time})+'<br>🎯 '+f(L.gbTargetInfo,{n:p.target});
      if(p.swapEvery) h += '<br>🌀 '+f(L.gbTrickInfo,{n:p.swapEvery});
      h += '<br>' + (p.shuffles ? '🔀 '+L.gbMercy : '☠️ '+L.gbNoMercy);
      if(n > 1 && setIdx(n) !== setIdx(n-1)) h += '<br>✨ '+L.gbNewSet;
      return h + '</div>';
    }
    function showIntro(){
      state = 'intro'; cleared = 0; level = 1; status(); paint();
      card('<div class="big">🧩💣</div><div class="ttl">'+f(L.gbLevel,{n:1})+'</div>'+preview(1)+'<button class="btn pri" data-act="start">'+L.gbStart+'</button>');
    }
    function quoteHTML(idx, isNew){
      return '<div class="quote">“'+WISDOM[idx]+'”</div><div class="qtag">'+(isNew ? '📜 '+L.gbNewWisdom : '📜 '+L.gbOldWisdom)+'</div>';
    }
    function win(){
      stopTimer(); state = 'won'; gen++;
      cleared = level; var left = Math.round(remaining), isNew = false;
      if(cleared > D.best) D.best = cleared;
      var unseen = [], i;
      for(i=0;i<WISDOM.length;i++) if(D.got.indexOf(i) < 0) unseen.push(i);
      var idx;
      if(unseen.length){ idx = unseen[Math.floor(Math.random()*unseen.length)]; D.got.push(idx); isNew = true; }
      else idx = Math.floor(Math.random()*WISDOM.length);
      save(); status(); paint();
      card('<div class="ttl">✅ '+f(L.gbCleared,{n:level})+'</div><div class="sub">'+f(L.gbStats,{m:moves,s:left})+'</div>'
        + quoteHTML(idx,isNew) + preview(level+1)
        + '<button class="btn pri" data-act="next">'+f(L.gbNext,{n:level+1})+' ▶</button>');
    }
    function fail(reason){
      if(state === 'lost') return;
      stopTimer(); state = 'lost'; gen++;
      var pool = cleared <= 1 ? ROAST_EARLY : (cleared <= 4 ? ROAST_MID : ROAST_LATE);
      var idx = Math.floor(Math.random()*pool.length);
      if(pool.length > 1 && idx === D.roast) idx = (idx+1) % pool.length;
      D.roast = idx;
      if(cleared > D.best) D.best = cleared;
      var r = pool[idx];
      save(); status();
      card('<div class="big">'+(reason==='bomb' ? '💥' : '🧨')+'</div>'
        + '<div class="why">'+(reason==='bomb' ? L.gbBoom : f(L.gbOutMoves,{n:P.target}))+'</div>'
        + '<div class="ttl warn">'+f(r.t,{name:NAME})+'</div><div class="sub">'+f(r.l,{name:NAME})+'</div>'
        + '<div class="sub dim">'+f(L.gbRunStats,{n:cleared,b:D.best})+' · '+titleFor(D.best)+'</div>'
        + '<button class="btn pri" data-act="again">'+L.gbTryAgain+'</button>');
    }
    function showWisdom(){
      var h = '<div class="ovh"><b>📜 '+L.gbWisdom+' '+D.got.length+'/'+WISDOM.length+'</b><button class="x" data-act="mclose">×</button></div><div class="rows">';
      if(!D.got.length) h += '<div class="empty">'+L.gbWisEmpty+'</div>';
      D.got.slice().reverse().forEach(function(i){ h += '<div class="wq">“'+WISDOM[i]+'”</div>'; });
      modal(h + '</div>');
    }
    function showTiers(){
      var cur = titleFor(D.best);
      var h = '<div class="ovh"><b>'+L.gbTiers+'</b><button class="x" data-act="mclose">×</button></div><div class="rows">';
      TITLES.forEach(function(t){ h += '<div class="row'+(t.title===cur?' you':'')+'"><span class="nm">'+t.title+'</span><span class="mn">'+t.min+'+</span></div>'; });
      modal(h + '</div>');
    }
    function askRestart(){
      modal('<div class="card"><div class="ttl">'+L.gbRestartAsk+'</div><button class="btn pri" data-act="yes">'+L.gbYes+'</button> <button class="btn" data-act="mclose">'+L.gbNo+'</button></div>', 'center');
    }
    ov.addEventListener('click', function(e){
      var b = e.target.closest('[data-act]'); if(!b) return;
      var act = b.getAttribute('data-act');
      if(act === 'start'){ level = 1; beginLevel(); }
      else if(act === 'next'){ level++; beginLevel(); }
      else if(act === 'again'){ level = 1; beginLevel(); }
      else if(act === 'mclose'){ closeModal(); }
      else if(act === 'yes'){ closeModal(false); level = 1; beginLevel(); }
    });
    byId('wis').onclick = showWisdom;
    byId('r').onclick = function(){ if(state === 'play' || state === 'peek') askRestart(); else if(state === 'lost' || state === 'won' || state === 'intro') { /* card already offers next steps */ } };
    window.addEventListener('message', function(e){
      var d = e.data; if(!d || d.emonGame !== 1) return;
      if(d.type === 'tiers') showTiers();
      else if(d.type === 'pause'){ setHold('host', true); pz.classList.add('show'); }
      else if(d.type === 'resume'){ setHold('host', false); pz.classList.remove('show'); }
      else if(d.type === 'reset' && d.what === 'best'){ D.best = 0; save(); status(); }
    });
    window.addEventListener('resize', function(){ if(grid.children.length) layout(grid.children.length); });
    window.addEventListener('pagehide', save);
    showIntro();
  }

  const GAME_BASE_CSS = 'html,body{margin:0;height:100%;background:#070a10;color:#fff;font-family:system-ui,sans-serif;overflow:hidden}'
    + 'body{position:relative;display:flex;flex-direction:column}button{font-family:inherit}'
    + '#ov{position:absolute;inset:0;display:none;flex-direction:column;background:#070a10f4;padding:8px;box-sizing:border-box;z-index:5}'
    + '#ov.show{display:flex}#ov.center{justify-content:center;align-items:center;background:#070a10ee}'
    + '.ovh{display:flex;align-items:center;gap:8px;margin-bottom:6px}.ovh b{flex:1;font-size:14px}.pbig{font-size:13px;color:#fde68a}'
    + '.x{border:1px solid #ffffff20;background:#ffffff10;color:#fff;border-radius:9px;width:30px;height:30px;font-size:15px}'
    + '.rows{flex:1;min-height:0;overflow-y:auto;touch-action:pan-y;border:1px solid #ffffff14;border-radius:10px;padding:4px;width:100%;box-sizing:border-box}'
    + '.row{display:flex;align-items:center;gap:8px;padding:6px;border-radius:8px}.row.you{background:#8b5cf62e}'
    + '.row .nm{flex:1;min-width:0;font-size:12.5px}.row .mn{font-size:11px;opacity:.6}'
    + '.row button,.btn,.tab{border:1px solid #ffffff20;background:#ffffff10;color:#fff;border-radius:9px;padding:0 10px;height:30px;font-size:12px;white-space:nowrap}'
    + '.btn{height:36px;font-size:13px;padding:0 16px}.btn.pri,.row button.buy,.tab.on{background:#8b5cf6;border-color:#a78bfa}'
    + '.row button.dis{opacity:.4}.row button.eq{background:#1f5f46;border-color:#2f7f61}'
    + '.tabs{display:flex;gap:5px;margin-bottom:6px}.tab{flex:1;padding:0 4px}.tag{font-size:10.5px;opacity:.6;margin-bottom:6px}'
    + '#toast{position:absolute;left:50%;bottom:52px;transform:translateX(-50%);background:#000d;padding:6px 12px;border-radius:9px;font-size:12px;display:none;z-index:9;max-width:90%;text-align:center}'
    + '#pz{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:#070a10f2;font-size:20px;font-weight:700;letter-spacing:.04em;z-index:8}#pz.show{display:flex}'
    + '.card{max-height:100%;overflow-y:auto;touch-action:pan-y;text-align:center;padding:6px 10px;box-sizing:border-box;width:100%}';
  const SNAKE_CSS = '#top{flex:none;height:38px;display:flex;align-items:center;justify-content:space-between;padding:0 8px;box-sizing:border-box}'
    + '#pill{font-size:12.5px;color:#fde68a;background:#ffffff0d;border:1px solid #ffffff18;border-radius:999px;padding:4px 11px}'
    + '#shop{height:30px;border-radius:9px;border:1px solid #ffffff20;background:#ffffff10;color:#fff;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 11px;font-size:12px}'
    + '#wrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}'
    + 'canvas{display:block;touch-action:none;border-radius:8px}'
    + '#pad{flex:none;height:58px;display:none;gap:8px;padding:6px 8px 8px;box-sizing:border-box}'
    + '#pad button{flex:1;border:1px solid #ffffff22;background:#ffffff12;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;touch-action:none;padding:0}'
    + '#pad button:active{background:#8b5cf666}'
    + '.body{flex:1;min-height:0;overflow-y:auto;touch-action:pan-y}'
    + '.sec{margin-bottom:14px}.lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.6;margin-bottom:6px}'
    + '.seg{display:flex;border:1px solid #ffffff22;border-radius:11px;overflow:hidden}'
    + '.seg button{flex:1;height:36px;border:0;background:transparent;color:#ffffffb8;font-size:12.5px;padding:0 4px}'
    + '.seg button+button{border-left:1px solid #ffffff18}.seg button.on{background:#8b5cf6;color:#fff;font-weight:700}'
    + '.hint{font-size:11px;opacity:.6;margin-top:6px;line-height:1.4}'
    + '.storebtn{display:flex;justify-content:space-between;align-items:center;width:100%;height:44px}'
    + '.pv{width:64px;height:18px;flex:none}.pve{font-size:22px;width:64px;text-align:center;flex:none}.pvb{width:64px;height:18px;border-radius:5px;flex:none;border:1px solid #ffffff22}';
  const BOMB_CSS = '#top{flex:none;height:34px;display:flex;align-items:center;gap:9px;padding:0 6px;font-size:12px;white-space:nowrap}#top .sp{flex:1}'
    + '#top button{border:1px solid #ffffff22;background:#ffffff12;color:#fff;border-radius:9px;width:32px;height:26px;font-size:14px;padding:0}'
    + '#tm.hot{color:#f87171;font-weight:800;animation:pl .6s infinite}@keyframes pl{50%{opacity:.35}}'
    + '#stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}#g{display:grid}'
    + '.c{border:1px solid #ffffff18;border-radius:10px;background:#1a2233;color:#ffffff55;padding:0;line-height:1}'
    + '.c.up{background:#2b3552;color:#fff}.c.done{background:#1f5f46;color:#fff;opacity:.85}'
    + '.c.swap{animation:sw .9s;box-shadow:0 0 0 2px #fbbf24}@keyframes sw{30%{transform:scale(1.15) rotate(-4deg)}}'
    + '.big{font-size:34px}.ttl{font-size:17px;font-weight:800;margin:4px 0}.ttl.warn{color:#fbbf24}.why{font-size:12px;opacity:.75}'
    + '.sub{font-size:12px;opacity:.85;line-height:1.45;margin:4px 0 8px}.sub.dim{opacity:.55;font-size:11px}'
    + '.pv{font-size:11.5px;line-height:1.6;opacity:.85;margin:6px 0 10px}'
    + '.quote{font-size:13px;line-height:1.5;font-style:italic;background:#ffffff0d;border:1px solid #ffffff18;border-radius:12px;padding:10px 12px;margin:8px 0 4px}'
    + '.qtag{font-size:10.5px;opacity:.6;margin-bottom:8px}.wq{font-size:12.5px;line-height:1.45;font-style:italic;padding:8px;border-bottom:1px solid #ffffff10}'
    + '.empty{font-size:12px;opacity:.55;padding:14px;text-align:center}';

  function catalog(keys){
    const ph = {n:'{n}', s:'{s}', m:'{m}', b:'{b}'}, o = {};
    keys.forEach(k=>{ o[k] = t('runtime.'+k, ph); });
    return o;
  }
  const SNAKE_KEYS = ['gsShop','gsSettings','gsMode','gsControls','gsCtrlGesture','gsCtrlPad','gsWorld','gsEasy','gsMedium','gsExtreme','gsStore','gsTabSkin','gsTabFood','gsTabBoard','gsStoreTag','gsBuy','gsEquip','gsEquipped','gsNoPoints','gsBought','gsNewBest','gsEarned','gsTiers','gsLocked','gsInfoEasy','gsInfoMedium','gsInfoExtreme','gsMult'];
  const BOMB_KEYS = ['gbNewSet','gbLv','gbLevel','gbMoves','gbStart','gbMemorize','gbTimeInfo','gbTargetInfo','gbTrickInfo','gbMercy','gbNoMercy','gbCleared','gbStats','gbNewWisdom','gbOldWisdom','gbNext','gbBoom','gbOutMoves','gbTryAgain','gbRunStats','gbShuffled','gbSwapped','gbWisdom','gbWisEmpty','gbRestartAsk','gbYes','gbNo','gbTiers'];
  function buildBuiltinDoc(g){
    const L = Object.assign({
      tap: t('runtime.gameTapStart'), gameTapStart: t('runtime.gameTapStart'), gameOver: t('runtime.gameOver'), gameTapRestart: t('runtime.gameTapRestart'), paused: t('runtime.gamePaused'),
      name: getGameName(), data: getBuiltinData(g.id)
    }, catalog(g.keys));
    const json = JSON.stringify(L).replace(/</g, '\\u003c');
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'
      + GAME_BASE_CSS + g.css + '</style></head><body>' + g.body + '<div id="pz"></div><div id="toast"></div>'
      + '<script>(' + g.fn.toString() + ')(' + json + ');<\/script></body></html>';
  }
  const BUILTIN_GAMES = [
    { id:'snake', emoji:'🐍', name:'Snake', needsName:true, pausable:true, fn:snakeGame, css:SNAKE_CSS, keys:SNAKE_KEYS,
      body:'<div id="top"><span id="pill">★ <b id="pts"></b></span><button id="shop" aria-label="Shop"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span></span></button></div><div id="wrap"><canvas id="c"></canvas></div><div id="pad"></div><div id="ov"></div>' },
    { id:'bomb', emoji:'💣', name:'Memory Bomb', needsName:true, pausable:true, fn:bombGame, css:BOMB_CSS, keys:BOMB_KEYS,
      body:'<div id="top"><span id="lv"></span><span id="mv"></span><span id="tm"></span><span id="tk"></span><span class="sp"></span><button id="wis" aria-label="Wisdom">📜</button><button id="r" aria-label="Restart">↻</button></div><div id="stage"><div id="g"></div></div><div id="ov"></div>' },
  ];

  // ---------- storage helpers ----------
  function getUserGames(){
    try{
      const v = tavo.get(GAMES_VAR, 'global');
      return Array.isArray(v) ? v.filter(g=>g && typeof g.id==='string' && typeof g.file==='string') : [];
    }catch{ return []; }
  }
  function setUserGames(list){ try{ tavo.set(GAMES_VAR, list, 'global'); }catch{} }
  const GAME_DATA_VAR = 'emonImageViewerGameData';
  function getBuiltinAll(){ try{ const v = tavo.get(GAME_DATA_VAR, 'global'); return v && typeof v==='object' ? v : {}; }catch{ return {}; } }
  function getBuiltinData(id){ const v = getBuiltinAll()[id]; return v && typeof v==='object' ? v : null; }
  function setBuiltinData(id, data){
    const all = getBuiltinAll(); all[id] = data;
    try{ tavo.set(GAME_DATA_VAR, all, 'global'); }catch{}
  }
  function setBestDirect(id, v){
    const b = getBests(); b[id] = v;
    try{ tavo.set(GAME_BESTS_VAR, b, 'global'); }catch{}
  }
  function getActiveGameId(){ try{ return String(tavo.get(GAME_ACTIVE_VAR, 'global') || 'jump'); }catch{ return 'jump'; } }
  function setActiveGameId(id){ try{ tavo.set(GAME_ACTIVE_VAR, id, 'global'); }catch{} }
  function getBests(){ try{ const v = tavo.get(GAME_BESTS_VAR, 'global'); return v && typeof v==='object' ? v : {}; }catch{ return {}; } }
  function saveBest(id, score, low){
    const b = getBests(), cur = b[id];
    if(cur===undefined || cur===null || (low ? score<cur : score>cur)){
      b[id] = score;
      try{ tavo.set(GAME_BESTS_VAR, b, 'global'); }catch{}
    }
    return b[id];
  }
  function saveGameWinRect(rect){
    const prev = getGameWinRect() || {};
    const ih = (gameMode === 'custom')
      ? gameFrameBaseH
      : (gameFrame && gameFrame.offsetHeight ? gameFrame.offsetHeight : prev.ih);
    setGameWinRect({x:rect.left, y:rect.top, w:rect.width, ch: gameCanvas?gameCanvas.height:GAME_DEFAULT_H, ih:ih||GAME_FRAME_DEFAULT_H});
  }

  (function migrateOldMemory(){
    try{
      const b = getBests();
      if('memory' in b){ delete b.memory; tavo.set(GAME_BESTS_VAR, b, 'global'); }
    }catch{}
  })();

  function allGames(){
    const list = [{ id:'jump', emoji:'🏃', name:t('runtime.gameTitle'), builtin:true, jump:true }];
    BUILTIN_GAMES.forEach(g=>list.push({ id:g.id, emoji:g.emoji, name:g.name, builtin:true, builtinDef:g, needsName:!!g.needsName, pausable:!!g.pausable }));
    getUserGames().forEach(g=>list.push({ id:g.id, emoji:g.emoji||'🎮', name:g.name||'Game', file:g.file }));
    return list;
  }
  function findGame(id){ return allGames().find(g=>g.id===id) || null; }

  // ---------- running a game ----------
  // Snake's on-screen D-pad (58px, matches SNAKE_CSS #pad) used to eat into the board's own space when
  // switched on, shrinking the board. Now the host frame grows/shrinks by that same amount instead,
  // so the board itself stays the same size no matter which control scheme is picked.
  const GAME_PAD_EXTRA_H = 58;
  let gamePadHeightApplied = 0;
  // The board's own (pad-free) height, as the user actually chose it - by saved size or by dragging the
  // resize corner. This is always what gets written to disk; the pad's extra room is layered on top of it
  // live and is never itself persisted, so switching controls repeatedly can no longer make the window grow.
  let gameFrameBaseH = GAME_FRAME_DEFAULT_H;
  function unloadGameFrame(){
    if(gameFrame) gameFrame.srcdoc = '<!doctype html><body style="background:#070a10">';
    gamePadHeightApplied = 0;
  }
  // Games you add run with no network access at all (a Content-Security-Policy is placed first in the page, so
  // the game cannot remove it or loosen it). On top of the sandbox this means a game file someone hands you
  // cannot phone home, load outside scripts, show remote content or reveal your IP address.
  const GAME_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'";
  const GAME_CSP_META = '<meta http-equiv="Content-Security-Policy" content="' + GAME_CSP + '">';
  function withBaseDoc(html){
    const m = html.match(/^\s*<!doctype[^>]*>/i);
    if(m) return m[0] + GAME_CSP_META + html.slice(m[0].length);
    return '<!doctype html>' + GAME_CSP_META + '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}</style>' + html;
  }
  function showCustomBest(){
    const b = getBests()[activeGameId];
    if(gameBestEl) gameBestEl.textContent = (b===undefined||b===null) ? '—' : String(b);
  }
  async function loadGameHtml(g){
    if(g.builtinDef) return buildBuiltinDoc(g.builtinDef);
    const txt = await tavo.file.load(g.file, {scope:'global', encoding:'utf8'});
    if(typeof txt !== 'string' || !txt) throw new Error('empty game file');
    return withBaseDoc(txt);
  }
  function postToFrame(msg){
    try{
      if(gameFrame && gameFrame.contentWindow){
        msg.emonGame = 1;
        gameFrame.contentWindow.postMessage(msg, '*');
      }
    }catch{}
  }
  async function activateGame(id){
    if(!gameEl) return;
    const g = findGame(id) || findGame('jump');
    if(gameMode==='jump' && gs) persistRunSnapshot();
    const myToken = ++gameLoadToken;
    activeGameId = g.id;
    setActiveGameId(g.id);
    if(gameNameEl) gameNameEl.textContent = g.name;
    userPaused = false; framePausedSent = false; frameSettings = null; gamePadHeightApplied = 0;
    gameFrameBaseH = GAME_FRAME_DEFAULT_H;
    closeSettingsPanel(true);
    if(gamePauseBtn){ gamePauseBtn.textContent = '⏸️'; gamePauseBtn.style.display = (g.jump || g.pausable) ? '' : 'none'; }
    if(g.jump){
      gameMode = 'jump';
      gameEl.dataset.mode = 'jump';
      unloadGameFrame();
      startJump();
      return;
    }
    gameMode = 'custom';
    gameEl.dataset.mode = 'custom';
    stopJump();
    if(gameNameGate) gameNameGate.classList.remove('show');
    if(g.needsName){
      gamePlayerName = getGameName();
      if(!gamePlayerName){
        // built-in games use the same player name as the Jump Game
        if(gameNameGate) gameNameGate.classList.add('show');
        unloadGameFrame();
        if(gameScoreEl) gameScoreEl.textContent = '0';
        showCustomBest();
        return;
      }
    }
    if(gameScoreEl) gameScoreEl.textContent = '0';
    showCustomBest();
    const rect = getGameWinRect();
    gameFrameBaseH = Math.max(180, Math.min(560, (rect && rect.ih) || GAME_FRAME_DEFAULT_H));
    if(gameFrame) gameFrame.style.height = gameFrameBaseH + 'px';
    try{
      const html = await loadGameHtml(g);
      if(myToken !== gameLoadToken || activeGameId !== g.id || !gameEl.classList.contains('open')) return; // switched or closed while loading
      gameFrame.srcdoc = html;
    }catch(e){
      if(myToken !== gameLoadToken) return;
      tavo.utils.toast(t('runtime.gameLoadFailed'));
      unloadGameFrame();
    }
  }
  function refreshGameUI(){
    const g = findGame(activeGameId) || findGame('jump');
    if(gameNameEl && g) gameNameEl.textContent = g.name;
    if(gameLibEl && gameLibEl.classList.contains('show')) renderGameLib();
    if(gameSetEl && gameSetEl.classList.contains('show')) renderSettingsPanel();
  }

  winOn('message', e=>{
    if(!gameFrame || gameMode!=='custom' || e.source !== gameFrame.contentWindow) return;
    const d = e.data;
    if(!d || d.emonGame !== 1) return;
    const g = findGame(activeGameId);
    if(d.type === 'settings'){
      frameSettings = sanitizeSettings(d);
      if(gameSetEl && gameSetEl.classList.contains('show')) renderSettingsPanel();
      return;
    }
    if(d.type === 'padHeight'){
      const want = d.on ? GAME_PAD_EXTRA_H : 0;
      if(want !== gamePadHeightApplied && gameFrame){
        gameFrame.style.height = Math.max(180, Math.min(560, gameFrameBaseH + want)) + 'px';
        gamePadHeightApplied = want;
      }
      return;
    }
    if(d.type === 'save'){
      // only built-in games may keep progress; keep it small and plain
      if(g && g.builtinDef && d.data && typeof d.data === 'object'){
        let ok = false;
        try{ ok = JSON.stringify(d.data).length < 30000; }catch{}
        if(ok) setBuiltinData(g.id, d.data);
      }
      return;
    }
    const sc = Math.floor(Number(d.score));
    if(!Number.isFinite(sc)) return;
    if(gameScoreEl) gameScoreEl.textContent = String(sc);
    if(d.type === 'status'){
      // built-in games report their own best and a title line, shown like the Jump Game's
      const best = Math.floor(Number(d.best));
      if(Number.isFinite(best) && gameBestEl){
        const label = typeof d.label === 'string' ? d.label.slice(0,80) : '';
        gameBestEl.textContent = label ? best + ' · ' + label : String(best);
      }
      const lib = Math.floor(Number(d.lib));
      if(Number.isFinite(lib)) setBestDirect(activeGameId, lib);
      return;
    }
    if(d.type==='gameover' || (d.type==='score' && !d.low)){
      saveBest(activeGameId, sc, !!d.low);
      showCustomBest();
    }
  });

  // ---------- library window ----------
  function openGameLib(){
    if(!gameLibEl) return;
    if(gameMode==='jump' && gs && gs.started && gs.alive && !gamePaused) togglePauseGame();
    closeGameTiers();
    closeSettingsPanel(true);
    gameLibEl.classList.add('show');
    refreshLibOpen();
    gameAddForm.classList.remove('show');
    renderGameLib();
    syncFramePause();
  }
  function closeGameLib(){
    if(!gameLibEl) return;
    gameLibEl.classList.remove('show');
    refreshLibOpen();
    syncFramePause();
  }
  function renderGameLib(){
    if(!gameLibList) return;
    const bests = getBests();
    gameLibList.innerHTML = allGames().map(g=>{
      let best;
      if(g.jump) best = getGameBest() || null;
      else best = bests[g.id];
      const tag = g.builtin ? t('runtime.gameBuiltIn') : t('runtime.gameYours');
      const bestTxt = (best===undefined||best===null) ? '' : ' · ' + t('runtime.gameBestShort', {n:best});
      return '<div class="glrow'+(g.id===activeGameId?' active':'')+'" data-id="'+esc(g.id)+'">'
        + '<span class="lemo">'+esc(g.emoji)+'</span>'
        + '<div class="lmeta"><b>'+esc(g.name)+'</b><small>'+esc(tag+bestTxt)+'</small></div>'
        + '<button data-act="play" title="'+esc(t('runtime.gamePlay'))+'">▶</button>'
        + (g.builtin ? '' : '<button data-act="del" title="'+esc(t('runtime.gameDelete'))+'">🗑</button>')
        + '</div>';
    }).join('');
    gameLibList.querySelectorAll('.glrow').forEach(row=>{
      const id = row.dataset.id;
      row.querySelector('[data-act="play"]').onclick = ()=>{ closeGameLib(); activateGame(id); };
      const del = row.querySelector('[data-act="del"]');
      if(del) del.onclick = ()=>deleteUserGame(id);
    });
  }
  async function deleteUserGame(id){
    const list = getUserGames(), g = list.find(x=>x.id===id);
    if(!g) return;
    const ok = typeof confirm === 'function' ? confirm(t('runtime.gameConfirmDelete', {name:g.name})) : true;
    if(!ok) return;
    try{ await tavo.file.delete(g.file, {scope:'global'}); }catch{}
    setUserGames(list.filter(x=>x.id!==id));
    const b = getBests();
    if(id in b){ delete b[id]; try{ tavo.set(GAME_BESTS_VAR, b, 'global'); }catch{} }
    if(activeGameId===id){ activeGameId = 'jump'; setActiveGameId('jump'); if(gameNameEl) gameNameEl.textContent = t('runtime.gameTitle'); gameMode='jump'; gameEl.dataset.mode='jump'; unloadGameFrame(); startJump(); }
    tavo.utils.toast(t('runtime.gameDeleted'));
    renderGameLib();
  }

  // ---------- adding a game ----------
  function cleanPastedCode(raw){
    let c = String(raw||'').trim();
    const fence = c.match(/^```[a-zA-Z0-9]*\s*\n([\s\S]*?)\n?```\s*$/);
    if(fence) c = fence[1].trim();
    return c;
  }
  function resetAddForm(){
    gameAddName.value = ''; gameAddEmoji.value = ''; gameAddCode.value = '';
    gameAddForm.classList.remove('show');
  }
  async function saveNewGame(){
    const name = String(gameAddName.value||'').trim().slice(0,24);
    const emoji = String(gameAddEmoji.value||'').trim() || '🎮';
    const code = cleanPastedCode(gameAddCode.value);
    if(!name){ tavo.utils.toast(t('runtime.gameNeedName')); return; }
    if(!code){ tavo.utils.toast(t('runtime.gameNeedCode')); return; }
    if(code.indexOf('<') === -1){ tavo.utils.toast(t('runtime.gameNotHtml')); return; }
    if(code.length > GAME_MAX_CHARS){ tavo.utils.toast(t('runtime.gameTooBig')); return; }
    const list = getUserGames();
    if(list.length >= GAMES_MAX){ tavo.utils.toast(t('runtime.gameLimit')); return; }
    const id = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
    const file = 'emon-game-' + id + '.html';
    try{
      await tavo.file.save(file, code, {scope:'global', encoding:'utf8'});
    }catch(e){ tavo.utils.toast(t('runtime.error')); return; }
    list.push({ id, name, emoji, file });
    setUserGames(list);
    tavo.utils.toast(t('runtime.gameSaved', {name}));
    resetAddForm();
    renderGameLib();
  }
  async function importGameFile(){
    try{
      const files = await tavo.file.import({ scope:'global', extensions:['html','htm'], conflict:'rename' });
      const f = files && files[0];
      if(!f) return;
      const text = await tavo.file.load(f.path, {encoding:'utf8'});
      try{ await tavo.file.delete(f.path); }catch{}
      gameAddCode.value = typeof text === 'string' ? text : '';
      if(!gameAddName.value.trim()) gameAddName.value = String(f.originalName||'').replace(/\.[^.]+$/, '').slice(0,24);
    }catch(e){ tavo.utils.toast(t('runtime.error')); }
  }
  async function copyAiPrompt(){
    try{
      await navigator.clipboard.writeText(t('runtime.gameAiPrompt'));
      tavo.utils.toast(t('runtime.gameAiPromptCopied'));
    }catch(e){ tavo.utils.toast(t('runtime.error')); }
  }

  // ---------- ⚙ game settings panel: one place for every game ----------
  // Sections: Player (the name is shared by all games) · This game (its options + its own resets) · All games (reset everything).
  // Built-in games declare their options with {type:'settings'} and the panel sends {type:'set'} back.
  const gameSetEl = byId('emon-iv-game-set');
  const gameSetClose = byId('emon-iv-game-set-close');
  const setPlayerEl = byId('emon-iv-set-player');
  const setItemsEl = byId('emon-iv-set-items');
  const setJumpEl = byId('emon-iv-set-jump');
  const setResetsEl = byId('emon-iv-set-resets');
  const setAllEl = byId('emon-iv-set-all');
  const setConfirmEl = byId('emon-iv-set-confirm');
  let frameSettings = null, pendingYes = null, userPaused = false, framePausedSent = false;

  function refreshLibOpen(){
    gameEl.classList.toggle('libopen', gameLibEl.classList.contains('show') || gameSetEl.classList.contains('show'));
  }
  function syncFramePause(){
    if(gameMode !== 'custom'){ framePausedSent = false; return; }
    const want = userPaused || gameLibEl.classList.contains('show') || gameSetEl.classList.contains('show');
    if(want !== framePausedSent){ framePausedSent = want; postToFrame({type: want ? 'pause' : 'resume'}); }
  }
  if(gameFrame) gameFrame.addEventListener('load', ()=>{ framePausedSent = false; if(gameMode==='custom') syncFramePause(); });
  function toggleFramePause(){
    userPaused = !userPaused;
    if(gamePauseBtn) gamePauseBtn.textContent = userPaused ? '▶️' : '⏸️';
    syncFramePause();
  }
  if(gamePauseBtn) gamePauseBtn.onclick = ()=>{ if(gameMode==='jump') togglePauseGame(); else toggleFramePause(); };

  function sanitizeSettings(d){
    const str = (v,n)=>String(v==null ? '' : v).slice(0,n);
    if(!Array.isArray(d.items)) return null;
    const items = [];
    d.items.slice(0,6).forEach(it=>{
      if(!it || typeof it !== 'object' || !Array.isArray(it.options)) return;
      const options = it.options.slice(0,6).map(o=>({v:str(o&&o.v,24), t:str(o&&o.t,24)})).filter(o=>o.v && o.t);
      if(!options.length) return;
      items.push({ id:str(it.id,24), label:str(it.label,40), value:str(it.value,24), locked:!!it.locked, note:str(it.note,90), hint:str(it.hint,140), options });
    });
    return { gameId: activeGameId, items };
  }

  function hideConfirm(){
    pendingYes = null;
    if(setConfirmEl){ setConfirmEl.classList.remove('show'); setConfirmEl.innerHTML = ''; }
  }
  function askConfirm(text, onYes){
    if(!setConfirmEl){ if(typeof confirm !== 'function' || confirm(text)) onYes(); return; }
    pendingYes = onYes;
    setConfirmEl.innerHTML = '<div>'+esc(text)+'</div><div class="gbtnrow"><button class="gbtn danger" data-sact="yes">'+esc(t('runtime.gameYes'))+'</button><button class="gbtn" data-sact="no">'+esc(t('runtime.gameNo'))+'</button></div>';
    setConfirmEl.classList.add('show');
    try{ setConfirmEl.scrollIntoView({block:'nearest'}); }catch{}
  }

  function renderSettingsPanel(){
    if(!gameSetEl) return;
    const g = findGame(activeGameId) || findGame('jump');
    // Player
    const keep = byId('emon-iv-set-name');
    const typed = keep && document.activeElement === keep ? keep.value : getGameName();
    setPlayerEl.innerHTML = '<div class="glbl">'+esc(t('runtime.gamePlayerSection'))+'</div>'
      + '<div class="gnamerow"><input id="emon-iv-set-name" maxlength="16" value="'+esc(typed)+'" placeholder="'+esc(t('runtime.gameNamePlaceholder'))+'" />'
      + '<button class="gbtn pri" data-sact="saveName">'+esc(t('runtime.gameNameSaveBtn'))+'</button></div>'
      + '<div class="ghint2">'+esc(t('runtime.gamePlayerHint'))+'</div>';
    // This game: options declared by the game itself
    let h = '<div class="glbl">'+esc(t('runtime.gameThisGame'))+' · '+esc(g.name)+'</div>';
    if(g.jump){ /* the Jump Game's own controls live in the block below */ }
    else if(frameSettings && frameSettings.gameId === g.id){
      frameSettings.items.forEach(it=>{
        h += '<div class="gilbl">'+esc(it.label)+'</div><div class="gseg'+(it.locked?' locked':'')+'">'
          + it.options.map(o=>'<button class="'+(o.v===it.value?'on':'')+'" data-sact="set" data-id="'+esc(it.id)+'" data-v="'+esc(o.v)+'">'+esc(o.t)+'</button>').join('')+'</div>';
        if(it.locked && it.note) h += '<div class="ghint2 warn">'+esc(it.note)+'</div>';
        else if(it.hint) h += '<div class="ghint2">'+esc(it.hint)+'</div>';
      });
    }
    setItemsEl.innerHTML = h;
    setJumpEl.style.display = g.jump ? '' : 'none';
    // This game: resets
    if(g.jump){
      setResetsEl.innerHTML = '';
    } else {
      setResetsEl.innerHTML = '<div class="gbtnrow"><button class="gbtn" data-sact="askBest">'+esc(t('runtime.gameResetBestG'))+'</button>'
        + (g.builtinDef ? '<button class="gbtn danger" data-sact="askProgress">'+esc(t('runtime.gameResetProgressG'))+'</button>' : '') + '</div>';
    }
    // All games
    setAllEl.innerHTML = '<div class="glbl">'+esc(t('runtime.gameAllSection'))+'</div>'
      + '<button class="gbtn danger" data-sact="askAll" style="width:100%">'+esc(t('runtime.gameResetAll'))+'</button>'
      + '<div class="ghint2">'+esc(t('runtime.gameResetAllWarn'))+'</div>';
  }

  function openSettingsPanel(){
    if(!gameSetEl) return;
    closeGameTiers();
    gameLibEl.classList.remove('show');
    if(gameMode==='jump' && gs && gs.started && gs.alive && !gamePaused) togglePauseGame();
    hideConfirm();
    gameSetEl.classList.add('show');
    refreshLibOpen();
    if(gameMode === 'custom') postToFrame({type:'settings?'});
    renderSettingsPanel();
    syncFramePause();
  }
  function closeSettingsPanel(silent){
    if(!gameSetEl) return;
    gameSetEl.classList.remove('show');
    hideConfirm();
    refreshLibOpen();
    if(!silent) syncFramePause();
  }

  function resetGameBest(g){
    if(g.jump){ gameBest = 0; setGameBest(0); }
    else {
      const b = getBests(); delete b[g.id];
      try{ tavo.set(GAME_BESTS_VAR, b, 'global'); }catch{}
      if(g.builtinDef) postToFrame({type:'reset', what:'best'});
      showCustomBest();
    }
    tavo.utils.toast(t('runtime.gameBestReset'));
  }
  function resetGameProgress(g){
    if(g.builtinDef){
      const all = getBuiltinAll(); delete all[g.id];
      try{ tavo.set(GAME_DATA_VAR, all, 'global'); }catch{}
    }
    const b = getBests(); delete b[g.id];
    try{ tavo.set(GAME_BESTS_VAR, b, 'global'); }catch{}
    tavo.utils.toast(t('runtime.gameProgressDone'));
    closeSettingsPanel();
    activateGame(g.id);
  }
  function resetEverything(){
    clearGameSavedRun(); gameBest = 0; setGameBest(0);
    try{ tavo.set(GAME_DATA_VAR, null, 'global'); tavo.set(GAME_BESTS_VAR, null, 'global'); }catch{}
    setGameName(''); gamePlayerName = '';
    frameSettings = null;
    if(gs){ gs.started = false; } // a finished reset must not re-save the run we just cleared
    tavo.utils.toast(t('runtime.gameAllDone'));
    closeSettingsPanel();
    activateGame(activeGameId);
  }
  function saveNameFromPanel(){
    const inp = byId('emon-iv-set-name');
    const v = String((inp && inp.value) || '').trim().slice(0,16);
    if(!v){ tavo.utils.toast(t('runtime.gameNameEnter')); return; }
    setGameName(v); gamePlayerName = v;
    tavo.utils.toast(t('runtime.gameNameSaved', {name:v}));
    const g = findGame(activeGameId);
    if(g && g.needsName){ closeSettingsPanel(); activateGame(activeGameId); }
  }

  if(gameSetEl) gameSetEl.addEventListener('click', e=>{
    const b = e.target.closest('[data-sact]'); if(!b) return;
    const act = b.getAttribute('data-sact');
    const g = findGame(activeGameId) || findGame('jump');
    if(act === 'saveName') saveNameFromPanel();
    else if(act === 'set') postToFrame({type:'set', id:b.getAttribute('data-id'), value:b.getAttribute('data-v')});
    else if(act === 'askBest') askConfirm(t('runtime.gameConfirmBest', {name:g.name}), ()=>resetGameBest(g));
    else if(act === 'askProgress') askConfirm(t('runtime.gameConfirmProgress', {name:g.name}), ()=>resetGameProgress(g));
    else if(act === 'askAll') askConfirm(t('runtime.gameConfirmAll'), resetEverything);
    else if(act === 'yes'){ const fn = pendingYes; hideConfirm(); if(fn) fn(); }
    else if(act === 'no') hideConfirm();
  });
  if(gameSetClose) gameSetClose.onclick = ()=>closeSettingsPanel();
  if(gameSettingsToggle) gameSettingsToggle.onclick = ()=>{ gameSetEl.classList.contains('show') ? closeSettingsPanel() : openSettingsPanel(); };
  // the Jump Game's own controls sit inside the panel, and its "Reset best" now asks first
  if(setJumpEl && gameSettingsEl) setJumpEl.appendChild(gameSettingsEl);
  if(gameResetBestBtn) gameResetBestBtn.onclick = ()=>askConfirm(t('runtime.gameConfirmBest', {name:t('runtime.gameTitle')}), ()=>resetGameBest(findGame('jump')));

  if(gameSwitchBtn) gameSwitchBtn.onclick = ()=>{ gameLibEl.classList.contains('show') ? closeGameLib() : openGameLib(); };
  if(gameLibClose) gameLibClose.onclick = closeGameLib;
  if(gameAddOpen) gameAddOpen.onclick = ()=>{ gameAddForm.classList.toggle('show'); if(gameAddForm.classList.contains('show')) gameAddName.focus(); };
  if(gameAddCancel) gameAddCancel.onclick = resetAddForm;
  if(gameAddSave) gameAddSave.onclick = saveNewGame;
  if(gameAddImport) gameAddImport.onclick = importGameFile;
  if(gameAddAi) gameAddAi.onclick = copyAiPrompt;


  refreshPrivacyUI();
  setLookupMode('translate');

  const c=cfg();
  if(!c.enabled){fab.style.display='none';panel.style.display='none';renderText();offOnAbort(tavo.plugin.i18n.onChange(renderText));return;}
  const bs=Math.max(28,Math.min(64,Number(c.buttonSize||54)));
  const bo=Math.max(0,Math.min(1,Number(c.buttonOpacity ?? 1)));
  fab.style.width=bs+'px';fab.style.height=bs+'px';fab.style.fontSize=Math.max(14,bs*.46)+'px';fab.style.setProperty('--emon-fab-opacity',String(bo));
  applyPanelLook();
  if(c.stealthMode) fab.classList.add('stealth');
  try{
    const pos=tavo.get('emonImageViewerFabPosition','global');
    if(pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)){
      requestAnimationFrame(()=>{
        const ins=safeInsets();
        fab.style.left=Math.max(4,Math.min(innerWidth-bs-4,pos.x))+'px';
        fab.style.top=Math.max(ins.top,Math.min(innerHeight-bs-ins.bottom,pos.y))+'px';
        fab.style.right='auto';fab.style.bottom='auto';
      });
    }
  }catch{}

  // Keep the floating button on screen when the phone rotates or the toolbars change the free space (both axes:
  // it used to be corrected vertically only, so after a rotation it could end up off the side).
  // Pop-ups start below the app's top bar (and above the system bar), so a pop-up's × is never hidden under it.
  const applyModalInsets=()=>{
    let top=0,bottom=0;
    try{ const i=tavo.ui&&typeof tavo.ui.getInsets==='function'?tavo.ui.getInsets():null; if(i){ top=Number(i.topBar)||0; bottom=Number(i.bottomSafe)||0; } }catch{}
    const st=document.documentElement.style;
    st.setProperty('--emon-iv-top',(top>0?top:76)+'px');      // 76px until the app has told us its real top bar
    st.setProperty('--emon-iv-bottom',bottom+'px');
  };
  applyModalInsets();
  const clampFab=()=>{
    applyModalInsets();
    if(!(fab.style.left && fab.style.top)) return;
    const ins=safeInsets();
    const w=fab.offsetWidth||bs, hh=fab.offsetHeight||bs;
    const left=parseFloat(fab.style.left)||0, top=parseFloat(fab.style.top)||0;
    fab.style.left=Math.max(4,Math.min(innerWidth-w-4,left))+'px';
    fab.style.top=Math.max(ins.top,Math.min(innerHeight-hh-ins.bottom,top))+'px';
  };
  winOn('resize',clampFab);
  try{
    if (tavo.ui && typeof tavo.ui.onInsetsChanged === 'function') offOnAbort(tavo.ui.onInsetsChanged(clampFab));
  }catch{}
  renderText();
  refreshGameUI();
  renderProfiles();
  document.querySelectorAll('[data-emon-pin]').forEach(n=>n.remove());   // pins an older copy of this panel left on screen
  document.querySelectorAll('body > .emon-iv-modal').forEach(n=>n.remove());
  if(!startApp()) renderPinsList();
  loadSavedPreviews();
  offOnAbort(tavo.plugin.i18n.onChange(()=>{renderText();renderProfiles();loadSavedPreviews();refreshGameUI()}));
})();

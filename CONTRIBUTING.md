# Contributing to Image Preview

Thanks for wanting to help. This project is small, personal, and community-minded — contributions are welcome, but please keep a few things in mind.

## Ways to help

- **Report a bug:** open an [Issue](../../issues). Include your Tavo version, your phone/OS if it seems relevant, and clear steps to reproduce. A screenshot or screen recording helps a lot. Found a security problem? Please don't open a public Issue — see [`SECURITY.md`](SECURITY.md).
- **Suggest an idea:** open an Issue describing what you want and why. Not every idea will fit the plugin's direction, but all are welcome to discuss.
- **Fix or improve something:** fork the repo, make your change, and open a [Pull Request](../../pulls) against `main`.
- **Translate:** copy `source/locales/en.json`, translate every value (never the keys), and open a Pull Request. Keep placeholders like `{name}` or `{n}` exactly as they are — they get filled in by the plugin at runtime.
- **Make your own version:** you're free to fork and go your own way entirely, under the MIT License. Just keep the original copyright and license notice — that's the one requirement.

## Project layout

```
source/
  manifest.json       Plugin manifest (id, version, settings schema, input and sidebar actions, etc.)
  entry.js             Plugin entry script — the input actions ("Extract images from text", "Preview a link") and the one sidebar action (Image Preview menu, which opens the menu that panel.html draws)
  icon.png             Plugin icon
  ui/panel.html        The plugin's chat-page layout (HTML only)
  ui/styles.css        Its styles
  ui/panel.js          Its logic: everything the panel does
  locales/
    en.json            English text
    bn.json            Bengali text
```

Almost the whole plugin lives in `ui/panel.js`, so it can get long — search for the feature name (e.g. `pinPreview`, `snakeGame`, `showImageInfo`) rather than scrolling. `ui/panel.html` is only the layout and `ui/styles.css` only the styles; the panel stays hidden until its styles have loaded. The one exception is `entry.js`: anything registered as a `sidebar`, `input`, or `lastMessageAction` in the manifest is handled there instead, since those run outside the chat-page fragment `panel.html` mounts into.

One thing is duplicated on purpose: the image-link finder lives in both `entry.js` (`extractImageUrls`) and `ui/panel.js` (`findImageUrls`). If you change one, change the other the same way.

The entry script and the panel talk through window events (`emon-iv-extract-results-v2`, `emon-iv-scan-chat-v2`, `emon-iv-open-recycle-v2`, `emon-iv-fab-reset-v2`, `emon-iv-character-page-v2`, `emon-iv-web-open-v2`). The panel also understands the older names without `-v2` (and blocks older copies of the panel from reacting to them), so keep that when you add a new event. `entry.js` sends them through `sendToPanel`, and the panel marks each one as handled (`preventDefault`); if nobody does, the person is told the panel isn't ready. Use `sendToPanel` for any new action.

## Before opening a Pull Request

- Test your change in Tavo on a real device if you can (the ⚓ pull gesture, the game and popups especially) — the plugin runs inside a WebView, and some bugs (touch handling, layout, scrolling) only show up there.
- Keep new user-visible text out of the HTML directly — add it to both `locales/en.json` and `locales/bn.json` (an English fallback is fine for the Bengali file if you can't translate it yourself; say so in your PR).
- Try not to bundle unrelated changes into one PR — smaller, focused PRs are easier to review and merge.
- Describe what you changed and why in the PR description.
- Anything that loads or downloads a link must follow the existing link rules (`isFetchableUrl`: public `http(s)` only, and only images, GIFs and web pages), and should ask `peekCached` first when it fetches a file. A downloaded file is kept only after it passes the picture checks (`sniffImageExt` for links without a file ending, `probeLocalImage` for the rest). Please don't add permissions or new network calls without opening an Issue first.
- The Terms of Use text lives in the locale files (`runtime.terms*`) and its version is `TERMS_VERSION` in `ui/panel.js`. Change the version only when the terms change in a way people should agree to again.
- Gallery files are named so that the list of files IS the gallery: pictures `emon-gal-<collection id>-<size in base 36>-<hash of the full original name>-<readable part>.<type>` and their small previews `emon-gth-<collection id>-<size>-<hash>.jpg` (`GAL_RE` and `GTH_RE` in `ui/panel.js`). Do not change this scheme without a way to read the old names, and keep every file the Gallery writes matching those patterns.
- When you add or change a feature, update its text in the ❔ Help guide (`runtime.help*` in both locale files). Keep the plugin description short; the details belong in the Help guide.
- Look elements up with `byId('...')` in `ui/panel.js`, never `document.getElementById('...')`, so a second copy of the panel can't grab the first copy's elements.
- Never run an unbounded pattern over card, lorebook, message or page text (for example `[^>]*` with no limit, or `\s+$`): crafted text can make it search to the end again from every start and freeze the app. Use a one-pass scan that remembers the next position (see `pgTooComplex`, `stripTagsLinear`, `imgHasSizeAttr`), `trim()`, or a hard limit such as `{0,300}`.

## Packaging a `.tpg` for testing

1. Make sure `manifest.json`, `entry.js`, `icon.png`, `ui/`, and `locales/` are all up to date.
2. Zip those five items together (not the containing folder) into a `.tpg` file, with `manifest.json` at the root of the zip. If the manifest declares any `sidebar`, `input`, or `lastMessageAction`, its `entry` field must point to `entry.js` (or the package will fail to install).
3. Install it in Tavo (or a backup chat) to test.

If you change the version, update `version` in `manifest.json`, add a `releaseNotes.x_y_z` entry to both locale files (real line breaks, not the text `\n`) and remove the older ones (a package only describes its own release), point `releaseNotes` in the manifest to it, add the entry to `CHANGELOG.md`, and update the *Current Version* section of `README.md`.

## Code of conduct

Be kind. This is a hobby project maintained by one person in their spare time — patience and courtesy go a long way, in both directions.

## Credits

Image Preview was created and is maintained by **silent000 (Emon)**. See [`LICENSE`](LICENSE) for the terms under which you can use, modify, and share this project.

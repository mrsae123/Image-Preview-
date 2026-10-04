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
  manifest.json       Plugin manifest (id, version, settings schema, sidebar action, etc.)
  entry.js             Plugin entry script — the "Extract images from text" input action and the sidebar actions (Reset floating button position, Open Recycle Bin, Scan chat for images, Character page)
  icon.png             Plugin icon
  ui/panel.html        The plugin's chat-page UI, in one self-contained file (HTML + CSS + JS)
  locales/
    en.json            English text
    bn.json            Bengali text
```

Almost the whole plugin lives in `ui/panel.html` as one file, so it's easy to read top to bottom but can also get long — search for the feature name (e.g. `pinPreview`, `snakeGame`, `showImageInfo`) rather than scrolling. The one exception is `entry.js`: anything registered as a `sidebar`, `input`, or `lastMessageAction` in the manifest is handled there instead, since those run outside the chat-page fragment `panel.html` mounts into.

One thing is duplicated on purpose: the image-link finder lives in both `entry.js` (`extractImageUrls`) and `ui/panel.html` (`findImageUrls`). If you change one, change the other the same way.

The entry script and the panel talk through window events (`emon-iv-extract-results-v2`, `emon-iv-scan-chat-v2`, `emon-iv-open-recycle-v2`, `emon-iv-fab-reset-v2`, `emon-iv-character-page-v2`). The panel also understands the older names without `-v2` (and blocks older copies of the panel from reacting to them), so keep that when you add a new event.

## Before opening a Pull Request

- Test your change in Tavo on a real device if you can (the ⚓ pull gesture, the game and popups especially) — the plugin runs inside a WebView, and some bugs (touch handling, layout, scrolling) only show up there.
- Keep new user-visible text out of the HTML directly — add it to both `locales/en.json` and `locales/bn.json` (an English fallback is fine for the Bengali file if you can't translate it yourself; say so in your PR).
- Try not to bundle unrelated changes into one PR — smaller, focused PRs are easier to review and merge.
- Describe what you changed and why in the PR description.
- Anything that loads or downloads a link must follow the existing link rules (`isFetchableUrl`: public `http(s)` only, and only images, GIFs and web pages), and should ask `peekCached` first when it fetches a file. Please don't add permissions or new network calls without opening an Issue first.
- The Terms of Use text lives in the locale files (`runtime.terms*`) and its version is `TERMS_VERSION` in `ui/panel.html`. Change the version only when the terms change in a way people should agree to again.
- When you add or change a feature, update its text in the ❔ Help guide (`runtime.help*` in both locale files). Keep the plugin description short; the details belong in the Help guide.

## Packaging a `.tpg` for testing

1. Make sure `manifest.json`, `entry.js`, `icon.png`, `ui/`, and `locales/` are all up to date.
2. Zip those five items together (not the containing folder) into a `.tpg` file, with `manifest.json` at the root of the zip. If the manifest declares any `sidebar`, `input`, or `lastMessageAction`, its `entry` field must point to `entry.js` (or the package will fail to install).
3. Install it in Tavo (or a backup chat) to test.

If you change the version, update `version` in `manifest.json`, add a `releaseNotes.x_y_z` entry to both locale files (real line breaks, not the text `\n`), point `releaseNotes` in the manifest to it, add the entry to `CHANGELOG.md`, and update the *Current Version* section of `README.md`.

## Code of conduct

Be kind. This is a hobby project maintained by one person in their spare time — patience and courtesy go a long way, in both directions.

## Credits

Image Preview was created and is maintained by **silent000 (Emon)**. See [`LICENSE`](LICENSE) for the terms under which you can use, modify, and share this project.

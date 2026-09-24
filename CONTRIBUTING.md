# Contributing to Image Preview

Thanks for wanting to help. This project is small, personal, and community-minded — contributions are welcome, but please keep a few things in mind.

## Ways to help

- **Report a bug:** open an [Issue](../../issues). Include your Tavo version, your phone/OS if it seems relevant, and clear steps to reproduce. A screenshot or screen recording helps a lot.
- **Suggest an idea:** open an Issue describing what you want and why. Not every idea will fit the plugin's direction, but all are welcome to discuss.
- **Fix or improve something:** fork the repo, make your change, and open a [Pull Request](../../pulls) against `main`.
- **Translate:** copy `source/locales/en.json`, translate every value (never the keys), and open a Pull Request. Keep placeholders like `{name}` or `{n}` exactly as they are — they get filled in by the plugin at runtime.
- **Make your own version:** you're free to fork and go your own way entirely, under the MIT License. Just keep the original copyright and license notice — that's the one requirement.

## Project layout

```
source/
  manifest.json       Plugin manifest (id, version, settings schema, etc.)
  icon.png             Plugin icon
  ui/panel.html        The entire plugin UI, in one self-contained file (HTML + CSS + JS)
  locales/
    en.json            English text
    bn.json            Bengali text
```

The whole plugin lives in `ui/panel.html` as one file, so it's easy to read top to bottom but can also get long — search for the feature name (e.g. `pinPreview`, `snakeGame`, `showImageInfo`) rather than scrolling.

## Before opening a Pull Request

- Test your change in Tavo on a real device if you can — the plugin runs inside a WebView, and some bugs (touch handling, layout, scrolling) only show up there.
- Keep new user-visible text out of the HTML directly — add it to both `locales/en.json` and `locales/bn.json` (an English fallback is fine for the Bengali file if you can't translate it yourself; say so in your PR).
- Try not to bundle unrelated changes into one PR — smaller, focused PRs are easier to review and merge.
- Describe what you changed and why in the PR description.

## Packaging a `.tpg` for testing

1. Make sure `manifest.json`, `icon.png`, `ui/`, and `locales/` are all up to date.
2. Zip those four items together (not the containing folder) into a `.tpg` file.
3. Install it in Tavo (or a backup chat) to test.

## Code of conduct

Be kind. This is a hobby project maintained by one person in their spare time — patience and courtesy go a long way, in both directions.

## Credits

Image Preview was created and is maintained by **silent000 (Emon)**. See [`LICENSE`](LICENSE) for the terms under which you can use, modify, and share this project.

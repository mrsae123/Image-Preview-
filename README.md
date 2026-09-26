# Image Preview

A free, open-source, community-minded plugin for **Tavo**.

Image Preview lets you preview and pin images over your chat, quickly look up text, and play a few small games while waiting for a reply — all while keeping your data on your own device.

## Features

- 🖼️ **Image Preview & Pinning**
  - Preview an image link or a webpage link.
  - If a link fails, it automatically tries other images the page points to until one loads. Ads and tracker hosts are skipped.
  - Works with JPG, PNG, WebP, AVIF, SVG and animated GIF.
  - Pin an image over the chat: drag to move, pinch or use +/- to resize, rotate and flip it.
  - Rename and manage your pins from the PINNED ON CHAT list.
  - Rename saved images and GIFs from their action sheet. Renaming only changes the label; the file is never touched.
  - Double-tap a pinned image, or tap a saved image, to open it fullscreen.
  - Save a copy for the chat, save straight to your device, or copy the original link.
  - Info button shows format, dimensions, file size and real source for any image.
  - Saving or pinning the same picture twice reuses the same file — no duplicates.
  - Import images directly from your device.

- 🔎 **Quick Lookup**
  - Translate text, look up word meanings, or search the web, without leaving the plugin panel.
  - Opened by a ⚓ anchor that hangs on a rope and sways on its own. Pull it down to open; tap it or pull it down again to close.

- 🎮 **Game Corner**
  - **Game Library:** pick a game from the list at the top of the game window.
  - **Jump Game:** the original runner, with score titles.
  - **Snake:** a round world (leave one edge, come back on the opposite one), Easy / Medium / Extreme modes, horror-style score titles, and a Points Store for skins, food and board looks. Swipe or on-screen arrow buttons.
  - **Memory Bomb:** a bomb timer, move targets, tricky card swaps, unlockable emoji sets, and a collectible wisdom library. Pausable, like Snake.
  - **Add your own games:** paste a game's HTML (or import an `.html` file). A built-in "Copy AI prompt" button helps you ask any AI to make a compatible game.
  - One ⚙ settings button per game: your player name (shared across games), that game's own options, and its own reset buttons — plus a "reset all games" option with a clear warning.
  - Progress is saved on your device.

- ✨ **Feel**
  - Pop-ups, the panel and the game open and close with a smooth animation.
  - Buttons and cards give a little feedback when tapped.
  - A single ❔ Help button explains how everything works, in one place.
  - Help and Game buttons hang and sway when pressed.

- ⚙️ **Customization**
  - Floating button size and opacity.
  - Default image size and opacity.
  - Remember pinned images.
  - Stealth mode.
  - Reset floating button position if it becomes unreachable.

- 🔐 **Privacy**
  - Everything stays on your device by default.
  - Saved images and pins belong only to their chat.
  - Built-in games are fully offline.
  - Games you add yourself run in an isolated sandbox and cannot read your chats or Tavo data. Only add games from sources you trust.
  - Quick Lookup only ever sends the exact text you type and tap "Look up" on, and only then.
  - No accounts, no subscriptions, and none planned.

## Installation

1. Download the latest `.tpg` package from the **[Releases](https://github.com/mrsae123/Image-Preview-/releases)** section.
2. Open Tavo.
3. Install/import the `.tpg` plugin package.
4. Enable **Image Preview** from Tavo's plugin settings.
5. Open a chat and use the floating Image Preview button.

Plugins need **Advanced Rendering** to be enabled for the chat.

## Current Version

**v2.13.17**

Highlights since v2.13.10:

- The main panel now opens like a black hole pulling itself open, and closes with a drawstring-pouch pull; pop-ups crush into the ✕ when closing, and the game window and pinned images open with a CRT-style flicker-in.
- Performance pass: those animations use movement and fading instead of animated blur/glow, to stay smooth on slower phones, with a touch of warmth added back afterward.
- Fixed the ❔ Help button closing itself on tap, pop-ups briefly overlapping each other, and pop-ups reopening already scrolled down.
- Help/Info/Rename/the saved-image sheet now stay correctly anchored to the phone screen even if the chat page scrolls or shifts around them.
- "Save to device" no longer claims success before you've actually chosen anything in the save/share sheet.

See [`CHANGELOG.md`](CHANGELOG.md) or the [Releases](https://github.com/mrsae123/Image-Preview-/releases) page for the full history.

## Project Status

Image Preview was originally created as a personal Tavo plugin, and the source is open under the MIT License.

It is meant to stay **community-minded**. If I ever stop maintaining it for a long period, anyone is welcome to fix, modify, improve and extend it, as long as the original copyright and license notice are kept. See [`CONTRIBUTING.md`](CONTRIBUTING.md) if you'd like to help.

## Credits

**Creator:** silent000 (Emon)

This project is made for **Tavo**.

## License

Image Preview is released under the **MIT License**.

You are free to use, modify, copy, and redistribute the project according to the terms of the MIT License.

See [`LICENSE`](LICENSE) for the full license text.

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
  - **Extract images from text**: paste a wall of text or HTML into the chat input and tap "Extract images from text" in the input's + menu. It pulls out every image/GIF link, ignores the rest, and shows them as a picker (Select all / Select none, tap tiles to include or leave out). Save selected or Save all puts them in Saved Previews.
  - **Saved Previews Select mode**: tap Select, pick any saved images, then Pin selected to put them on the chat, or Delete selected to send them to the Recycle Bin.
  - **Recycle Bin**: deleting a saved image (or using Clear all) moves it to a global Recycle Bin instead of erasing it. Restore sends it back to the chat it came from; anything left alone clears itself out after 7 or 30 days. Each image's own countdown starts when it's deleted.
  - **Clear all** next to "Pinned on chat" unpins everything at once (it only unpins; saved copies stay).

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
  - Floating button icon (Leaf, Classic, Moon, Star, Blossom, Butterfly, Wave, Orb) and color theme (Forest, Violet, Sunset, Ocean, Rose, Monochrome).
  - Default image size and opacity.
  - Remember pinned images.
  - Stealth mode.
  - Recycle Bin retention (7 or 30 days).

- 🧭 **Sidebar Actions**
  - **Reset floating button position** — a one-tap action in the chat's right sidebar (Plugin · Image Preview), not a settings switch, so it can never get left silently "on." Snaps the button back on screen immediately if it's unreachable, with a small pulse and a confirmation toast.
  - **Open Recycle Bin** — opens the Recycle Bin to restore or permanently delete saved images.

- 🔐 **Privacy**
  - Everything stays on your device by default.
  - Saved images and pins belong only to their chat. The one exception is the Recycle Bin, which holds deleted images across every chat until they're restored or their time runs out.
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

**v2.18.0**

Highlights:

- New Recycle Bin for deleted saved images (7 or 30 days, restore back to the original chat), opened from the chat's right sidebar.
- Extract images from text is now save-only; pin from Saved Previews' new Select mode, which also has Delete selected.
- Customizable floating button: pick an icon and a color theme (new default is a Forest leaf).
- Fixes for duplicate saves on a double-tap and for false "saved" messages on deleted device-imported images.

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

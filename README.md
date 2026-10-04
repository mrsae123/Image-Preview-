# Image Preview

A free, open-source, community-minded plugin for **Tavo**.

Image Preview lets you preview and pin images over your chat, read a character card as one scrollable page with its pictures, quickly look up text, and play a few small games while waiting for a reply — all while keeping your data on your own device.

## Features

- 🖼️ **Image Preview & Pinning**
  - Preview an image link or a webpage link.
  - If a link fails, it automatically tries other images the page points to until one loads. Ads and tracker hosts are skipped.
  - Works with JPG, PNG, WebP, AVIF, SVG and animated GIF.
  - Pin an image over the chat: drag to move, pinch or use +/- to resize, rotate and flip it. Up to **30 images** can be pinned at once; remove one to pin another. (An older chat with more than 30 pins keeps the extra ones safe: they wait and come back one by one as you remove pins.)
  - Rename and manage your pins from the PINNED ON CHAT list.
  - Rename saved images and GIFs from their action sheet. Renaming only changes the label; the file is never touched.
  - Double-tap a pinned image, or tap a saved image, to open it fullscreen.
  - Save a copy for the chat, save straight to your device, or copy the original link.
  - Info button shows format, dimensions, file size and real source for any image.
  - Saving or pinning the same picture twice reuses the same file — no duplicates. Save selected, Save all and Import from device also skip anything that's already in Saved Previews.
  - Import images directly from your device.
  - **Extract images from text**: paste a wall of text or HTML into the chat input and tap "Extract images from text" in the input's + menu. It pulls out every image/GIF link, ignores the rest, and shows them as a picker (Select all / Select none, tap tiles to include or leave out). Save selected or Save all puts the new ones in Saved Previews (anything already saved is marked **Saved** and skipped).
  - **Scan this chat for images**: tap it in the panel (or in the chat's right sidebar) and it searches the whole chat for you: the character card, persona, lorebooks and every message, newest first. Everything it finds opens in the same picker as Extract, with a summary of where the links came from and a **Rescan** button for after the chat changes. Rescan always tells you what it found (nothing new, how many are new, or that it failed) and keeps the tiles you left out. No pasting needed.
  - **Saved Previews Select mode**: tap Select, pick any saved images, then Pin selected to put them on the chat, or Delete selected to send them to the Recycle Bin.
  - **Saved Previews** shows 200 images at a time; tap **Show more** at the end for the next batch, so nothing is out of reach.
  - **Recycle Bin**: deleting a saved image (or using Clear all) moves it to a global Recycle Bin instead of erasing it. Restore puts it into the chat you have open right now (it never switches chats); anything left alone clears itself out after 7 or 30 days. Each image's own countdown starts when it's deleted.
  - **Clear all** next to "Pinned on chat" unpins everything at once (it only unpins; saved copies stay).

- 📖 **Character Page**
  - Tap **Character page** in the panel (or in the chat's right sidebar) to read the open chat's character card as one scrollable page: creator notes, description, personality and scenario, with the pictures and GIFs right where the card put them — a bit like a bot's intro page.
  - Works with the rich text that Janitor-style cards use, and with Markdown or plain text. `{{user}}` and `{{char}}` are filled in, bright text colours are kept and backgrounds are not. Long runs of blank lines are squeezed.
  - Tap a picture to see it bigger. In a group chat, tap a name at the top to switch characters.
  - Opening it from the panel closes the panel, so only the page is on screen. Close it with ×, with Close at the bottom, or by tapping outside it.
  - It reads the card on your device only when you open it, and never changes it. See *Privacy & Security* below.

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

- 🐵 **Make it yours (the little monkey)**
  - A small baby monkey sits next to the panel title. Poke him and he opens "Make it yours".
  - Wallpaper from your phone (shrunk to a sensible size so the panel stays quick) or from an image link, and how dark it is.
  - Panel background (Forest, Ocean, Sunset, Rose, Midnight, Aurora) and panel font (Default, Serif, Rounded, Monospace, Handwriting).
  - Floating button icon and color.
  - Everything applies right away, and one button returns to your defaults.

- ✨ **Feel**
  - Pop-ups, the panel and the game open and close with a smooth animation.
  - Buttons and cards give a little feedback when tapped.
  - A single ❔ Help button explains how everything works, in one place, with an **About & support** section (Terms of Use, Discord) and a short "If something won't close or open" tip.
  - Help and Game buttons hang and sway when pressed.

- ⚙️ **Customization**
  - Floating button size and opacity.
  - Floating button icon (Leaf, Classic, Moon, Star, Blossom, Butterfly, Wave, Orb) and color theme (Forest, Violet, Sunset, Ocean, Rose, Monochrome), now picked from the monkey's pop-up.
  - Default image size and opacity.
  - Remember pinned images.
  - Stealth mode.
  - Recycle Bin retention (7 or 30 days).
  - Languages: English and Bengali.

- 🧭 **Sidebar Actions**
  - **Reset floating button position** — a one-tap action in the chat's right sidebar (Plugin · Image Preview), not a settings switch, so it can never get left silently "on." Snaps the button back on screen immediately if it's unreachable, with a small pulse and a confirmation toast.
  - **Open Recycle Bin** — opens the Recycle Bin to restore or permanently delete saved images.
  - **Scan chat for images** — the same chat scan as in the panel, one tap away.
  - **Character page** — opens the open chat's character card as one scrollable page.

- 📜 **Terms of Use**
  - The first time you open Image Preview you tick a box to agree to a short, friendly Terms of Use (it also points to Tavo's own Terms of Service). Until you agree, nothing opens, scans or restores. "Not now" simply keeps everything closed.
  - Your answer is only a version number and a time, stored on your device. You can read the terms again at any time in ❔ Help → About & support.

- 🔐 **Privacy & Security**
  - Everything stays on your device by default. No accounts, no analytics, no tracking, no ads, and none planned.
  - Saved images and pins belong only to their chat. The one exception is the Recycle Bin, which holds deleted images across every chat until they're restored or their time runs out.
  - Import from device remembers each file's name and size, inside that chat only, so the same file isn't saved twice.
  - Links are checked: only public `http(s)` links are ever opened or downloaded. `localhost`, your home network (like `192.168.x.x`), `*.local` names and non-web links such as `javascript:` or `intent:` are refused.
  - **Only images, GIFs and web pages are downloaded.** Links to videos, music, archives, apps, documents or model files are refused before anything is fetched. For other links the plugin first asks the link's own server for its headers only (never the body; no cookies, no Referer) and refuses anything that isn't an image or a web page, or that is too big (images over 50 MB, web pages over 6 MB). Some servers hide this; then an oversized web page is thrown away unread and an oversized image is deleted as soon as it arrives. Downloads give up after 45 seconds (web page previews after 30).
  - Quick Lookup sends only the text you type (up to 1,000 characters) and only when you tap "Look up". It goes over HTTPS to Google Translate, Lingva, MyMemory, dictionaryapi.dev, Wiktionary, Wikipedia, DuckDuckGo or Brave Search. Privacy Mode blocks all of it. An optional Brave key is sent only to Brave, as a header.
  - Built-in games are fully offline. Games you add run in a sandbox **with no network access**, so they can't phone home, load outside code or reveal your IP, and they can't read your chats or Tavo data. Still, only add games from sources you trust.
  - "Extract images from text" reads at most the first 300,000 characters, shows at most 200 links and ignores private-network links.
  - "Scan this chat for images" only runs when you tap it. It reads (never changes) the open chat's character card, persona, lorebooks and messages on your device, sends nothing anywhere, and keeps to the same limits and link rules. Plugin permissions: `file`, `network`, `variable`, `input` and `message`.
  - The Character page reads the open chat's card on your device only when you open it, changes nothing and sends nothing anywhere. Its text is drawn as plain elements — no scripts, no styles, no clickable links — and its pictures follow the same public-link rules and load only when you open the page (embedded pictures work too, but not SVG). The site hosting a picture sees your IP address, never a Referer.
  - When an image loads from the web, the site hosting it sees your IP address (that can't be avoided), but never a Referer.
  - Found a problem? See [`SECURITY.md`](SECURITY.md).

## Installation

> **Only install from this repository's Releases page** and compare the SHA-256 shown next to the file. A copy from anywhere else could have been changed.

1. Download the latest `.tpg` package from the **[Releases](https://github.com/mrsae123/Image-Preview-/releases)** section.
2. Open Tavo.
3. Install/import the `.tpg` plugin package.
4. Enable **Image Preview** from Tavo's plugin settings.
5. Open a chat and use the floating Image Preview button.
6. The first time, tick the box to agree to the short Terms of Use; then everything opens.

Plugins need **Advanced Rendering** to be enabled for the chat.

Updating from an older version? Close Tavo completely and open it again once, so no older copy of the plugin stays active.

## Current Version

**v2.25.1**

Highlights:

- New: **Character page** — read the open chat's character card (creator notes, description, personality, scenario) as one scrollable page, with its pictures and GIFs where the card put them, like a bot's intro page.
- New: a short, friendly **Terms of Use**, agreed to once with a tick box before anything opens. Read it again in ❔ Help → About & support.
- New: up to **30 pinned images** at once (remove one to pin another), and Saved Previews now shows **200 at a time** with a Show more tile.
- Safer downloads: only images, GIFs and web pages are ever fetched. Videos, apps, archives and other files are refused first, and oversized images and pages are skipped.
- Fixed: the PINNED ON CHAT list now shows your pins after you reopen a chat; tapping Save or Pin twice no longer makes duplicates; pop-ups start below the top bar so their × can always be reached; Extract no longer clears your typed text when it can't use a link; the Recycle Bin can no longer lose a picture if a write fails.
- The ❔ Help guide and the plugin description were rewritten, in English and Bengali.

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

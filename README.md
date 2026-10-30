# Image Preview

A free, open-source, community-minded plugin for **Tavo**.

Image Preview lets you preview and pin images over your chat, read a character card as one scrollable page with its pictures, look at a web page's pictures and words without leaving Tavo, quickly look up text, and play a few small games while waiting for a reply — all while keeping your data on your own device.

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
  - **Scan this chat for images**: tap it in the panel (or in the Image Preview menu) and it searches the chat for you: the character card, persona, lorebooks and the newest 5,000 messages, newest first. Everything it finds opens in the same picker as Extract (promo banners and one-pixel trackers are left out; a green bar lets you show them), with a summary of where the links came from and a **Rescan** button for after the chat changes. Pictures load a few at a time and retry on their own; tap a failed one to try again. Rescan always tells you what it found (nothing new, how many are new, or that it failed) and keeps the tiles you left out. No pasting needed.
  - **Saved Previews Select mode**: tap Select, pick any saved images, then Pin selected to put them on the chat, or Delete selected to send them to the Recycle Bin.
  - **Saved Previews** shows 200 images at a time; tap **Show more** at the end for the next batch, so nothing is out of reach.
  - **Recycle Bin**: deleting a saved image (or using Clear all) moves it to a global Recycle Bin instead of erasing it. Restore puts it into the chat you have open right now (it never switches chats); anything left alone clears itself out after 7 or 30 days. Each image's own countdown starts when it's deleted, and every image shows its days left in its own pill (amber from 3 days, red on the last day).
  - **Clear all** next to "Pinned on chat" unpins everything at once (it only unpins; saved copies stay).

- 📖 **Character Page**
  - Tap **Character page** in the panel (or in the Image Preview menu) to read the open chat's character card as one scrollable page: creator notes, description, personality and scenario, with the pictures and GIFs right where the card put them — a bit like a bot's intro page.
  - Works with the rich text that Janitor-style cards use, and with Markdown or plain text. `{{user}}` and `{{char}}` are filled in. Lists (`-`, `*`, `•`, `1.`, with sub-lists) and quotes (`>`) show as real lists and quotes, and a card's own look is kept: text colours, backgrounds and gradients, borders, rounded corners, spacing, side-by-side rows, centered text, text sizes, bold, italic and underline. Text always stays readable (a colour that can't be read on its background is replaced), and nothing that could cover the page, hide text or load something from outside is carried over. Long runs of blank lines are squeezed.
  - Links show as small pills that open **Page view** (below).
  - **Clean view** leaves out promo banners, Discord/Patreon-style links, profile-link “creators”, one-pixel trackers and scraper stamps such as “[retrieved by …]”. A green bar shows how many items were hidden; tap **Show all** to see everything (links are never clickable there).
  - Pictures load only when you scroll close to them, stay hidden until fully loaded, and then fade in, so the page jumps much less.
  - Tap a picture to see it bigger. In a group chat, tap a name at the top to switch characters.
  - Opening it from the panel closes the panel, so only the page is on screen. Close it with ×, with Close at the bottom, or by tapping outside it.
  - It reads the card on your device only when you open it, and never changes it. See *Privacy & Security* below.

- 🌐 **Page view**
  - Look at a web page's pictures and words without leaving Tavo. Open it by tapping a link pill on the Character page, by pasting a link into the panel's link field and tapping 🌐 Page view, from the input's + menu (**Preview a link**), from the Image Preview menu (**Page view**), or by tapping Preview on a web-search result.
  - Tap a picture to see it full screen; tick the circle in its corner to select it, then **Save pictures** keeps them in Saved Previews. Recent pages are remembered.
  - Image Chest links show the whole gallery: Page view reads the picture list the page keeps inside itself and shows 80 pictures at a time, then **Show more**.
  - Nothing on the page runs, and ads, trackers and banners are never loaded.
  - If a page only shows its pictures with JavaScript (so only its preview picture can be read), Page view says so. A free Tavily key can read those pages for you.

- 🔎 **Quick Lookup**
  - Translate text, look up word meanings, or search the web, without leaving the plugin panel.
  - Search can use an optional Brave key and/or a free Tavily key (no card needed). Tap Brave or Tavily to choose which one goes first; if it fails, the other is tried, then a free fallback.
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
  - Text size (85% to 130%) with a preview and a default-size button.
  - Background motion: Static (default), Subtle, Enhanced or Off. Your phone's "reduce motion" setting is always respected, and nothing animates while the panel is closed.
  - A button that opens the Storage manager (below).
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

- 🖼️ **Gallery**
  - Add pictures and GIFs from your phone once, then use them in any chat. Tap **Gallery** in the panel (or in the Image Preview menu), tap **Add pictures**, and in Tavo's picker open your folder and choose Select all.
  - The pictures are **copies**: Tavo lets a plugin copy a picked file into its own storage but gives no way to keep a link to a folder on your phone. So they take space (the Storage manager shows how much), your originals are never read again, changed or deleted, and the Gallery cannot notice new files on your phone: tap **Add pictures** again and the ones already there (the same file name, in any language, and the same size) are skipped.
  - **Collections** keep pictures apart. Each one works in every chat, or in one chat only. Rename or delete a collection from its ⋯ button; deleting only removes the copies in Image Preview. Pictures whose collection name was lost still show, under **Unsorted**.
  - Made for big collections: search by name, newest first or A to Z, 48 pictures per page (a small phone never has hundreds decoded at once), select mode (this page or all matches), a space warning before an add of 200 MB or more, and Stop at any time. Files over 25 MB and files that are not really pictures are skipped and counted. Changing the search or the collection clears the selection, so Remove and Move only act on what you picked in the list you are looking at.
  - **Small previews:** every picture also gets a small preview (a JPEG about 240 pixels on its short side, around 10 KB), made while you add and while you browse, and the grid draws those instead of the pictures themselves. A 12-megapixel photo drawn at full size takes about 48 MB of drawing memory, and a page of them made a small phone's list lag and go black. Pictures added before previews existed get theirs the first time you look at them, one at a time and the page on screen first; their tiles stay empty until then. A damaged preview is thrown away and made again, and a picture of more than 100 megapixels is saved but never drawn (it could take a phone down).
  - Tap a picture for Fullscreen, **Pin** on the chat (a copy goes into this chat's Saved Previews, so a pin never depends on the Gallery; a still JPEG photo bigger than about 1,600 pixels is shrunk first, while GIF, PNG, WebP and smaller pictures are copied untouched), Move to another collection (a move merges a picture into another only when the two files are identical byte for byte; a look-alike with the same name and size is kept), Save to device or Remove.
  - File names are simplified to plain letters and numbers inside Tavo's storage.

- 💾 **Storage manager**
  - Shows what Image Preview keeps on your phone, in plain words: saved previews, the Gallery, pins, Recycle Bin, temporary files, page history, lookup history, search keys, appearance and games.
  - Each part explains what it is, why it is needed and what happens if you delete it. Every clean-up shows exactly what will go first, and emptying the Recycle Bin needs an extra tick because it can't be undone.
  - Open it from the Image Preview menu (chat's right sidebar) or from the monkey's pop-up. It only ever shows or deletes Image Preview's own data.

- 🧭 **Image Preview menu**
  - The chat's right sidebar can only list buttons (it cannot fold them), so Image Preview keeps **one** there: **Image Preview menu** (Plugin · Image Preview). It opens a menu with every tool in two groups. Tap a group to open or close it; Image Preview remembers how you left them (both are closed the first time).
  - **Pictures and pages**: Gallery, Scan chat for images (the same chat scan as in the panel), Character page, Page view.
  - **Tidy up and fix**: Open Recycle Bin, Storage manager, and **Reset floating button position** — a one-tap action, not a settings switch, so it can never get left silently "on." It snaps the button back on screen immediately, with a small pulse and a confirmation toast.

- 📜 **Terms of Use**
  - The first time you open Image Preview you tick a box to agree to a short, friendly Terms of Use (it also points to Tavo's own Terms of Service). Until you agree, nothing opens, scans or restores. "Not now" simply keeps everything closed.
  - Your answer is only a version number and a time, stored on your device. You can read the terms again at any time in ❔ Help → About & support.

- 🔐 **Privacy & Security**
  - Everything stays on your device by default. No accounts, no analytics, no tracking, no ads, and none planned.
  - Saved images and pins belong only to their chat. The exceptions are the Recycle Bin, which holds deleted images across every chat until they're restored or their time runs out, and Gallery collections you set to work in every chat.
  - Import from device remembers each file's name and size, inside that chat only, so the same file isn't saved twice.
  - The Gallery only works on files you pick yourself in Tavo's own file picker, and only after you agree to the Terms. Each chosen file is copied once into Tavo's storage on your device (no network is used), must really be a picture (its first bytes are read), and gets a file name rebuilt from plain letters and numbers, plus a small preview drawn with your device's own picture decoder. Nothing on your phone is read again, changed or deleted; removing a picture or a collection deletes only Image Preview's copy. Tavo's file storage can be read by other scripts that run inside Tavo (for example JavaScript in a character card), so keep card JavaScript on only for cards you trust.
  - Links are checked: only public `http(s)` links are ever opened or downloaded. `localhost`, your home network (like `192.168.x.x`), `*.local` names, names that spell out a private address (like `192-168-1-1.sslip.io`) and non-web links such as `javascript:` or `intent:` are refused. The check reads the address as written; it can't see where a public name really points or where a redirect leads (see [`SECURITY.md`](SECURITY.md)).
  - **Only images, GIFs and web pages are downloaded.** Links to videos, music, archives, apps, documents or model files are refused before anything is fetched. For other links the plugin first asks the link's own server for its headers only (never the body; no cookies, no Referer) and refuses anything that isn't an image or a web page, or that is too big (images over 50 MB, web pages over 6 MB). Some servers hide this; then an oversized web page is thrown away unread and an oversized image is deleted as soon as it arrives. Every saved image is also checked once it has arrived: it must really be a picture (its first bytes are read, or the web engine has to accept it as one), otherwise it is deleted at once, even if the server claimed it was an image. Downloads give up after 45 seconds (web page previews after 30).
  - Quick Lookup sends only the text you type (up to 1,000 characters) and only when you tap "Look up". It goes over HTTPS to Google Translate, Lingva, MyMemory, dictionaryapi.dev, Wiktionary, Wikipedia, DuckDuckGo, Brave Search or Tavily. Privacy Mode blocks all of it. An optional Brave or Tavily key is sent only to its own service, as a header. When you ask Tavily to read a page, that page's link is sent to Tavily too.
  - Built-in games are fully offline. Games you add run in a sandbox **with no network access**, so they can't phone home, load outside code or reveal your IP, and they can't read your chats or Tavo data. Still, only add games from sources you trust.
  - "Extract images from text" reads at most the first 300,000 characters, shows at most 200 links and ignores private-network links.
  - "Scan this chat for images" only runs when you tap it. It reads (never changes) the open chat's character card, persona, lorebooks and messages on your device, sends nothing anywhere, and keeps to the same limits and link rules. Plugin permissions: `file`, `network`, `variable`, `input` and `message`.
  - The Character page reads the open chat's card on your device only when you open it, changes nothing and sends nothing anywhere. Its text is drawn as plain elements — no scripts, no clickable links, and a card's styles are never copied as written (colours, backgrounds, borders and spacing are rebuilt from numbers and keywords within fixed limits; no background pictures, no positioning or animation, nothing that can cover the page or hide text) — and its pictures follow the same public-link rules and load only when you open the page (embedded pictures work too, but not SVG). The site hosting a picture sees your IP address, never a Referer.
  - Page view downloads the page you ask for to a temporary file, reads it as inert text (nothing on it runs or loads: no scripts, styles, frames, ads or trackers), shows its words and pictures, and deletes the temporary file. It follows the same public-link rules and size limits. For Image Chest links, the picture list the page keeps inside itself is read the same way, as data that is never run. The site hosting the page and its pictures sees your IP address.
  - The Storage manager only looks for Image Preview's own files and settings (recognised by name), shows what will go before every clean-up, asks for an extra tick before the Recycle Bin is emptied, and sends nothing anywhere.
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

**v2.28.2**

Highlights:

- New: **Gallery** — add pictures and GIFs from your phone once, keep them in collections that work in every chat (or in one chat only), and use them anywhere: search, 48 pictures per page, pin on the chat, move, save to device, remove. The pictures are copies kept inside Tavo's storage; your originals are never touched. Every picture gets a small preview, so even a page of 12-megapixel photos scrolls smoothly.
- New: **Image Preview menu** — the chat's right sidebar now has one button that opens every tool, in groups that open and close and remember how you left them.
- Improved: the **Recycle Bin** shows every picture's days left in a clear pill (amber from 3 days, red on the last day).
- Improved: the Storage manager lists the Gallery with the space it uses.
- The ❔ Help guide explains all of this, in English and Bengali.

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

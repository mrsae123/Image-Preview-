# Image Preview

A personal, community-minded plugin for **Tavo**.

Image Preview lets you preview and pin images over your chat, quickly look up text, and play small games while waiting for a reply.

## Features

- 🖼️ **Image Preview**
  - Preview images directly in Tavo.
  - Pin images over the chat, then move and resize them.
  - Adjust image size and opacity.
  - Fullscreen image viewing. Double-tap a pinned image to open it fullscreen.
  - Import images from your device.
  - Works with JPG, PNG, GIF (animated), WebP, AVIF and SVG.
  - If an image link fails, it tries the https version and then the other images the page points to, until one really loads.
  - Ads are skipped: known ad and tracker hosts are never contacted, and ad-sized banners, tracking pixels and images inside ad blocks are ignored.

- 🔎 **Quick Lookup**
  - Translate text.
  - Look up word meanings.
  - Search the web without leaving the plugin panel.

- 🎮 **Game Corner**
  - **Game Library:** pick a game from the list at the top of the game window.
  - **Jump Game:** the original runner, with score titles.
  - **Snake:** a round world (leave one edge, come back on the opposite one), Easy / Medium / Extreme modes, horror-style score titles, and a Points Store for skins, food and board looks. Swipe or on-screen arrow buttons.
  - **Memory Bomb:** a bomb timer, move targets, tricky card swaps, unlockable emoji sets, and a collectible wisdom library.
  - **Add your own games:** paste a game's HTML (or import an `.html` file). A built-in "Copy AI prompt" button helps you ask any AI to make a compatible game.
  - One ⚙ button for every game: your player name (shared by all games), that game's options, and that game's own reset buttons. Plus a "Reset all games" option with a clear warning.
  - Pause button for Snake and Memory Bomb.
  - Progress is saved on your device.

- ⚙️ **Customization**
  - Floating button size and opacity.
  - Default image size and opacity.
  - Remember pinned images.
  - Stealth mode.
  - Reset floating button position if it becomes unreachable.

- 🔐 **Privacy**
  - Privacy-related options are available inside the plugin.
  - Chat-specific saved previews and pins stay scoped to their chat.
  - Images are requested without a Referer header, and no third-party service is used to load them.
  - The built-in games run fully offline.
  - Games you add yourself run in an isolated sandbox, so they cannot read your chats or Tavo data. Only add games from sources you trust.

## Installation

1. Download the latest `.tpg` package from the **[Releases](https://github.com/mrsae123/Image-Preview-/releases)** section.
2. Open Tavo.
3. Install/import the `.tpg` plugin package.
4. Enable **Image Preview** from Tavo's plugin settings.
5. Open a chat and use the floating Image Preview button.

Plugins need **Advanced Rendering** to be enabled for the chat.

## Current Version

**v2.12.0**

Highlights since v2.11.0:

- A ⚙ settings panel for every game with per-game resets and a reset-all option.
- Pause for Snake and Memory Bomb, Snake shop button and higher store prices.
- Backup image loading, ad filtering, GIF support, and double-tap to open a pinned image fullscreen.

Earlier highlights since v2.6.1:

- New Game Library with Snake, Memory Bomb and support for adding your own games.
- Snake: round world, modes, titles, Points Store, Swipe or Arrow buttons.
- Memory Bomb: bomb timer, tricks, roasts, wisdom and emoji sets that unlock as you climb.

See the [Releases](https://github.com/mrsae123/Image-Preview-/releases) page for full notes on every version.

## Project Status

Image Preview was originally created as a personal Tavo plugin, and the source is open under the MIT License.

It is meant to stay **community-minded**. If I ever stop maintaining it for a long period, anyone is welcome to fix, modify, improve and extend it, as long as the original copyright and license notice are kept.

## Credits

**Creator:** silent000 (Emon)

This project is made for **Tavo**.

## License

Image Preview is released under the **MIT License**.

You are free to use, modify, copy, and redistribute the project according to the terms of the MIT License.

See [`LICENSE`](LICENSE) for the full license text.

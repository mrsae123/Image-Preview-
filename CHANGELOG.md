# Changelog

All notable changes to Image Preview are documented here. Dates are approximate to when each version was built.

## v2.13.17
- "Save to device" no longer claims "Image exported." the instant it hands the file to Tavo's own Save-to-downloads/Share sheet. That sheet is the real feedback now, before you've even chosen anything; a toast still shows if something actually fails.

## v2.13.16
- Help, Info, Rename and the saved-image action sheet now stay correctly anchored to the phone screen even if the chat page scrolls or shifts around them.
- Fixed a side effect of that: these pop-ups could briefly pick up the wrong font size/spacing from the chat screen instead of the plugin's own look.
- The saved-image sheet's scroll position is protected again while its thumbnail is still loading.

## v2.13.15
- Fixed the saved-image sheet (and Info/Rename) still sometimes opening scrolled down, hiding the ✕ close button: a slow-loading thumbnail could make the browser quietly re-scroll the sheet right after it opened. Scrolling now stays locked to the top.
- A little warmth added back to the pouch-close rope-and-loop effect, without touching the heavier main-panel animation, so it stays smooth on slower phones.

## v2.13.14
- Fixed the ❔ Help button closing itself the instant it was tapped.
- Fixed pop-ups briefly overlapping each other when one closed and another opened right after it (e.g. tapping Info or Rename from the saved-image action sheet).
- Pop-ups now always reopen scrolled to the top, so the ✕ close button and Delete are never hidden.

## v2.13.13
- Performance pass: the black-hole and pouch animations now use movement and fading instead of animated blur, glow and shape changes, cutting lag on phones.
- Saved-preview and chat-profile thumbnails load a little lazier to lighten the initial work.
- Reduced-motion mode now closes pop-ups, the panel and pins instantly instead of waiting on animation timers.

## v2.13.12
- Fixed the game window's height quietly growing a little more every time it was reopened.
- Slowed the new v2.13.11 animations down so they're easier to actually see.
- Made the pouch/lasso close visually distinct from the pop-up crush-close.
- Added a matching TV-flicker close for unpinning an image.

## v2.13.11
- Fixed Snake's on-screen arrow pad shrinking the play board.
- Pop-ups now crush into the ✕ when closing.
- The game window and pinned images now open with a CRT-style flicker-in.
- The main panel now opens like a black hole pulling itself open, and closes with a drawstring-pouch pull.

## v2.13.10
- Quick Lookup is now a real rope-and-anchor: the ⚓ hangs from a rope and sways by itself. Pull it down to open the tools; tap it or pull it down again to close. The boxed corner button and the pull-up-to-close gesture are gone.
- Fixed the 🎮 Game Corner button, which did nothing.
- Fixed Rename on saved images. It now only changes the label, so images can no longer vanish. Images lost by the old rename reappear in Saved previews.
- Fixed Save preview doing nothing (or saying "already saved") when the same image had earlier been sent to the device.
- Closing pop-ups (image actions, Info, Rename, Help), the panel and the game now animates like opening does.
- Save to device no longer leaves temporary copies behind.
- Cancelling a touch on ❔ or 🎮 no longer opens them by accident.
- Rewrote the ❔ guide to match the current features.
- Buttons like Look up, Clear and Import from device are a little taller.

## v2.13.9
- Quick Lookup's closed state takes only a small ⚓ slot instead of disturbing the layout below.
- Help and Game Corner no longer fire their open action twice on one tap.
- (Known issues, fixed in 2.13.10: the Game Corner button, saved-image Rename and Save preview.)

## v2.13.8
- Quick Lookup collapses to a small ⚓ anchor.
- Saved previews use neutral labels such as "Saved image" and "Saved GIF".

## v2.13.7
- Added Rename to saved-image actions, with names shown under thumbnails.
- First pull-down anchor controls for Quick Lookup, Help and Game Corner.
- Safer paginated metadata lookup for Image Info.

## v2.13.6
- Delete now asks first, with a clear "are you sure?" before removing a saved image.
- Pop-ups (Info, Rename, image actions, Help) open and close with a smooth animation.
- Buttons and saved-image cards give a small press-down feel when tapped.
- Smoother scrolling in the main panel on lower-end phones.
- New: a single ❔ Help button in the panel header, explaining every feature in one place.

## v2.13.5
- Fixed: saving or pinning the same picture more than once no longer creates duplicate files.

## v2.13.4
- Fixed: pins made from a URL or webpage no longer show the generic label "Image" — they now get a real name from the page's title or the picture's filename, falling back to the site's domain if the filename is just a random code.
- Added missing translations for the image-actions sheet's headings.
- The pin-sort (newest/oldest) option and the pin toolbar's Info button, both added in v2.13.0, were intentionally removed around this version to simplify the pin list.

## v2.13.1
- Rename now opens a clear pop-up with Save/Cancel, instead of a tiny inline box.
- Fixed accidental renames triggered by losing focus, and taps on the rename box opening fullscreen by mistake.
- Replaced the pin toolbar's rename button with Rotate and Flip.
- Reset now also repositions a pin that ended up somewhere hard to reach.
- Crowded toolbars wrap onto a second row instead of clipping.
- Saved-preview cards show the real website an image came from, if known.
- Saved-preview cards are now a tap-to-open action sheet instead of a row of tiny buttons.

## v2.13.0
- Image Info: format, dimensions, file size, and source for any image.
- Save to device and Copy link on the live preview.
- Pin manager: rename and sort (newest/oldest) pins from the PINNED ON CHAT list; tap a row to open fullscreen.

## v2.12.0
- One ⚙ settings button for every game: shared player name, per-game options, per-game resets, and a "reset all games" option.
- Pause for Snake and Memory Bomb.
- Snake: points per bite by mode, a Shop button, and higher store prices.
- Backup image loading (tries other images if one fails), ad filtering, GIF support.
- Double-tap a pinned image to open it fullscreen.

## v2.11.0
- Snake: fully round world (wrap around edges), horror-style score titles, a Settings panel (mode + controls), and a choice between Swipe or on-screen Arrow buttons.
- Memory Bomb: new emoji sets unlock as you climb levels.

## v2.10.0
- Snake: Easy/Medium/Extreme modes, a Points Store (skins, food, boards), and childhood-memory score titles.
- Memory Bomb (replacing Memory Match): a bomb timer, move targets, card-swap tricks, funny fail titles, and a collectible wisdom library on wins.

## v2.9.0
- New Game Library: pick a game from a list at the top of the game window.
- Two new built-in games: Snake and Memory Match, alongside the original Jump Game.
- Support for adding your own games (paste HTML or import a file), run in an isolated sandbox.

## v2.6.1
- First stable release. Image preview and pinning, Quick Lookup, and the original Jump Game.

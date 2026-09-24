# Changelog

All notable changes to Image Preview are documented here. Dates are approximate to when each version was built.

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

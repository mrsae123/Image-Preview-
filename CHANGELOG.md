# Changelog

All notable changes to Image Preview are documented here. Dates are approximate to when each version was built.

## v2.21.1
- The look options (wallpaper, background, font, floating button icon and color) now live only in the little monkey's pop-up, so Settings stays short. Choices apply right away and "Back to defaults" undoes them.
- The monkey is now a small, cute baby monkey next to the panel title.
- Recycle Bin: Restore now puts images into the chat you have open instead of switching you to their original chat (Tavo can only save into the open chat, and switching mid-restore could cut it short). The Recycle Bin list refreshes right after a restore.
- Fixed: closing Game Corner while a custom game was still loading could leave that game running hidden in the background.
- Fixed: after deleting a saved image, an older refresh could briefly bring it back on screen.
- Fixed: Delete could say "deleted" (and remove the image's pin) even when the image had not actually reached the Recycle Bin. If it fails now, nothing is changed and you're told.
- Fixed: a failed download of an image link without a file extension could leave a temporary file behind.
- ? Help guide updated.

## v2.21.0
- Meet the monkey: a little monkey munches a banana at the top of the panel. Poke him and he gets grumpy, then opens "Make it yours" — wallpaper from your phone (or an image link), wallpaper darkness, panel background, panel font, and the floating button's icon and color, all in one place. Everything applies right away instead of waiting for the next chat, and one button returns to your Settings defaults.
- The bottom "Panel Look" section is gone; the monkey replaces it.
- ? Help guide updated.

## v2.20.0
- New "Wallpaper from phone": pick any photo from your phone as the panel background. It applies right away, is shrunk to a sensible size so the panel stays quick, and shows behind the panel and all its pop-ups. Remove wallpaper puts things back. A phone wallpaper takes priority over a pasted link or a preset.
- ? Help guide's "Make it yours" section updated.

## v2.19.0
- Customize the panel: pick a font (Default, Serif, Rounded, Monospace, Handwriting) and a background (Forest, Ocean, Sunset, Rose, Midnight, Aurora), or paste your own wallpaper image link and set how dark it is. It applies to the panel and all its pop-ups.
- Select and Clear all in Saved Previews are now disabled when there's nothing saved, instead of opening an empty selection bar.
- Tapping empty space on a pinned image's row no longer opens it fullscreen by accident. It has its own fullscreen button now.
- ? Help guide has a new "Make it yours" section.

## v2.18.0
- Fixed: Save selected / Save all could save duplicates if tapped twice quickly. Both buttons now lock while saving.
- Fixed: Save preview and Pin could claim success on a device-imported image whose file had already been deleted for good. They now check first and say the original is gone.
- New "Delete selected" in Saved Previews' Select mode, next to Pin selected. Sends just the ones you pick to the Recycle Bin (with a confirmation).
- Select all / Select none added to Extract images from text (the Recycle Bin already had them).
- Recycle Bin cards have a small fullscreen button, so you can look at an image before restoring it or deleting it forever.
- Floating button customization: choose an icon (Leaf, Classic, Moon, Star, Blossom, Butterfly, Wave, Orb) and a color theme (Forest, Violet, Sunset, Ocean, Rose, Monochrome) in Settings. The new default is a Forest leaf; Classic + Violet is one setting away.
- Pinning an image that's already in Saved Previews no longer re-scans every file each time (and a batch pin no longer re-scans once per image).
- Two confusing lines in the ? Help guide reworded, plus a small defensive CSS fix for a reported scroll snag.

## v2.17.0
- Extract images from text is now save-only (Save selected / Save all). Pinning moved to Saved Previews so you can save everything you found in one pass, then choose later what goes on the chat.
- New Select mode in Saved Previews: tap Select, pick any saved images, then Pin selected.
- New Recycle Bin: deleting a saved image (one at a time, or with Clear all) now moves it to a global Recycle Bin instead of erasing it. Restore puts it back in the chat it came from; anything left alone clears itself out after 7 or 30 days (your choice in Settings). Each image's countdown starts the moment it's deleted, and adding more later never resets an older one.
- New "Open Recycle Bin" action in the chat's right sidebar.
- The extraction picker no longer forces the main panel open.
- ? Help guide updated to match.

## v2.16.0
- Pinning an image now refreshes the Saved images shelf right away. Pinned images were always kept as saved files; the shelf just didn't update, which made unpinning look like it threw the image away.
- New "Clear all" next to "Pinned on chat" to unpin everything at once (with a confirmation). It only unpins; nothing is deleted from Saved images.
- Settings info text trimmed back down; the how-to guidance lives in the ? Help guide.

## v2.15.0
- New "Extract images from text" action in the chat input's + menu. Paste any wall of text or HTML — a character card, a copied post, anything — and tap it: the plugin pulls out every image/GIF link (ignoring the rest of the text) and shows them as a picker. Everything found starts selected; tap a tile to leave one out, then "Pin selected" pins the rest at once, or "Pin all" skips selection entirely. Broken links are marked and can't be pinned.

## v2.14.0
- "Reset floating button position" moved out of Settings and into a one-tap action in the chat's right sidebar. As a settings switch it had no way to turn itself back off — leaving it on kept silently re-resetting the button's position every time a chat was opened. Tapping the new sidebar action resets it once, snaps the button back immediately if it's on screen, gives it a small purple pulse, and confirms with a toast.
- Quick Lookup history (Translate / Meaning / Web Search) is now saved per chat instead of one shared device-wide list, so lookups from different conversations no longer get mixed together.

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

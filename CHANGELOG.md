# Changelog

All notable changes to Image Preview are documented here. Dates are approximate to when each version was built.

## v2.25.1
- Note: v2.24.0 and v2.25.0 were test builds that were never released. Everything in them is included here, on top of v2.23.0.
- New: **Terms of Use.** The first time you open Image Preview you tick a box to agree to a short, friendly Terms of Use (it also points to Tavo's own Terms of Service). Until you agree, nothing opens, scans, restores or tidies up: the floating button, Extract images from text, Scan this chat, the Recycle Bin and the Character page all ask first, and "Not now" keeps everything closed and keeps whatever you had typed. Your answer is only a version number and a time, stored on your device; read the terms again any time in ❔ Help → About & support. "Reset floating button position" still works without agreeing.
- New: **Character page.** Tap Character page in the panel (or in the chat's right sidebar, a new sidebar action) to read the open chat's character card as one scrollable page: creator notes, description, personality and scenario, with the pictures and GIFs right where the card put them, like a bot's intro page. It understands the rich text Janitor-style cards use as well as Markdown and plain text, fills in `{{user}}` and `{{char}}`, keeps bright text colours (not backgrounds), squeezes long runs of blank lines, lets you tap a picture to see it bigger, and has a name switcher for group chats. Pictures written as `//` links, `http://` links or embedded PNG/JPEG/GIF/WebP/AVIF/BMP data all work (never SVG). It reads the card on your device only when you open it and changes nothing; the text is only ever turned into a short allow-list of plain elements, so a card can't run code or load private addresses. Opening it from the panel closes the panel.
- New: **up to 30 pinned images** at once. A 31st pin asks you to remove one first, and "Pin selected" stops at 30 and says so. An older chat with more than 30 pins keeps the extra ones safe: they wait, are counted under Pinned on chat, and come back one by one as you remove pins.
- New: **Saved Previews shows 200 images at a time** (it stopped at 40 before), with a Show more tile at the end for the next batch.
- New: ❔ Help now has an **About & support** section (Terms of Use and a Discord link) and an "If something won't close or open" tip. The whole Help guide was brought up to date for the Character page, the 30-pin limit, Show more and the safer downloads, and the plugin description was cut down to the essentials.
- Security: **only images, GIFs and web pages are ever downloaded.** Links ending like a video, music file, archive, app, document, font or model file are refused before anything is fetched. For other links, and for links that end like an image, the plugin first asks the link's own server for its headers only (the body is never read; no cookies, no Referer) and refuses what isn't an image or a web page, and what is too big (images over 50 MB, web pages over 6 MB). When a server hides this, an oversized web page is thrown away unread, and an oversized image is deleted right after it arrives. Save all asks about its next links a few at a time (at most six) so it isn't slowed down. Web page previews give up after 30 seconds.
- Security: the plugin's internal events (open the Recycle Bin, reset the floating button, show the Extract picker, start a chat scan, open the Character page) now carry a version in their name, and an older copy of the panel that is still alive in the page after an update (before Tavo is restarted) can no longer react to them. The plugin also clears pins and pop-ups an older copy left behind. After updating, close Tavo completely and open it again once.
- Security: a character's avatar is only loaded if it is an app path or a public image address, like every other picture.
- Fixed: the **PINNED ON CHAT** list said "No pinned images yet" after reopening a chat even though the pins were on screen (it was drawn before the pins were restored). Restored pins are also pulled back into the visible area if they were saved under the top bar or off the side.
- Fixed: pop-ups now start below the app's top bar (and above the system bar), so a pop-up's × is never out of reach. Help and Character page also have a Close button at the bottom, and tapping outside still closes them.
- Fixed: tapping Save or Pin twice quickly could save or pin the same image twice. The same address already being downloaded now shares that one download.
- Fixed: "Extract images from text" cleared your typed text even when none of its links could be used (private-network links, for example). It now clears the text only once the picker really opens, and links starting with `//` (common in copied page code) are recognised.
- Fixed: a web page that never answered left "Loading…" on screen forever; it now gives up after 30 seconds, and an older tap can no longer overwrite a newer one. A download that finished after the plugin had given up could leave a stray copy; it is now deleted.
- Fixed: the Recycle Bin now writes (and checks) its entry before it removes the image, so a failed write can no longer leave a picture in neither place.
- Fixed: "already saved" now remembers up to 1,000 saved links and imported files (it was 300), so older images are still recognised.
- Fixed: Save all now shows "Saving 3 of 40…" and keeps its buttons locked while it works, even if you close and reopen the picker. A huge pasted `data:` image (over 8 million characters) is refused instead of being copied into your saved pins.
- Fixed: the floating button is kept on screen when the phone is rotated, and labels (open pop-ups and pin toolbars included) follow the language when it changes, also when Settings → Enabled is off.
- Improved: scanning a very large chat lets the screen breathe more often. Restoring pins, tidying temporary files and emptying an expired Recycle Bin now wait until the Terms are agreed to.
- No change to permissions (`file`, `network`, `variable`, `input`, `message`).

## v2.23.0
- Fixed: the "Found images" pop-up (Scan this chat for images, Extract images from text) squeezed its title and picture tiles together: part of the text was hidden, tiles overlapped and the grid couldn't be scrolled. The title, summary and buttons now keep their full size and only the picture grid scrolls. The Recycle Bin pop-up had the same problem and is fixed the same way.
- New: **Rescan chat always answers.** The button shows "Scanning…", then says what happened (no new images, how many are new, list updated, scan failed, or chat changed) and a toast repeats it. A rescan keeps the tiles you left out, and when nothing changed it leaves the grid (and its loaded pictures) alone. If the chat no longer has any image links, the old list is cleared instead of being left on screen.
- New: **no more duplicate saves.** Save selected and Save all (from Scan this chat for images and from Extract images from text) skip every image that is already in Saved Previews and save only the new ones. The picker marks those images "Saved" and they can't be ticked, so the counts show only what's new ("13 found · 3 already saved · 10 selected"), and the result reads like "Saved 10 new · 3 already saved". Import from device now also skips a file you already imported (matched by file name and size, remembered inside that chat only).
- Fixed: image links longer than 500 characters were never recognised as already saved, so they could be saved twice.
- Fixed: a Markdown image link with a query string (`![x](https://…/a.jpg?w=1)`) was listed twice, the second time with a stray ")" on the end. The link finder now trims a closing bracket or sentence punctuation stuck to the end of a bare link (one linear pass, so crafted text can't slow it down).
- Tidier panel: the repeated privacy lines and long hints are gone. The hint under "Scan this chat for images" is one short line, the drag hint shows only while there is a preview, "Saved images stay in this chat." replaces the old note (which said Delete removes images from storage, but they go to the Recycle Bin first), and finished status messages fade away on their own. Privacy details stay in the ? Help guide, the plugin description and `SECURITY.md`.
- Performance pass: in long lists, picture thumbnails now load as you scroll instead of all at once, and the picker uses one click handler and one error handler for the whole grid instead of two per tile.
- ? Help guide and the English and Bengali texts updated.
- No change to permissions (`file`, `network`, `variable`, `input`, `message`), link rules or the plugin's four internal events.

## v2.22.0
- New: **Scan this chat for images.** Tap it in the panel (or the chat's right sidebar) and the plugin searches the whole open chat — the character card (description, personality, scenario, first message, examples, notes, prompts, all greetings), the persona, the attached lorebooks (enabled entries) and every message, newest first — for image and GIF links, then shows them in the same picker as "Extract images from text". A summary line says where they came from, and Rescan searches again after the chat changes. It only runs when tapped, only reads (never changes anything), sends nothing anywhere, skips private-network and tracker links, and is capped (newest 5,000 messages, 6 MB of text, 200 tiles).
- New permission: `message` (read-only use), needed to read the chat's messages for the scan.
- Fixed: a mistake in the link finder (a variable that was never declared) that would have broken "Extract images from text" on engines that run scripts in strict mode.
- Security: only public web links can be opened or downloaded. `localhost`, home-network addresses (`192.168.x.x`, `10.x.x.x`, `*.local` ...), addresses with a username/password and non-web links (`javascript:`, `intent:`, `file:` ...) are refused, and the "Open" buttons follow the same rule.
- Security: games you add now run with no network access at all (a strict Content-Security-Policy sits at the very top of each game's page, on top of the existing sandbox). Games must be one self-contained HTML file with no outside links, as the "Copy AI prompt" text already asks.
- Security: "Extract images from text" now reads only the first 300,000 characters, returns at most 1,000 links, scans in one linear pass so a crafted paste can no longer freeze the app, shows at most 200 tiles (and says so), and skips private-network links.
- Fixed: deleting many images at once could make the Recycle Bin lose entries (their files stayed but were no longer listed). Deletes into the bin now go one at a time.
- Fixed: an interrupted restore (app closed mid-way) could leave entries listed whose image had already moved. Entries are now removed the moment their copy is safe, and entries whose file is gone are dropped.
- Fixed: a download that never finishes could lock the Save buttons for good. Downloads now give up after 45 seconds.
- Fixed: one damaged Recycle Bin entry can no longer make the whole bin fail to open; expired-entry cleanup keeps entries whose file could not be deleted so it can retry.
- Fixed: tapping Clear all twice quickly could run it twice.
- Fixed: if Tavo removed the plugin while a pop-up was open, the pop-up could stay stranded on screen.
- New `SECURITY.md` explains what the plugin does with data and how to report a problem.
- Security: a wallpaper link pointing at a private address is refused too.

## v2.21.1
- Note: this version was taken down from GitHub and Discord so security hardening and stress tests could be finished. That work shipped in v2.22.0 and later; please update if you installed v2.21.1 (including from the Tavo Hub).
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

# Security Policy

Image Preview is a free, open-source plugin for Tavo. It has no server, no account and no analytics, and it never sends your chats, characters or personas anywhere.

## Reporting a problem

Please report security issues **privately**: open the repository's **Security** tab and choose **Report a vulnerability**. Please don't post details in public issues or Discord before it's fixed. A short description and the steps to reproduce are enough.

Only the latest release is supported.

## What the plugin does with your data

| What | Where it goes |
| --- | --- |
| Saved images, pins, Recycle Bin, settings, game data | Stays on your device, inside Tavo |
| Quick Lookup text (only when you tap "Look up", up to 1,000 characters) | HTTPS to Google Translate, Lingva, MyMemory, dictionaryapi.dev, Wiktionary, Wikipedia, DuckDuckGo or Brave Search. Privacy Mode blocks all of it |
| Brave Search API key (optional) | Only to `api.search.brave.com`, as a request header. Never in a URL, never to another host |
| Images and pages you ask it to preview or save | Downloaded from the address you gave. That site sees your IP address, but no Referer |
| Everything else (chats, characters, personas, message text) | Never read for sending anywhere |

## Guardrails built in

- **Links:** only public `http(s)` addresses are opened or downloaded. `localhost`, private and link-local ranges, `*.local` and other intranet-style names, IPv6 literals, addresses with a username/password and non-web schemes (`javascript:`, `intent:`, `file:`, `data:` other than images) are refused.
- **No unsafe HTML:** every piece of stored, downloaded or typed text is escaped before it is shown. Automated tests feed hostile names, links and saved data through every screen.
- **Added games:** run in a sandbox with only `allow-scripts` (no same-origin access, popups, forms, downloads or navigation) and a Content-Security-Policy that blocks all network access. Messages from a game are accepted only from its own frame and reduced to a number or a small settings object.
- **Bounded work:** pasted text is capped and scanned in one linear pass, Extract shows at most 200 links, lookups are capped at 1,000 characters, downloads time out after 45 seconds.
- **No outside code:** the package loads no scripts, fonts or styles from the internet and has no dependencies.
- **Least privilege:** the plugin doesn't create, edit or delete characters, personas, chats or presets.

## Known limits (honest list)

- A public address that redirects to a private one, or a hostname that resolves to a private IP, can't be detected by the plugin itself.
- The lookup services above can see the text you send them. Use Privacy Mode if that matters.
- Scripts running on the same chat page (for example inside a character card) can trigger the plugin's three internal events (open Recycle Bin, reset the floating button, show the Extract picker). They can't make it save or delete anything on their own.
- The plugin's saved data lives in Tavo's variable storage. Whether other scripts can read it depends on Tavo. If you use the optional Brave key, use a free one.
- The games' network block relies on the app's built-in web engine honouring Content-Security-Policy, which current Android WebView does.

## For anyone installing

Only install `.tpg` files from this repository's **Releases** page and compare the SHA-256 shown beside the file. A copy from anywhere else could have been modified.

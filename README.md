# Flag Hub

Home base for flags across every app and project, plus the shared kit every app loads.

- **Flag Hub app:** https://claude.ai/artifact/PGWTqtLu7cZqtf8ugUoEDs (raise flags for any project, night shift switch, approve or deny proposals)
- **App flags:** planted inside apps, they arrive here as Issues labeled `flag`.
- **status.json:** what the Scriptable widget and Claude OS read (mode, open flags, waiting proposals, last run).

## The kit (`kit/kit.js`)

One line before `</body>` in any app:

```html
<script src="https://cdn.jsdelivr.net/gh/Feirzen/flag-hub@main/kit/kit.js"
        data-app="study-decks" data-name="Study Decks" defer></script>
```

It adds the settings gear (top right) with:
- **Look:** Light, Dark, Sepia, Chameleon. When Chameleon is on, the gecko token sits next to the gear: tap it for new colors, tap its lock to freeze.
- **Flag:** plant a flag on anything (also long-press on phone, right-click on computer) or send general feedback.

Apps color themselves with these CSS variables:
`--bg --surface --surface2 --border --border2 --text --dim --muted --accent --accBg --ok --bad --star --scrim --shadow`

Optional hooks: `Kit.tray.add({id, icon, label, onClick})`, `Kit.theme.reroll()` (call on screen change), `Kit.theme.onChange(fn)`.

After changing the kit, refresh the CDN copy: `https://purge.jsdelivr.net/gh/Feirzen/flag-hub@main/kit/kit.js`

## Night shift rules

| Mode | What runs |
|---|---|
| Off | Nothing |
| Light | Up to 2 small fixes or 1 proposal |
| Go Big | Up to 5 fixes or 2 bigger builds as proposals |

- Small, low-risk fixes ship directly. Anything bigger becomes a proposal in the Hub (Approve / Deny).
- Approved proposals ship on the next run.
- No new flags = stop right away.

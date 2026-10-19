# Flag Hub

Home base for flags across every app and project, plus the shared kit every app loads.

- **Flag Hub:** https://feirzen.github.io/flag-hub/ (raise flags for any project, night shift switch, approve or deny proposals)
- **data/flags.json:** every flag, proposal, and night shift run. The Hub, the kit, and the night shift all read and write this file.
- **App flags:** with the device connected (key saved once in the Hub), flags from any app go straight into data/flags.json. Without it, they open a filled-in GitHub Issue labeled `flag`.
- **status.json:** what the Scriptable widget and Claude OS read (mode, open flags, waiting proposals, last run).

## The kit (`kit/kit.js`)

One line before `</body>` in any app:

```html
<script src="https://feirzen.github.io/flag-hub/kit/kit.js"
        data-app="study-decks" data-name="Study Decks" defer></script>
```

It adds the settings gear (top right) with:
- **Look:** Light, Dark, Sepia, Chameleon. When Chameleon is on, the gecko token sits next to the gear: tap it for new colors, tap its lock to freeze.
- **Flag:** plant a flag on anything (also long-press on phone, right-click on computer) or send general feedback.

Apps color themselves with these CSS variables:
`--bg --surface --surface2 --border --border2 --text --dim --muted --accent --accBg --ok --bad --star --scrim --shadow`

Optional hooks: `Kit.tray.add({id, icon, label, onClick})`, `Kit.theme.reroll()` (call on screen change), `Kit.theme.onChange(fn)`.


## Night shift rules

| Mode | What runs |
|---|---|
| Off | Nothing |
| Light | Up to 2 small fixes or 1 proposal |
| Go Big | Up to 5 fixes or 2 bigger builds as proposals |

- Small, low-risk fixes ship directly. Anything bigger becomes a proposal in the Hub (Approve / Deny).
- Approved proposals ship on the next run.
- No new flags = stop right away.

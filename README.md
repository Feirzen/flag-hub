# Flag Hub

Home base for flags across every app and project, plus the shared kit every app loads.

- **Flag Hub:** https://feirzen.github.io/flag-hub/ (raise flags for any project, night shift switch, approve or deny proposals)
- **data/flags.json:** every flag, proposal, and night shift run. The Hub, the kit, and the night shift all read and write this file.
- **App flags:** with the device connected (key saved once in the Hub), flags from any app go straight into data/flags.json. Without it, they open a filled-in GitHub Issue labeled `flag`.
- **data/apps.json:** the app library. Each app's state (on, focus, paused), lane (cloud or PC), labels, north-star vision, and suggestions he turned down. Edited from the Apps tab in the Hub.
- **Suggestions:** concept flags (kind `concept`, purple) that only Claude creates. Plant one and it becomes a normal flag; turn it down and it's remembered in apps.json so it never comes back.
- **status.json:** what the Scriptable widget and Claude OS read (mode, open flags, waiting proposals, last run).
- **Claude OS:** https://feirzen.github.io/flag-hub/os/ (desk display on the old iPhone: clock, weather, the day, timers, alarms, flags, and a message board). Personal data in `os/data/` is locked so only the phone can read it. Tasks post to it with `os/POSTING.md`.

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
| Off | Nothing (the runs stop without writing anything) |
| Light | Cloud: up to 2 items a night. PC: 1 |
| Go Big | Cloud: up to 5, PC: up to 3, plus a few suggestions when there's room |

- Order every night: his decisions (approved, sent back) → priority flags → normal flags → suggestions. Focus apps go first inside every step; paused apps are skipped.
- Small, low-risk fixes ship directly. Anything bigger becomes a proposal in the Hub.
- Prompts live in `night-shift/` (cloud-run-prompt.md, pc-run-prompt.md).

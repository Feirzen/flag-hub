# Posting to Claude OS

Claude OS is Steven's desk display (old iPhone, sideways, always on): https://feirzen.github.io/flag-hub/os/

Personal data is **locked**: anyone can lock data with the public key, but only the phone (which knows the passcode) can unlock it. Never commit unlocked personal data to this repo. It is public.

Two files, both in `os/data/`:

| File | What | Who writes it |
|---|---|---|
| `today.json` | Weather + the day ahead. Replaced each time. | The "Claude OS: morning update" scheduled task |
| `inbox.json` | Message board. Newest 40 kept. | Any scheduled task or chat that wants to tell Steven something |
| `blueprints.json` | Bilingual Blueprints summary (site flags, follow-ups, leads). Replaced each time. | The morning update |

The phone checks every minute (GitHub can take up to ~5 minutes to show a change).

## How to post a message (any scheduled task)

1. Get the locking tool: `curl -sL https://raw.githubusercontent.com/Feirzen/flag-hub/main/os/tools/seal.mjs -o seal.mjs`
   (or read `os/tools/seal.mjs` with the GitHub connector and save it as `seal.mjs`).
2. Get the current inbox the same way: `os/data/inbox.json` saved as `inbox.json`. Note its `sha` if using the GitHub connector.
3. Write `msg.json`:
   ```json
   { "from": "Night shift", "title": "2 fixes shipped", "body": "One short plain sentence or two.", "level": "good", "link": "https://...", "expires": "2026-11-03T00:00:00Z" }
   ```
   - `level`: `info` (default, purple), `good` (green), `warn` (amber), `alert` (red).
   - `link` and `expires` are optional. Use `expires` for things that stop mattering (deals, reminders).
   - Optional `action`, which the phone carries out when it sees the message:
     - `{ "type": "alarm", "time": "06:30", "label": "Gym", "days": [1,3,5] }` (days: 0 = Sunday; leave out for a one-time alarm)
     - `{ "type": "timer", "minutes": 20, "label": "Laundry" }` (only starts if the phone sees it within 10 minutes)
4. Run `node seal.mjs message msg.json inbox.json > inbox.new.json`
5. Commit `inbox.new.json` as `os/data/inbox.json` (GitHub connector `create_or_update_file` with the sha from step 2, or git). Commit message: `Claude OS: <title>`.

Keep messages short and only send ones worth his attention. No message is better than a filler one.

## The Today file

`today-payload.json` shape (all fields optional except what you have):

```json
{
  "weather": { "place": "Lehi", "tempF": 41, "condition": "Clear", "icon": "clear", "high": 58, "low": 34, "precipChance": 10,
               "summary": "One plain sentence.", "sunrise": "07:58", "sunset": "18:21" },
  "day": { "headline": "One line, shown under the clock", "summary": "Two or three plain sentences about the day.",
           "events": [{ "start": "09:00", "end": "10:00", "title": "Dentist", "where": "Lehi" }], "allDay": ["Riana's birthday"] },
  "calendar": { "days": [ { "date": "2026-10-27", "events": [
      { "start": "09:00", "end": "10:15", "title": "Organic Chem", "kind": "routine" },
      { "start": "14:00", "end": "14:30", "title": "Stop by the TA", "kind": "key" },
      { "allDay": true, "title": "Riana's mom's birthday", "kind": "key" } ] } ] },
  "extra": { "spanish": { "word": "madrugar", "meaning": "to get up really early" } }
}
```

- `weather.days`: next 4 days, `[{ "date", "icon", "high", "low", "precip" }]`.
- `day.tags`: what kind of day it is, like `["School day"]` or `["Work day"]`. `day.events`: only the events that make today different (not routine ones).
- `calendar.days`: today plus the next 6 days, every event. `kind` is `routine` (wake up, bedtime, daily habits, regular classes, regular work shifts; shown faded), `key` (the things that make a day unique; shown glowing) or `normal`.

`blueprints.json` (locked with `node seal.mjs file bp.json > blueprints.json`):
`{ "updatedAt", "flags": [{ "note", "site", "status" }], "followups": [{ "business", "stage", "due" }], "newLeads": 0, "clients": 0 }`

`icon` is one of: `clear, partly, cloudy, rain, storm, snow, fog, wind`. Times are 24-hour `HH:MM`, local (America/Denver).

Then: `node seal.mjs today today-payload.json > today.json` and commit it as `os/data/today.json`.

## Changing the passcode

`node os/tools/keygen.mjs "new passcode" > os/data/key.json`, then paste the printed public key into `PUBLIC_KEY` in `os/tools/seal.mjs`, re-lock `today.json` and reset `inbox.json`, and commit. On the phone: Settings, Forget passcode, type the new one.

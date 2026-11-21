# Brain dump splitter

For your Plant a Flag brainstorming flag (s20261118142357).

**Short answer:** no new setup. You keep talking to Siri the same way. The night shift just adds one step when it files your Siri notes.

## What changes for you

- Ramble as long as you want. One Siri note can turn into several flags.
- Each real to-do becomes its own flag, filed under the right project (Fix, For me, or Ideas).
- Side thoughts that aren't actionable go to Ideas, so nothing gets lost.
- Every piece keeps a link back to what you actually said (the `heard` text plus `from: <original id>`), so you can always check my read.
- Short, single-thought notes work exactly like today.

## The step to add (drop-in text for both night shift prompts)

Put this right after the "Siri inbox" bullet in step 1:

> - Brain dumps: if a Siri note (or a flag with source "siri" created since the last run) holds more than one separate ask, split it. File each actionable piece as its own flag with the right label and kind, file non-actionable side thoughts as kind "idea", and give every piece `from: <original id>` and the full `heard`. Mark the original "done" with resolution "Split into N flags". Never split a note that's one connected thought, and never invent asks he didn't say. If unsure, leave it whole and set note "Want me to split this?".

## To turn it on

Tell Claude "turn on the brain dump splitter" in any chat with the Flag Hub. It adds the step above to `night-shift/cloud-run-prompt.md`, `night-shift/pc-run-prompt.md`, and the scheduled task itself. I didn't change the night shift's own instructions on my own, since that changes how every night runs.

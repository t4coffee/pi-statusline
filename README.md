# pi-statusline

Two-line status footer for [Pi](https://pi.dev).

```
42% · ctx 1.2k · ~/code/app · $0.42                    gpt-5.6-luna · high · ⎇ main
● 🐴 ponytail: ⚡ FULL · skill:brainstorming
```

Line 1: context percentage, context tokens, working directory, session cost, model, thinking level, git branch.

Line 2 appears only while something is in use: statuses published by loaded extensions (`ctx.ui.setStatus`) and skills loaded this session (a `SKILL.md` read or `/skill:name`).

Colors follow the Catppuccin style guide's *Rainbow Highlights (Brackets, Headings, etc.)*: one hue per field, separators in Color #3 (yellow, `warning`), nothing rendered dim.

## Install

From git:

```bash
pi install git:github.com/t4coffee/pi-statusline
```

Or drop the file in place:

```bash
mkdir -p ~/.pi/agent/extensions
curl -o ~/.pi/agent/extensions/status-line.ts \
  https://raw.githubusercontent.com/t4coffee/pi-statusline/main/extensions/status-line.ts
```

Do not do both — two copies means two footers.

## Notes

- Uses only public extension APIs; adds nothing to the model context, so it costs zero tokens per prompt.
- Colors map to theme tokens (`error`, `warning`, `success`, `mdLink`, `accent`, `text`, `muted`), so any theme works. Pi's built-in themes only ship five vivid hues, hence effort and branch use foreground and muted to stay distinct.
- Skill tracking starts at session start: skills loaded earlier in a resumed session show up on their next `SKILL.md` read.

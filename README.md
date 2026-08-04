# TodoFlowy Pomodoro & Focus Plugin (`pomodoro-focus`)

A production-grade Pomodoro Timer & Focus Statistics plugin for TodoFlowy.

## Features

- **Sidebar Panel (`sidebar-panel`)**: Visual timer, todo selection, real-time focus control, and statistics dashboard.
- **Toolbar Action (`toolbar-action`)**: One-click quick toggle/start for focus sessions (`pomodoro-focus.start`).
- **Settings Section (`settings-section`)**: Customizable focus duration (e.g. 25 min), short break (5 min), long break (15 min), auto-start settings, and tag formatting options.
- **Automatic Todo Updates**: Automatically appends focus progress to the selected Todo note upon session completion with strict `revision` check.
- **Focus Statistics**: Tracks daily and total focus minutes, completed pomodoros, and per-todo statistics isolated per user.

## Capabilities

- `todos:read`: Fetch pending todos for selection.
- `todos:write`: Safely update todo notes with completed pomodoro records.
- `storage:read` & `storage:write`: Account-isolated storage for timer state, settings, and focus logs with `version: 1` schema verification.
- `ui:toast`: Render host native completion toasts.
- `theme:read` & `context:locale`: Theme and locale awareness.

## Build and Verification

```bash
pnpm install
pnpm verify
```

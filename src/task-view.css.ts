export const TASK_VIEW_CSS = `
:root {
  color-scheme: light dark;
}

html,
body {
  min-width: 0;
  min-height: 100%;
  margin: 0;
}

body {
  background: var(--theme-bg-color, #ffffff);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.pomodoro-view {
  display: grid;
  width: 100%;
  min-height: 100%;
  place-items: start center;
  padding: 32px 24px;
  color: var(--theme-text-color, #1f2937);
  background: var(--theme-bg-color, #ffffff);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.pomodoro-view__layout {
  display: grid;
  width: min(100%, 640px);
  gap: 16px;
}

.pomodoro-view__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  border: 1px solid var(--theme-border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--theme-card-bg, #f9fafb);
}

.pomodoro-view__mode-badge {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.pomodoro-view__timer {
  color: var(--theme-primary-color, #ef4444);
  font-size: clamp(48px, 9vw, 72px);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}

.pomodoro-view__todo-select {
  width: min(100%, 440px);
  min-width: 0;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--theme-border-color, #d1d5db);
  border-radius: 6px;
  outline: none;
  color: var(--theme-text-color, #111827);
  background: var(--theme-input-bg, #ffffff);
  font: inherit;
}

.pomodoro-view__todo-select:focus-visible,
.pomodoro-view__btn:focus-visible {
  outline: 2px solid var(--theme-primary-color, #ef4444);
  outline-offset: 2px;
}

.pomodoro-view__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: min(100%, 440px);
  gap: 8px;
}

.pomodoro-view__btn {
  flex: 1 1 160px;
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.pomodoro-view__btn--primary {
  color: #ffffff;
  background: var(--theme-btn-primary-bg, #ef4444);
}

.pomodoro-view__btn--primary:hover {
  opacity: 0.9;
}

.pomodoro-view__btn--secondary {
  color: var(--theme-text-color, #374151);
  background: var(--theme-btn-secondary-bg, #e5e7eb);
}

.pomodoro-view__btn--secondary:hover {
  background: var(--theme-btn-secondary-hover, #d1d5db);
}

.pomodoro-view__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  gap: 10px;
}

.pomodoro-view__stat-box {
  min-width: 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--theme-card-bg, #f3f4f6);
  text-align: center;
}

.pomodoro-view__stat-num {
  color: var(--theme-stat-color, #111827);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}

.pomodoro-view__stat-label {
  margin-top: 3px;
  overflow-wrap: anywhere;
  color: var(--theme-muted-color, #6b7280);
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 480px) {
  .pomodoro-view {
    padding: 16px;
  }

  .pomodoro-view__card {
    padding: 24px 16px;
  }

  .pomodoro-view__stats {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pomodoro-view__btn {
    transition: none;
  }
}
`;

export const SIDEBAR_PANEL_CSS = `
.pomodoro-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--theme-text-color, #1f2937);
  background-color: var(--theme-bg-color, #ffffff);
  border-radius: 8px;
  box-sizing: border-box;
}

.pomodoro-panel__card {
  background: var(--theme-card-bg, #f9fafb);
  border: 1px solid var(--theme-border-color, #e5e7eb);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pomodoro-panel__mode-badge {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--mode-badge-bg, #fee2e2);
  color: var(--mode-badge-fg, #dc2626);
}

.pomodoro-panel__timer {
  font-size: 42px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--theme-primary-color, #ef4444);
  letter-spacing: -0.02em;
}

.pomodoro-panel__todo-select {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color, #d1d5db);
  background: var(--theme-input-bg, #ffffff);
  color: var(--theme-text-color, #111827);
  outline: none;
}

.pomodoro-panel__controls {
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: center;
}

.pomodoro-panel__btn {
  flex: 1;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.pomodoro-panel__btn--primary {
  background-color: var(--theme-btn-primary-bg, #ef4444);
  color: #ffffff;
}

.pomodoro-panel__btn--primary:hover {
  opacity: 0.9;
}

.pomodoro-panel__btn--secondary {
  background-color: var(--theme-btn-secondary-bg, #e5e7eb);
  color: var(--theme-text-color, #374151);
}

.pomodoro-panel__btn--secondary:hover {
  background-color: var(--theme-btn-secondary-hover, #d1d5db);
}

.pomodoro-panel__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.pomodoro-panel__stat-box {
  background: var(--theme-card-bg, #f3f4f6);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.pomodoro-panel__stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-stat-color, #111827);
}

.pomodoro-panel__stat-label {
  font-size: 12px;
  color: var(--theme-muted-color, #6b7280);
  margin-top: 2px;
}
`;

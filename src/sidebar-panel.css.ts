export const SIDEBAR_PANEL_CSS = `
:host, .pomodoro-studio-app {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--theme-text-color, CanvasText);
  background-color: var(--theme-bg-color, Canvas);
}

.pomodoro-studio-app {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部 App Bar */
.pomodoro-studio__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
}

.pomodoro-studio__title {
  font-size: 20px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pomodoro-studio__badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  background: var(--theme-badge-bg, rgba(239, 68, 68, 0.15));
  color: var(--theme-badge-fg, #ef4444);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.pomodoro-studio__pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pomodoro-studio__pill {
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 桌面级双列网格 Bento Grid (全宽 100%) */
.pomodoro-studio__grid {
  display: grid;
  grid-template-columns: 1fr minmax(320px, 380px);
  gap: 20px;
  width: 100%;
  flex: 1;
}

@media (max-width: 820px) {
  .pomodoro-studio__grid {
    grid-template-columns: 1fr;
  }
}

/* 左栏：主专注控制台 */
.pomodoro-studio__main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 预设模式 Selector Bar */
.pomodoro-presets {
  display: flex;
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  padding: 6px;
  border-radius: 12px;
  gap: 8px;
}

.pomodoro-preset-btn {
  flex: 1;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--theme-muted-color, #6b7280);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.pomodoro-preset-btn--active {
  background: var(--theme-primary-color, #ef4444);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

/* 大气超大 Timer 核心卡片 */
.pomodoro-timer-card {
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  border-radius: 20px;
  padding: 36px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  flex: 1;
  justify-content: center;
}

.pomodoro-timer-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 5px;
  background: linear-gradient(90deg, #ef4444, #f59e0b);
}

.pomodoro-mode-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.pomodoro-timer-display {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 80px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--theme-text-color, CanvasText);
  line-height: 1;
  margin: 10px 0;
}

/* 当前目标 Todo Banner */
.pomodoro-target-banner {
  width: 100%;
  max-width: 580px;
  background: var(--theme-bg-color, Canvas);
  border: 1px dashed var(--theme-border-color, rgba(125, 125, 125, 0.3));
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pomodoro-target-banner__header {
  font-size: 12px;
  font-weight: 700;
  color: var(--theme-muted-color, #6b7280);
  display: flex;
  justify-content: space-between;
}

.pomodoro-target-banner__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--theme-text-color, CanvasText);
}

/* 控制按钮组 */
.pomodoro-controls-row {
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 480px;
}

.pomodoro-btn-giant-primary {
  flex: 2;
  padding: 16px;
  font-size: 16px;
  font-weight: 800;
  border-radius: 12px;
  border: none;
  background: var(--theme-primary-color, #ef4444);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.pomodoro-btn-giant-primary:hover {
  opacity: 0.95;
}

.pomodoro-btn-giant-primary:active {
  transform: scale(0.98);
}

.pomodoro-btn-giant-sub {
  flex: 1;
  padding: 16px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  color: var(--theme-text-color, CanvasText);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

/* 右栏：侧边管理抽屉 (Task Picker & Timeline Logs) */
.pomodoro-studio__sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pomodoro-panel-card {
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pomodoro-search-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  background: var(--theme-bg-color, Canvas);
  color: var(--theme-text-color, CanvasText);
  outline: none;
}

.pomodoro-search-input:focus {
  border-color: var(--theme-primary-color, #ef4444);
}

.pomodoro-todo-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  background: var(--theme-bg-color, Canvas);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pomodoro-todo-card:hover, .pomodoro-todo-card--selected {
  border-color: var(--theme-primary-color, #ef4444);
  background: var(--theme-badge-bg, rgba(239, 68, 68, 0.1));
}

.pomodoro-timeline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--theme-border-color, rgba(125, 125, 125, 0.2));
  font-size: 13px;
}

.pomodoro-timeline-item:last-child {
  border-bottom: none;
}
`;

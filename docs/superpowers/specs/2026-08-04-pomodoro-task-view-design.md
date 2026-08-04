# Pomodoro Focus Task View Design

## Problem

Pomodoro Focus declares its full timer UI as a `sidebar-panel`. TodoFlowy therefore mounts the timer inside the 208 px navigation sidebar and constrains the view to 220 px height. The timer, todo selector, controls, and two-column statistics do not fit that slot, producing nested vertical scrolling and horizontal overflow.

## Decision

Expose the full Pomodoro Focus interface as a `task-view` so selecting the plugin opens it in TodoFlowy's main work area. Keep the existing `toolbar-action` for quick start and the existing `settings-section` for configuration. Remove the `sidebar-panel` extension rather than maintaining two copies of the same full interface.

The task view will use a bounded, responsive workbench layout: one timer region and one compact statistics region, with controls wrapping safely at narrow content widths. It will use the host theme variables, avoid document-level overflow, and retain the existing timer, todo selection, persistence, event, and toast behavior.

## Alternatives Considered

1. Keep the full UI in `sidebar-panel` and compress it. Rejected because the complete timer workflow is too dense for the navigation column and would continue to displace project navigation.
2. Provide both a compact sidebar panel and a full task view. Deferred because it introduces a second presentation and synchronization surface without being required to fix the reported problem.
3. Move the existing full interface to `task-view`. Selected because it matches TodoFlowy's plugin navigation model and is the smallest coherent fix.

## Implementation

- Change the manifest extension slot from `sidebar-panel` to `task-view` and give the extension a task-view-oriented ID.
- Rename the source/build entry and tests from sidebar panel to task view so package semantics match runtime behavior.
- Adapt the CSS for the main workspace, including global box sizing, bounded content width, responsive control/stat layouts, visible keyboard focus, and no nested document scrolling.
- Update README and package assertions to describe and verify the task-view extension.
- Bump the plugin version to `1.0.2`; do not overwrite `1.0.1`.

## Verification

- Unit tests cover mounting and timer interactions through the renamed task-view entry.
- Package tests verify the manifest exposes `task-view`, not `sidebar-panel`, and contains the expected executable entry.
- `pnpm verify` must pass, including build, no-emit typecheck, tests, coverage, and executable-module validation.
- Inspect the built package and run the established TodoFlowy candidate health/install path before publication.

## Out of Scope

- A separate compact sidebar timer.
- Changes to TodoFlowy's host slot layout.
- Changes to Pomodoro timing rules, storage schema, permissions, or commands.

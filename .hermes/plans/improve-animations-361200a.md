# Improve Animations — Audit & Plans

Commit: `361200a`

## Recon

- Stack: Angular 16+, standalone components, `StaggerService` using WAAPI `Element.animate()`, CSS keyframes for route/modal/toast/preloader/sidebar.
- Motion surfaces:
  - Global tokens: `--transition-fast: 120ms ease`, `--transition: 200ms ease`
  - Route transition: `220ms ease`
  - Modal: `220ms cubic-bezier(0.22, 1, 0.36, 1)`
  - Toast: `280ms cubic-bezier(0.22, 1, 0.36, 1)`
  - Stagger: `450ms`, delay step `60ms`, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
  - Sidebar hover: `250ms ease-out` enter, `250ms ease-in` leave
  - Preloader/ambient: continuous `ease-in-out` / `linear` keyframes
- Personality: crisp dashboard with restrained motion; occasional ambient decoration.
- Frequency map:
  - 100+/day: sidebar hover, button hover/press, table row hover
  - tens/day: route changes, modal opens, toast appearances, stagger entrances
  - occasional: empty-state reveal, form validation feedback
  - rare: login page first view, success/error states

## Vet Notes

Re-read cited files before planning. Only findings worth changing in a dashboard UI are included.

## Findings

| # | Severity | Category | Location | Finding | Fix summary |
|---|---------|----------|----------|---------|-------------|
| 1 | HIGH | Easing & duration | `src/app/features/layout/layout.component.ts:87` | Sidebar leave animation uses `ease-in`, making hover feedback feel sluggish on exit. | Switch to `ease-out` for leave. |
| 2 | HIGH | Easing & duration | `src/styles.css:31`, `src/styles.css:146`, `src/app/features/dashboard/dashboard.component.css:24`, `src/app/features/reports/reports.component.css:9` | Global `ease` is used for stat cards and many transitions; UI entrances/hovers feel mushy. | Replace with strong `cubic-bezier(0.23, 1, 0.32, 1)` token. |
| 3 | MEDIUM | Performance | `src/styles.css:186` | Buttons use `transition: all var(--transition-fast)`, which animates unintended properties and burns GPU. | Switch to explicit `background-color`, `border-color`, `box-shadow`, `transform` transitions. |
| 4 | MEDIUM | Easing & duration | `src/app/features/layout/layout.component.ts:61` | Route transition duration `420ms` is above the UI motion budget and feels slow on navigation. | Reduce to `260ms` with strong ease-out. |
| 5 | MEDIUM | Accessibility | `src/styles.css:523` toast host + no reduced-motion rules | No `prefers-reduced-motion` handling for toasts, modals, stagger, ambient motion. | Add reduced-motion block that keeps opacity/color but drops positional transforms. |
| 6 | LOW | Cohesion & tokens | `src/app/core/services/stagger.service.ts:23` | Stagger uses its own hardcoded `cubic-bezier(0.25, 0.46, 0.45, 0.94)` instead of a shared token. | Migrate stagger easing to a shared motion token. |

## Missed Opportunities

- Empty-state swaps are hard state changes with no transition; a brief `180ms` fade avoids a pop.
- Sidebar active-state background swaps are instant while other UI uses motion; a brief transition makes section switching feel smoother.
- Stat card hover lift is present, but row hover stays binary; a subtle `translateY(-1px)` + shadow lift on data rows matches the dashboard feel without hurting scrolling performance.

## Recommended Execution Order

1. `001-stagger-easing-token.md`
2. `002-route-transition-tuning.md`
3. `003-sidebar-hover-easing.md`
4. `004-button-transition-explicitness.md`
5. `005-reduced-motion-support.md`
6. `006-empty-state-transition.md`

## Status

| Plan | Status |
|------|--------|
| 001-stagger-easing-token.md | planned |
| 002-route-transition-tuning.md | planned |
| 003-sidebar-hover-easing.md | planned |
| 004-button-transition-explicitness.md | planned |
| 005-reduced-motion-support.md | planned |
| 006-empty-state-transition.md | planned |

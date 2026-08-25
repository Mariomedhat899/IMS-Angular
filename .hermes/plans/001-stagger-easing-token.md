# Plan 001: Stagger easing token

Commit: `361200a`
Scope: `src/app/core/services/stagger.service.ts`, `src/styles.css`

## Current code

`src/app/core/services/stagger.service.ts:15`
```ts
el.animate(
  [
    { opacity: '0', transform: 'translateY(14px) scale(0.98)' },
    { opacity: '1', transform: 'translateY(0) scale(1)' }
  ],
  {
    duration: 450,
    delay,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fill: 'backwards'
  }
);
```

`src/styles.css:30`
```css
--transition-fast: 120ms ease;
--transition: 200ms ease;
```

## Target values

- Stagger easing token: `cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out)
- Shared motion tokens:
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);`
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);`

## Steps

1. Add motion tokens to `src/styles.css` near existing `--transition` tokens.
2. Update `StaggerService.ts` to read the stagger easing from a token.
3. Build: `npx ng build --configuration production`
4. Feel-check: slow stagger entrances in devtools; confirm motion feels crisper without changing duration.

## Hard scope boundaries

- Do not change stagger duration or delay step.
- Do not touch modal, toast, route, or sidebar motion here.

## Verification

- `git diff --name-only` shows only `src/styles.css` and `src/app/core/services/stagger.service.ts`
- Production build exits 0
- Stagger entrances on dashboard/reports/table rows feel stronger on entry, still smooth

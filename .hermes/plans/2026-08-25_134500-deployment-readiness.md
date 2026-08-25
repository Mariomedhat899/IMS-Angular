# Deployment Readiness Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Ensure the IMS Angular + .NET app is fully functional, visually polished, and ready for production deployment.

**Architecture:** Angular standalone frontend served from `dist/` via ASP.NET static files; separate API project. Frontend uses DashboardCacheService for DRY data loading, unified empty-state component, inline safe auth interceptor in app.config.ts as fallback for broken source file.

**Tech Stack:** Angular 16+, .NET 10, TypeScript, RxJS, CSS custom properties, Element.animate() for stagger, pure CSS keyframes for background blobs.

---

## Current State

- Auth interceptor source file (`auth.interceptor.ts`) still reverts to broken `*** ${token}` after every write.
- Safe inline interceptor added in `app.config.ts` as fallback; build includes correct `Bearer` token logic.
- Table headers redesigned with gradient, shadow, rounded corners.
- Mobile bottom nav added with responsive label hiding under 420px.
- Categories component rewritten to use DashboardCacheService.
- Dashboard animations partially fixed; labels missing `stagger-item` class on some stat cards.
- Background blobs defined in global `styles.css` but may not be animating on all routes/sections.
- Alerts empty state still uses ad-hoc markup instead of `app-empty-state`.

## Deployment Readiness Checklist

### Task 1: Verify auth interceptor fallback works in production build

**Objective:** Confirm built bundle always sends `Bearer ${token}`, never `*** ${token}`.

**Files:**
- Inspect: `dist/ims-angular-frontend/main*.js`
- Inspect: `D:\Mario\backEnd-Data\Projects\IMS-Backend\publish\site85046\wwwroot\main*.js` (if deployed locally)

**Step 1: Grep built bundle for broken token**

```bash
cd D:/Mario/backEnd-Data/Projects/IMS-Angular-Frontend
grep -oE "ims_token|Authorization|Bearer|\\*\\*\\*" dist/ims-angular-frontend/main*.js | head -20
```

Expected: Contains `Bearer`, contains `ims_token`, contains `Authorization`, no `***`.

**Step 2: Grep deployed wwwroot bundle (if applicable)**

```bash
cd D:/Mario/backEnd-Data/Projects/IMS-Backend/publish/site85046/wwwroot
grep -oE "ims_token|Authorization|Bearer|\\*\\*\\*" main*.js | head -20
```

Expected: Same as above.

**Step 3: Document finding**

If `***` appears in either bundle, the deployment is blocked. The inline interceptor in `app.config.ts` must be preserved.

---

### Task 2: Fix dashboard stat-card animations

**Objective:** Ensure all four dashboard stat cards animate on load.

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.html`
- Verify: `src/app/features/dashboard/dashboard.component.ts`

**Step 1: Add missing stagger-item classes**

In `dashboard.component.html`, ensure all `.stat-card` elements inside `.stat-grid` have `stagger-item` class:

```html
<div class="stat-grid stagger-target" *ngIf="!loading && !loadError">
  <div class="stat-card stagger-item">...</div>
  <div class="stat-card stagger-item">...</div>
  <div class="stat-card stagger-item">...</div>
  <div class="stat-card stagger-item">...</div>
</div>
```

**Step 2: Verify component triggers stagger**

In `dashboard.component.ts`, `ngAfterViewInit` should call:
```ts
this.stagger.animate('.stat-card.stagger-item');
this.stagger.animate('tbody tr.stagger-item');
```

Already present. No change needed if Step 1 is done.

**Step 3: Build and visual check**

```bash
cd D:/Mario/backEnd-Data/Projects/IMS-Angular-Frontend
npx ng build --configuration production
```

Open `dist/ims-angular-frontend/index.html` in browser or serve locally. Confirm all four cards animate on load.

---

### Task 3: Replace dashboard alerts empty state with app-empty-state

**Objective:** Use unified empty-state component for no-alerts case.

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.ts`
- Modify: `src/app/features/dashboard/dashboard.component.html`

**Step 1: Import EmptyStateComponent**

In `dashboard.component.ts`, add:
```ts
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
```

Add `EmptyStateComponent` to `imports` array in `@Component`.

**Step 2: Replace ad-hoc empty state**

In `dashboard.component.html`, replace:

```html
<tr *ngIf="alerts.length === 0">
  <td colspan="4" class="empty">
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true"></div>
      <span>No active alerts.</span>
    </div>
  </td>
</tr>
```

With:

```html
<tr *ngIf="alerts.length === 0">
  <td colspan="4">
    <app-empty-state
      title="No active alerts."
      iconSvg="<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>"
    ></app-empty-state>
  </td>
</tr>
```

**Step 3: Build and verify**

```bash
npx ng build --configuration production
```

Open dashboard, confirm empty state renders with icon and text when no alerts.

---

### Task 4: Verify background blob animations render on all sections

**Objective:** Ensure `.main::before` and `.main::after` blobs animate globally, not just on login.

**Files:**
- Verify: `src/styles.css` lines ~612-665
- Verify: `src/app/features/layout/layout.component.css` does NOT contain blob rules

**Step 1: Confirm blob CSS is global**

In `src/styles.css`, ensure `.main::before`, `.main::after`, and `@keyframes blobDrift/drift1/drift2/drift3` exist. They should not be scoped inside any component CSS.

**Step 2: Confirm layout.component.css has no blob overrides**

```bash
grep -n "blobDrift\|\.main::before\|\.main::after" src/app/features/layout/layout.component.css
```

Expected: zero matches.

**Step 3: Visual check on multiple routes**

Serve built app and navigate to Dashboard, Products, Categories, Alerts, Transactions, Payments, Reports, Users. Confirm animated blobs are visible and moving in background on all pages.

---

### Task 5: Final mobile nav small-screen validation

**Objective:** Confirm bottom nav fits on screens <= 420px without truncation.

**Files:**
- Verify: `src/app/features/layout/layout.component.css` @media (max-width: 420px)

**Step 1: Review CSS**

Ensure:
- `.mobile-nav` has `gap: 0`, reduced padding
- `.mobile-nav a` / `.mobile-nav-item` have `font-size: 0`, `padding: 8px 2px`, `min-height: 48px`
- `.mobile-nav-label` is `display: none`

**Step 2: DevTools responsive test**

Open app in browser, toggle device toolbar, test at 320px, 375px, 414px widths. Confirm all 7 icons + logout are visible without horizontal scroll or clipping.

---

### Task 6: Production build and deployment artifact prep

**Objective:** Produce clean production build and prepare deployment files.

**Files:**
- Output: `dist/ims-angular-frontend/`
- Deploy target: `D:\Mario\backEnd-Data\Projects\IMS-Backend\publish\site85046\wwwroot\` (local staging)

**Step 1: Clean build**

```bash
cd D:/Mario/backEnd-Data/Projects/IMS-Angular-Frontend
npx ng build --configuration production
```

Expected: exit 0, no TypeScript errors.

**Step 2: Copy to staging**

```bash
cp -r dist/ims-angular-frontend/* D:/Mario/backEnd-Data/Projects/IMS-Backend/publish/site85046/wwwroot/
```

**Step 3: Verify staging bundle**

```bash
grep -oE "ims_token|Authorization|Bearer|\\*\\*\\*" D:/Mario/backEnd-Data/Projects/IMS-Backend/publish/site85046/wwwroot/main*.js | head -20
```

Expected: `Bearer` present, no `***`.

**Step 4: Verify index.html references correct hashed assets**

```bash
ls D:/Mario/backEnd-Data/Projects/IMS-Backend/publish/site85046/wwwroot/
```

Confirm `index.html`, `main.*.js`, `styles.*.css`, `runtime.*.js`, `polyfills.*.js` all present.

---

### Task 7: Backend production config verification

**Objective:** Ensure backend is configured for production API URL and CORS.

**Files:**
- Verify: `D:\Mario\backEnd-Data\Projects\IMS-Backend\IMS.API\appsettings.json`

**Step 1: Check BaseUrl and JwtIssuer**

```bash
grep -A2 '"BaseUrl"' D:/Mario/backEnd-Data/Projects/IMS-Backend/IMS.API/appsettings.json
grep -A2 '"Issuer"' D:/Mario/backEnd-Data/Projects/IMS-Backend/IMS.API/appsettings.json
```

Expected: Both point to `https://ims-api.runasp.net`.

**Step 2: Check CORS policy**

```bash
grep -A10 '"Cors"' D:/Mario/backEnd-Data/Projects/IMS-Backend/IMS.API/appsettings.json
```

Expected: Allowed origins restricted to production frontend origin, not `AllowAnyOrigin`.

**Step 3: Check connection string**

```bash
grep -A2 '"ConnectionStrings"' D:/Mario/backEnd-Data/Projects/IMS-Backend/IMS.API/appsettings.json
```

Expected: Points to production DB `db64681.databaseasp.net`.

---

### Task 8: End-to-end smoke test

**Objective:** Validate full login → dashboard → data load → navigation flow.

**Prerequisites:** Backend running on `http://localhost:5150`, frontend served from staging or local dev server.

**Step 1: Start backend**

```bash
cd D:/Mario/backEnd-Data/Projects/IMS-Backend/IMS.API
dotnet run --urls "http://localhost:5150"
```

Wait for `Application started`.

**Step 2: Serve frontend**

Option A: Use staging folder with IIS Express or `dotnet serve`.
Option B: Use Angular dev server on another port:

```bash
cd D:/Mario/backEnd-Data/Projects/IMS-Angular-Frontend
npx ng serve --port 4201
```

**Step 3: Smoke test checklist**

- [ ] Login page loads with animated background blobs
- [ ] Login with `demo@ims.com` / `Demo123!` succeeds, no kick-out
- [ ] Dashboard loads with all 4 stat cards animated
- [ ] Categories table loads without delay
- [ ] Alerts table shows empty state component when no alerts
- [ ] Products, Transactions, Payments, Reports, Users pages load
- [ ] All table headers have gradient + shadow + rounded corners
- [ ] Modals open with elevated shadow
- [ ] Mobile bottom nav visible and functional at 375px width
- [ ] No console errors related to auth 401s or missing endpoints

---

### Task 9: Git hygiene and final commit

**Objective:** Ensure all changes are committed and pushed.

**Step 1: Check git status**

```bash
cd D:/Mario/backEnd-Data/Projects/IMS-Angular-Frontend
git status --short
```

**Step 2: Stage, commit, push**

```bash
git add -A
git commit -m "chore: deployment readiness fixes - dashboard animations, empty states, mobile nav"
git push origin main
```

**Step 3: Tag release (optional)**

```bash
git tag -a v1.0.0 -m "Production ready"
git push origin v1.0.0
```

---

## Risks and Tradeoffs

- **Auth interceptor source file still broken:** The inline fallback in `app.config.ts` is a workaround. If that file is ever removed or refactored, the broken `auth.interceptor.ts` will break production again. Long-term fix requires identifying and removing the revert mechanism.
- **Background blob performance:** `filter: blur(40px)` and multiple animated gradients may impact low-end mobile GPUs. Monitor FPS on actual devices.
- **Stagger animation timing:** `delayStep = 60ms` with many table rows can cause long entrance times. Consider reducing to `40ms` or capping max delay on large lists.
- **Mobile nav icon-only mode:** Hiding labels under 420px improves fit but reduces discoverability. Consider tooltips or long-press labels in future.

## Open Questions

- Should we remove the broken `auth.interceptor.ts` source file entirely and rely only on the inline interceptor?
- Do we want a build-time check that fails if `*** ${token}` appears in the bundle?
- Should background blobs be disabled on `prefers-reduced-motion`? Currently only stagger/modal/toast animations are disabled.

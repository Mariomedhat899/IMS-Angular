# Dashboard Data Cache Plan

## Goal
Refactor the Angular frontend to fetch app data once after login, cache it centrally, and let every feature component read from that cache instead of calling its own endpoint on every section change. Also add a shared empty-table component.

## Scope
- `IMS-Angular-Frontend`
- In scope: `ApiService`, dashboard/shell data loading, feature components, shared empty state UI
- Out of scope: backend changes, local dev configs, unrelated styling changes

## Success Criteria
- Login flow triggers one backend data load only
- Feature sections no longer independently fetch full dataset on navigation
- Empty tables show a consistent empty-state component
- No duplicated API fetching logic across components
- Angular app still builds and runs locally

## Tasks

### Task 1: Create shared dashboard data model and cache service
- Create `src/app/core/services/dashboard-cache.service.ts`
- Store: products, categories, transactions, payments, alerts, report summary, current user/role
- Expose observables/selectors for each slice
- Expose `loadAll()` that calls each API once and updates cache
- Expose `invalidate()` / section-specific refresh methods

### Task 2: Add a shared empty-table component
- Create `src/app/shared/components/empty-state.component.ts`
- Props: title, description, icon, actionLabel?, actionCallback?
- Style consistent with existing token system
- Replace ad-hoc empty messages across feature components with this component

### Task 3: Refactor ApiService to support cache-aware loading
- Keep existing CRUD methods
- Add `getCachedProducts()`, `getCachedCategories()`, etc. that return cached data when available
- After mutations, update cache instead of leaving components to refetch blindly

### Task 4: Refactor dashboard/shell to own initial data load
- On successful login, call `dashboardCache.loadAll()`
- Dashboard/shell shows loading state during this single fetch
- Expose loading/error state from cache service

### Task 5: Refactor feature components to use cache
- Update Products, Categories, Transactions, Payments, Reports, Alerts, Users components
- Remove per-component `ngOnInit` full-list fetch where redundant
- Read from cache observables
- Keep local CRUD calls, but update cache after success
- Use shared empty-state component for empty tables

### Task 6: Build verification
- Run `npx ng build --configuration production`
- Fix any compile errors
- Verify no duplicated endpoint patterns remain

## Execution Rule
Execute via `delegate_task` subagents, one task per subagent, then review results before proceeding to the next batch.

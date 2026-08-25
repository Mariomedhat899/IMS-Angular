# IMS-Angular-Frontend

Angular 16 standalone frontend for the Inventory Management System. Built with TypeScript, RxJS, and a design-token CSS system. Uses a centralized dashboard cache, unified empty states, and pure-CSS/WAAPI animations.

---

## Tech Stack

- Angular 16 standalone components
- TypeScript
- RxJS
- CSS custom properties / design tokens
- Pure CSS keyframes + native `Element.animate()` for stagger effects
- No GSAP

## Features

- Dashboard cache service for DRY data loading
- Unified `app-empty-state` component across all sections
- Animated background blobs on all routes
- Responsive mobile bottom nav with icon-only mode under 420px
- Elevated modals with stronger shadows
- Artistic table headers: gradient, shadow, rounded corners, full-width Payments header
- Login/logout animated barcode loaders
- Initial app preloader before Angular boot
- Toast notifications with Lucide icons via `DomSanitizer`

## Getting Started

```bash
npm install
npx ng serve
```

Open `http://localhost:4200`.

## Production Build

```bash
npx ng build --configuration production
```

Output: `dist/ims-angular-frontend/`

## Deployment

Frontend build is copied into the backend API `wwwroot` for hosting:

```bash
cp -r dist/ims-angular-frontend/* <backend-publish>/wwwroot/
```

Production frontend host: `https://imsapp.runasp.net`  
Production API host: `https://ims-api.runasp.net`

## Architecture Notes

- `DashboardCacheService` fetches all dashboard data once after login and exposes section observables.
- `EmptyStateComponent` is used for all empty tables.
- Auth interceptor fallback is registered in `app.config.ts` to ensure correct `Bearer` token behavior.
- Mobile nav switches from sidebar to bottom tab bar under 860px, with label hiding under 420px.

## Demo Account

- Email: `demo@ims.com`
- Password: `Demo123!`

## License

Private project — all rights reserved.

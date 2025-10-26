## Qanari — AI agent instructions (concise)

This file gives quick, actionable knowledge for AI coding agents editing or extending this repo.

High-level summary
- Framework: Next.js 13 (React) + TypeScript + TailwindCSS. App is client-heavy and relies on browser localStorage for stateful data (products, cart, uploads, ratings).
- Purpose: small demo storefront scaffold with an admin UI that edits data persisted to localStorage. No backend server; everything is local/browser-driven.

Important boundaries and data flows
- Persistent data: stored in browser localStorage and seeded from `data/products.ts` on first load. Key helpers live in `lib/*`:
  - `lib/productStore.ts` — primary API for product list operations. Uses STORAGE_KEY = `qanari:products` and dispatches a `qanari:products-updated` CustomEvent and BroadcastChannel messages after writes.
  - `lib/uploads.ts` — manages temporary uploads by galleryId (AdminProductForm uses a temp id `temp_...` then calls `transferUploads(tempGalleryId, id)` on save).
  - `lib/commentsStore.ts` — comment/rating stats used by product pages and home list.
- Cross-tab / UI sync: the app sends both DOM CustomEvents (e.g. `qanari:products-updated`) and BroadcastChannel messages (`qanari:products`) to keep multiple tabs in sync. Watch for both when adding listeners.

Key conventions and patterns
- Client-only code: many parts read localStorage or use the DOM. Guard with `if (typeof window !== 'undefined')` or wrap in `useEffect` so code runs only on the client. Expect try/catch around these calls.
- Admin auth: admin routes are protected using `sessionStorage` flag `qanari:admin` === `'true'`. The admin pages redirect to `/admin/login` when missing.
- Images: product image sources are often stored as comma-separated lists in admin forms (see `AdminProductForm.tsx`) and rendered as arrays (`images: string[]` in `data/products.ts`). New uploads are typically Data URLs.
- Defaults/fallbacks: components expect at least one image. If none provided, the code falls back to `/logo.png`.
- Temporary IDs: admin form uses `temp_` prefix for unsaved gallery uploads; transferUploads moves them to the real product id after save.

Developer workflows (how to run / debug)
- Install & run locally (PowerShell):
  - cd to repo root
  - `npm install`
  - `npm run dev` (runs `next dev`)
  - Build: `npm run build`; Start production server: `npm run start`.
- Debug admin flows: open the app, go to `/admin/login` and set `sessionStorage.setItem('qanari:admin','true')` in the dev console to simulate a logged-in admin. Then open `/admin/manage` to add/edit products.
- Cross-tab testing: to test sync, open two tabs and perform product changes — code dispatches `qanari:products-updated` + BroadcastChannel messages.

Files & hotspots to inspect when making changes
- Pages: `pages/` — main routes and admin pages (`pages/admin/*.tsx`).
- Components: `components/AdminProductForm.tsx`, `components/LogoUploader.tsx`, `components/ProductComments.tsx`.
- Lib: `lib/productStore.ts`, `lib/uploads.ts`, `lib/commentsStore.ts`, `lib/members.ts`, `lib/metrics.ts`.
- Contexts: `context/CartContext.tsx`, `context/NotificationContext.tsx` (Cart uses `qanari_cart` localStorage key).

Quick examples (keys & events)
- Product storage key: `qanari:products` (see `lib/productStore.ts`).
- Cart key: `qanari_cart` (see `context/CartContext.tsx`).
- Admin session key: `sessionStorage['qanari:admin'] === 'true'` (see `pages/admin/manage.tsx`).
- Cross-tab event: `window.dispatchEvent(new CustomEvent('qanari:products-updated'))` and BroadcastChannel channel name `qanari:products`.

Coding tips for AI agents
- Preserve client/server separation. If adding code that reads localStorage or window, put it inside `useEffect` or guard with `typeof window !== 'undefined'` to avoid SSR/hydration errors.
- Prefer using existing lib helpers (`productStore`, `uploads`, `commentsStore`) for state changes so events and BroadcastChannel messages remain consistent.
- When changing data shape, update seeds in `data/products.ts` and ensure `lib/productStore.ts` serializes/deserializes the same shape.
- Small, safe changes: update UI text, add prop-types via TypeScript, or add unit tests if you introduce pure functions in `lib/`.

What I couldn't auto-discover
- Any external CI, tests, or deployment scripts — there are no tests or CI configs in the repository snapshot. If you rely on CI, add instructions or config files.

Questions or unclear areas for maintainers
- Should `uploads` data be migrated to a real backend in the future? If yes, indicate an API surface in `lib/uploads.ts` for the agent to implement.
- Preferred linting/formatting rules beyond `next lint` (none present). If you have a style guide, attach it so agents can follow it.

If this is useful, I can: add small unit tests for `lib/productStore.ts` (happy path + storage-missing case), or wire a simple script to reset seeded data from the CLI.

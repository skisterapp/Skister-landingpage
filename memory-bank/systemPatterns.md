# System patterns

## Static web surface

- Public landing and legal pages are plain HTML (e.g. `index.html`, `terms.html`).
- Blog pages are generated/validated via scripts in `scripts/`.

## Built app artifacts

- The client web app is shipped as built assets under `dist/` and referenced by Capacitor projects (`ios/`, `android/`).

## Supabase Edge Functions

- Source of truth is `supabase/functions/server/` (do not edit generated `make-server-080ebf84/`).
- Deploy via `npm run supabase:deploy`.


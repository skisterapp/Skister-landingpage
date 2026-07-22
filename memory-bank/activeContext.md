# Active context

## Skister contact emails (canonical)

Use these across the website and app (lowercase local parts; domain `skister.app`):

| Role    | Address              |
|---------|----------------------|
| Support | support@skister.app  |
| Contact | contact@skister.app  |
| Feedback| feedback@skister.app |
| Privacy | privacy@skister.app  |

- Public landing: `index.html` (footer, modals, i18n strings). Privacy modal includes `modal.privacy.contactEmail`.
- Landing CMS keys: `landing-admin.html` (`ALL_KEYS` includes `modal.privacy.contactEmail`).
- Do not edit `seo-admin.html` for placeholder/example emails unless explicitly requested.

## Git workflow — landing pages

When any landing-related files change (e.g. `index.html`, `landing-admin.html`, `blog.html`, `blog-post.html`, or shared landing assets), **commit and push to the remote** as part of the same change, unless the user explicitly asks not to.

## Landing CMS → live site (Jul 2026)

- Live homepage must prefer Supabase `GET /landing-content` and only fall back to `data/landing-content.json` if the API fails. Applying the JSON snapshot after the API overwrote fresh CMS saves (up to the 12h sync cron).
- Edge Function (`Skisterapp`) queues GitHub Actions on landing/blog saves via `GITHUB_LANDING_DISPATCH_TOKEN` + `GITHUB_LANDING_DISPATCH_REPO=skisterapp/Skister-landingpage` (workflows: `sync-landing-content.yml`, `generate-blogs.yml`). Manual trigger: `seo-admin` → Publish.
- Deploy Edge from **Skisterapp**: `npm run supabase:deploy`. Landing HTML lives in **Skister-landingpage** (`skister-live` remote).

## Next steps

- Keep mobile app repo in sync if it duplicates these addresses.
- If CMS save does not create a GitHub Actions run, rotate/recheck `GITHUB_LANDING_DISPATCH_TOKEN` (needs `actions:write` on the landing repo).

## Skisterapp release automation memory

- For `/Users/sharanestone/Semprog/Skister/Skisterapp`, every run of `npm run release:new` must generate locale release notes with automatic translations (not English duplicates) for:
  - `en-US`
  - `de-DE`
  - `es-ES`
  - `es-US`
  - `fr-FR`
  - `it-IT`

## Supabase CLI state (saved)

- Supabase CLI is authenticated and linked to project ref `ayomhapkzckbhgwxenwr` (`Skister`).
- Re-auth flow used: `supabase logout --yes` -> `supabase login` (or token login) -> `supabase link --project-ref ayomhapkzckbhgwxenwr`.
- If deploy commands fail with auth errors, re-run login first, then re-link with the same project ref.

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
- Onboarding mascots for Confirm & Ski Network: `SkisterApp/Mascot Confirm & coordinate.png` and `SkisterApp/Mascot Ski Network.png` (transparent). Opaque `mascot-scenery.png` removed.

## Landing polish (Jul 2026)

- Production UI refinement of `index.html`: tighter header/hero, compact feature cards, new benefits section, cleaner FAQ accordion, premium SaaS footer.
- Onboarding mascot sequence left intact (same image URLs); only spacing, carousel swipe/controls, and typography refined.
- Features section renamed to “Everything you need” / “Alles was du brauchst” with updated subtitle; benefits keys added for CMS (`benefits.*`).
- Live CMS API may still override `features.subtitle` until Landing CMS is re-saved or content sync publishes `data/landing-content.json`.
- Follow-up fix: restored desktop `min-height` snap sections + original desktop nav/section spacing; mobile (`max-width: 768px`) keeps compact spacing.
- Mobile UI regression fixes merged to `main` (`fix/mobile-ui-regression` → `e2616d4`): block-by-block snap, benefits/FAQ snap sections, `calc(100dvh - nav-offset)` under sticky nav, centered mobile cards/FAQ/footer, larger footer logo.

## Next steps

- Keep mobile app repo in sync if it duplicates these addresses.
- If CMS save does not create a GitHub Actions run, rotate/recheck `GITHUB_LANDING_DISPATCH_TOKEN` (needs `actions:write` on the landing repo).
- Re-save Landing CMS features subtitle (or Publish) so live API matches the new “Everything you need” copy.

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

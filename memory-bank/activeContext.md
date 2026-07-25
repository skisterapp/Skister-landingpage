# Active context

## Ski-first brand repositioning (Jul 2026)

Skister remains a **ski-sharing application first**. Brand positioning:

- Primary: “Skister is the easiest way to share ski gear with people you trust.”
- Secondary: “You can also share camping, hiking and other outdoor equipment.”

Rules applied across app + website:

- Skiing always first in category/activity lists; ski gear is featured content
- Hero banners and winter-sports framing stay primary
- Camping / hiking / climbing / other outdoor gear are additional supported categories (not equal priorities)
- Never describe Skister as a generic marketplace
- Sharing framed within trusted networks, friends and communities
- User-facing **Ski Network** restored (not Outdoor Network); API keys / resort APIs unchanged

Updated in **Skister-main**: onboarding, Help, `help.html`, landing `index.html` + `data/landing-content.json`, blog banner.

Updated in **Skisterapp**: `LanguageContext` (EN/DE/FR/IT), legal docs, Explore/Home/Inventory placeholders, empty-state and FAQ/About copy.

## Trip Planner in Tools (Jul 2026)

Implemented in **Skisterapp** (`/Users/sharanestone/Semprog/Skister/Skisterapp`):

- `/tools` is the Trip Planner (travel-planner UI, not a settings page)
- Inputs: Destination, Dates, Activities, People, Skill level, Trip type
- Generates: packing checklist, suggested borrowed gear (from network via `getAvailableGear` / `getAllGear`), weather placeholder, budget / food / water / fuel estimates
- CTAs: Invite friends (sendInvitation sheet), Borrow recommended gear → Explore with activity + dates deep link
- Shared activity→gear mapping: `src/app/lib/explore-activities.ts` (used by Explore + Trip Planner)
- Plan logic: `src/app/lib/trip-planner.ts`

## Explore consumer redesign (Jul 2026)

Implemented in **Skisterapp** (`/Users/sharanestone/Semprog/Skister/Skisterapp`):

- `/explore` is a standalone consumer screen (no longer wraps `Inventory mode="explore"`)
- Top filters: Search, Activity chips, Location (Ski Network / resort picker), Dates
- Primary CTA: **Browse Gear** — runs existing APIs (`getAllGear` / `getAvailableGear` / optional `getResortGear` intersect)
- Activities map to backend categories + keyword filters client-side (no backend category schema change)
- Result cards: photo, distance/location label, availability badge, owner, category, Borrow CTA
- Home deep links (`?q=`, `?startDate=&endDate=`) still auto-browse
- My Gear still uses `Inventory mode="my-gear"`; legacy Inventory `mode="explore"` unused by the route

## App navigation redesign (Jul 2026)

Implemented in **Skisterapp** (`/Users/sharanestone/Semprog/Skister/Skisterapp`):

- Bottom nav order: **Home → Explore → My Gear → Tools → Profile**
- Reminders removed from bottom nav; still at `/reminders`, linked from Home + Profile
- Explore (`/explore`) is the consumer borrow discovery screen (see above)
- My Gear (`/my-gear`) shows only the current user's gear
- Tools (`/tools`) hosts the Trip Planner
- Legacy `/inventory` route kept for deep links

## Home action-first dashboard (Jul 2026)

Home (`src/app/screens/Home.tsx`) redesigned as a guided dashboard:

- Welcome + “What would you like to do today?”
- Four primary actions: Borrow (`/explore`), Share (`/my-gear?add=1`), Return (`/reminders`), Scan QR (`/scan-qr`)
- Sections below (auto-hidden when empty): Upcoming Pickups, Upcoming Returns, Friend Requests, Recent Activity
- Existing flows preserved: date/name find-gear (collapsible), reminders/invite shortcuts, upcoming-event widget, handoff QR card, incoming borrow approvals, pending borrowings

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

## Production polish branch (Jul 2026)

- Branch: `fix/production-polish` (backup commit + polish commit). Not a redesign.
- Shared `.content-container`: `--content-max: 1240px`, gutters 48 / 32 / 20, section gaps 72 / 56 / 48.
- All major sections + nav + footer align to the same container; FAQ list stays readable at ~720px inside it.
- Web + mobile use full-viewport `scroll-snap-type: y mandatory`; hero fills `100svh` so the next section never peeks on load.
- Mascot/onboarding artwork URLs and order unchanged; no business-logic/CMS/i18n/routing changes.

## App UI polish (Jul 2026)

Implemented in **Skisterapp** (dark theme retained; no business-logic changes):

- Design tokens: bright green reserved for primary CTAs; dark forest greens for surfaces/soft accents; muted gray-green body text (no neon secondary text)
- Spacing: tighter in-card padding (~25%); roomier section gaps via `.skister-page` / `--space-section`
- Radius scale: controls `0.75rem`, cards `1rem`; shared buttons/inputs use `rounded-xl` + min 44px touch targets
- Typography: stronger heading weight/tracking hierarchy
- Shared `EmptyState` + `LoadingSkeleton`; route fallback uses page skeleton; Explore/Network empty states updated
- Motion: snappier enters, softer card hover, improved dark shimmer skeletons
- Screens touched: Layout, Home, Explore, Tools, Inventory, Profile, Reminders, Network, Login, home-updates

## Next steps

- Re-save / Publish Landing CMS so live API matches ski-first hero/FAQ (or rely on synced `data/landing-content.json`)
- Visual sign-off on Skisterapp UI polish (dark mode Home / Explore / Tools)
- Review/merge `fix/production-polish` after visual sign-off.
- Keep mobile app repo in sync if it duplicates contact addresses.
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

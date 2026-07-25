# Active context

## Agent preferences

- Do not use or mention Spokenly MCP; ask clarifying questions in plain chat.

## Snow Conditions dashboard (Jul 2026)

Implemented in **Skisterapp** (`/tools/snow-conditions`):

- Live outdoor tool (catalog status `live`) — was a placeholder
- Sections: snow depth, fresh snowfall, temperature, wind, open lifts, open runs, resort webcam placeholder, weather forecast, favourite resorts
- Architecture: provider interface (`SnowConditionsProvider`) + domain types; UI only consumes `ResortSnowConditions` / `SnowConditionsDashboard`
- Current source: `PlaceholderSnowConditionsProvider` (demo resorts: Zugspitze, Kitzbühel, Zermatt, Chamonix) — swap via `getSnowConditionsProvider()` for live APIs later without UI redesign
- Favourites + active resort persisted in `localStorage` (`skister_snow_conditions_favourites`, `skister_snow_conditions_active_resort`)
- Logic: `src/app/lib/snow-conditions/`; UI: `screens/tools/SnowConditions.tsx`; tests in `snow-conditions.test.ts`
- i18n EN/DE/FR/IT under `snow.*` (+ updated `tools.snow.desc`)

## Gear Maintenance Tracker (Jul 2026)

Implemented in **Skisterapp** (`/tools/gear-maintenance`):

- Live outdoor tool (catalog status `live`) — was a placeholder
- Schedule care reminders locally (`localStorage`: `skister_gear_maintenance_reminders` + `skister_gear_maintenance_history`)
- Presets: Wax skis, Sharpen edges, Waterproof jacket, Replace helmet, Bike chain lubrication, Tent waterproofing, Custom
- Recurrence: none / weekly / monthly / quarterly / yearly / custom days; completing a recurring reminder advances the due date and writes history
- History filterable by linked gear item
- My Gear integration: **Maintain** action deep-links with `?gearId=&gearName=`; cards show next care due when linked
- Logic: `src/app/lib/gear-maintenance.ts` + storage helper; UI: `screens/tools/GearMaintenance.tsx`; tests in `gear-maintenance.test.ts`
- i18n EN/DE/FR/IT under `gearMaint.*` (+ `myGear.maintain` / `nextMaintenance`)
- No backend / Premium API changes (offline-first; separate from Premium `gear_maintenance_log`)

## Packing Checklist Generator (Jul 2026)

Implemented in **Skisterapp** (`/tools/packing-checklist`):

- Live planning tool (catalog status `live`) alongside Trip Planner, DIN, Ski Length, Boot Size
- Inputs: trip type (Ski / Snowboard / Camping / Hiking), duration, weather (cold/mild/hot/wet), people, children
- Auto-generates categorized checklist (essentials, clothing, gear, safety, kids); quantities scale by people/children
- Tick items, add/remove custom items, progress bar
- Save / load / duplicate / delete checklists in `localStorage` (`skister_packing_checklists`, max 24) — fully offline
- Export as PDF (client-side Blob download, no network)
- Logic: `src/app/lib/packing-checklist.ts` + storage + pdf helpers; UI: `screens/tools/PackingChecklist.tsx`
- i18n EN/DE/FR/IT under `packing.*` keys; unit tests in `packing-checklist.test.ts`
- No backend changes

## Ski Boot Size Converter (Jul 2026)

Implemented in **Skisterapp** (`/tools/boot-size-converter`):

- Live winter tool (catalog status `live`) alongside DIN Calculator, Ski Length Finder, Trip Planner
- Instant conversion between Mondopoint, EU, UK, US Men's, US Women's (edit any field → all update)
- Foot length guide: measure steps + mm input → Mondopoint (foot mm = Mondo × 10)
- Recent conversions saved in `localStorage` (`skister_boot_size_converter_history`, max 8, debounced)
- Logic: `src/app/lib/boot-size-converter.ts` + history helper; UI: `screens/tools/BootSizeConverter.tsx`
- i18n EN/DE/FR/IT under `bootSize.*` keys
- No backend changes

## Ski Length Finder (Jul 2026)

Implemented in **Skisterapp** (`/tools/ski-length-finder`):

- Live winter tool (catalog status `live`) alongside DIN Calculator and Trip Planner
- Inputs: height, weight, optional gender, ability (Beginner → Expert), preferred terrain (Piste / All Mountain / Freeride / Park)
- Output: recommended ski length range (cm) + guide value + plain-language “why” reasons
- Community links: matches network skis in the length range via `getAllGear` + deep link to Explore (`?activity=skiing&q=<guideCm>`)
- Recent calculations saved in `localStorage` (`skister_ski_length_finder_history`, max 8)
- Logic: `src/app/lib/ski-length-finder.ts` + history helper; UI: `screens/tools/SkiLengthFinder.tsx`
- i18n EN/DE/FR/IT under `skiLength.*` keys
- No backend changes

## Ski DIN Calculator (Jul 2026)

Implemented in **Skisterapp** (`/tools/din-calculator`):

- Live winter tool (catalog status `live`) alongside Trip Planner
- ISO 11088 indicative method: height, weight, age, boot sole length (mm), ability (Beginner → Expert)
- Metric-only inputs; recommended DIN range + guide value; skier code + sole column
- Educational disclaimer: guide only; bindings must be set by a certified technician
- Recent calculations saved in `localStorage` (`skister_din_calculator_history`, max 8)
- Logic: `src/app/lib/din-calculator.ts` + history helper; UI: `screens/tools/DinCalculator.tsx`
- i18n EN/DE/FR/IT under `din.*` keys

## Tools hub redesign (Jul 2026)

Implemented in **Skisterapp**:

- `/tools` is a categorized outdoor-utilities hub (Trip Planner is one card, not the whole page)
- Sections: **Winter Tools → Outdoor Tools → Planning → Safety**
- Catalog-driven UI: add tools in `src/app/lib/tools-catalog.ts` — they appear automatically
- Cards with icons, short descriptions, Ready/Coming soon badges, and navigation; search + section chips; i18n EN/DE/FR/IT
- Nested routes: `/tools/:toolSlug` → live tool or polished placeholder (tool-specific highlights)
- Live tools: Trip Planner (`/tools/trip-planner`), Ski DIN Calculator (`/tools/din-calculator`), Ski Length Finder (`/tools/ski-length-finder`), Boot Size Converter (`/tools/boot-size-converter`), Packing Checklist (`/tools/packing-checklist`), Gear Maintenance (`/tools/gear-maintenance`), Snow Conditions (`/tools/snow-conditions`); remaining tools are placeholders
- Tools: Ski DIN Calculator, Ski Length Finder, Boot Size Converter, Gear Maintenance, Snow Conditions, Resort Weather, Trip Planner, Packing Checklist, Emergency Information
- Legacy slug aliases: `weather` → `resort-weather`, `ski-length-calculator` → `ski-length-finder`, `gear-maintenance-tracker` → `gear-maintenance`
- Removed from hub: Community empty category, Camping Checklist, Adventure Budget, Equipment Value Calculator

## Add Gear wizard redesign (Jul 2026)

Implemented in **Skisterapp** (`src/app/components/add-gear-wizard.tsx` + `MyGear.tsx`):

Goal: list equipment in under 60 seconds — photo-first stepped flow:

1. Take photo (camera / gallery; skippable; auto-advances after first shot)
2. Category (large tiles; auto-advance on tap)
3. Title (suggestion chips + optional size)
4. Condition (large tiles; auto-advance)
5. Availability (available / unavailable; auto-advance; unavailable toggles via existing API after create)
6. Optional notes → Finish

Also: progress bar + step dots, localStorage draft auto-save (`lib/gear-add-draft.ts`, compressed image data URLs), large min-h-14 tap targets, minimal typing. Edit reuses the same wizard (no draft). No database schema changes.

## Onboarding redesign (Jul 2026)

Implemented in **Skisterapp** (`src/app/screens/Onboarding.tsx`):

5-screen teach flow (~1 minute), auth unchanged (still ends at `/login`):

1. Welcome — Share Gear / Borrow Gear / Both
2. Activities multi-select (Skiing → BBQ list)
3. Invite friends — share link + email list, skip available
4. Complete profile — display name (optional) + username (required)
5. Go to Home — summary → `/login` (then Home after auth)

Persisted in `localStorage` via `lib/onboarding-preferences.ts` for personalization:
- Explore defaults activity chip to first selected activity
- Home primary actions reorder Share/Borrow based on intent
- Pending invites + display name applied post-login in `ProfileSetupSync`

## My Gear management redesign (Jul 2026)

Implemented in **Skisterapp** (`src/app/screens/MyGear.tsx`):

- `/my-gear` is a dedicated owner management screen (no longer a thin `Inventory mode="my-gear"` wrapper)
- Purpose: “This is where I manage everything I own.”
- Layout: Header → large **Add Gear** CTA → stats (Available / Reserved / Borrowed / Maintenance) → equipment cards
- Cards: photo, status, availability, current borrower (from incoming rentals), next reservation, actions Edit / Share / Mark unavailable / Delete
- Edit uses existing `PUT /gear/:id` via new client `updateGearItem` — no backend model changes
- Maintenance stat = owner-marked unavailable (`available=false`) without active rental status
- Legacy `/inventory` route unchanged

## Ski-first brand repositioning (Jul 2026)

Skister remains a **ski-sharing application first**. Brand positioning:

- Primary: “Skister is the easiest way to share ski gear with people you trust.”
- Secondary: “You can also share camping, hiking and other outdoor equipment.”

Rules applied across app + website:

- Skiing always first in category/activity lists; ski gear is featured content
- Hero banners and winter-sports framing stay primary
- Camping / hiking / climbing / other outdoor gear are additional supported categories (not equal priorities)
- Never describe Skister as a generic / open marketplace
- Sharing framed within **private trusted networks**: friends, families, ski clubs and local groups
- User-facing **Ski Network** = private circle (not open community discovery); API keys / resort APIs unchanged
- Copy should feel reassuring, not repetitive — vary “people you trust / private network / friends & family / clubs / local groups”

### Trusted-network copy pass (Jul 26, 2026)

Reinforced invite-only / private-circle messaging (business logic unchanged) across:

- **Skister-main**: `index.html` (onboarding aligned invite-first + EN/DE i18n), `data/landing-content.json`, `help.html`, `Help.tsx`, `Onboarding.tsx`, `blog/index.html`
- **Skisterapp**: `LanguageContext.tsx` EN/DE/FR/IT (onboarding, Explore/Home empty states, Network, Profile, FAQ, invite/referral crew), `Users.tsx`, `legal-documents.ts` Ski Network definition

Avoid: “browse marketplace / nearby strangers / grow community for more gear / similar to social media” framing.

## Trip Planner in Tools (Jul 2026)

Implemented in **Skisterapp** (`/Users/sharanestone/Semprog/Skister/Skisterapp`):

- Trip Planner lives at `/tools/trip-planner` (hub is `/tools`)
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
- Tools (`/tools`) is a categorized hub; Trip Planner at `/tools/trip-planner`
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

- Design tokens: bright green reserved for primary CTAs; darker forest greens for surfaces/soft accents; muted gray-green for icons/secondary accents (no neon body text)
- Spacing: ~25% tighter in-card padding via `--space-pad-*`; roomier section gaps via `.skister-page` / `--space-section` (1.75rem)
- Radius scale: controls `0.75rem`, cards `1rem`; shared buttons/inputs use `rounded-xl` + min 44px (`min-h-11`) touch targets
- Typography: stronger heading weight/tracking hierarchy (`theme.css` h1–h4)
- Shared `EmptyState` + `LoadingSkeleton` wired across Home, Explore, My Gear, Tools, Reminders, Network, Inventory; route fallback uses page skeleton
- Motion: snappier enters, softer card hover, improved dark shimmer skeletons; `prefers-reduced-motion` respected
- Screens touched: Layout, Home, Explore, MyGear, Tools, TripPlanner, Inventory, Profile, Reminders, Network, Login, home-updates, tool cards, community disclaimer
- Visual sign-off still recommended on dark mode Home / Explore / Tools / Profile

## Next steps

- Re-save / Publish Landing CMS so live API matches ski-first hero/FAQ (or rely on synced `data/landing-content.json`)
- Commit + push Skister-main landing ski-first copy; keep Skisterapp i18n/tools changes in sync
- Visual sign-off on Skisterapp UI polish (dark mode Home / Explore / Tools / Profile)
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

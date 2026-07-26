# Active context

## Agent preferences

- Do not use or mention Spokenly MCP; ask clarifying questions in plain chat.

## Onboarding / branding regression fix (Jul 26, 2026)

Fixed production regressions in **Skisterapp** (no auth/Supabase redesign):

### Icons
- Canonical brand package: `IconKitchen-Skister` (goat mascot) vendored identically in:
  - `Skisterapp/resources/IconKitchen-Skister`
  - `Skister-main/branding/IconKitchen-Skister`
- Applied to Android launcher/adaptive, iOS AppIcon, Capacitor resources, website favicon/PWA/og image
- Removed leftover non-Skister / alternate IconKitchen exports from active icon paths

### First-run / onboarding
- New `lib/first-run.ts`: persist `skister_onboarding_complete` + `skister_language_selected`
- Authenticated / returning users skip onboarding; logout does not reset flags
- Final onboarding page: Create Account / Google / Apple (iOS) / Email / Sign In
- Explicit reset only via Settings → Data → Reset Onboarding (or debug flag)

### Verify
- `tsc --noEmit` clean · Vitest **155**/155


Break-tested Equipment Maintenance Center; fixed all Critical/High (no redesign).

### Fixed
- Soft-delete tombstones + cache LWW · private docs + signed URLs · attachment ownership/MIME
- Cascade delete · LWW `updated_at` · offline create + stable clientId · health conditions
- Timeline delete · legacy import as labeled custom

### Verify
- Migration `20260726180000` · Edge redeployed · `tsc` clean · Vitest **149**/149

## v1.0 stabilization (Jul 26, 2026)

Final low-risk RC polish on **Skisterapp** → **Production Ready (v1.0)**.

### Fixed this pass
- Reminders ConditionConfirmDialog + Users + Shortages fully localized EN/DE/FR/IT
- Date prefs on Home + Explore + borrow notification cards
- Handoff: in-app scan uses `location.state`; cold `?token=` stripped after load
- `logDevError` — Auth/API/adventure logs DEV-only / message-only
- A11y: min 44px touch + aria-labels on key icon backs / gallery
- Automated i18n coverage test for required localized keys

### Verify
- `tsc` clean · Vitest **135**/135 · Vite · Android Release · iOS Release (unsigned)
- Score **97/100** · Canvas `skister-v1-stabilization.canvas.tsx` · **v1.0 ready**

### Residual
- Medium: QR handoff deep-link still carries token (required); some tool history dates not pref-wired
- Low: no eslint project config; chunk size warn; device visual matrix

## Equipment Maintenance Center (Jul 26, 2026)

Expanded My Gear **Maintain** into a full per-gear Maintenance Center in **Skisterapp**:

### Shipped
- Gear cards: Health · Last Service · Next Service · Record count + **View Maintenance**
- Route `/my-gear/:gearId/maintenance` — overview, analytics, filtered timeline, FAB add form
- Category templates (skis/snowboard/boots/helmet/camping/hiking/climbing/bike + custom)
- Health engine + reminders + attachments + offline sync
- Migration `20260726170000_equipment_maintenance_center.sql` applied; Edge redeployed
- i18n EN/DE/FR/IT (`lib/maintenance-i18n.ts`); docs `docs/EQUIPMENT_MAINTENANCE.md`

### Preserved
- `/tools/gear-maintenance` tool · Premium `gear_maintenance_log` · My Gear Edit/Share/Unavailable/Delete

### Verify
- `tsc --noEmit` clean · Vitest **133**/133 · Edge deploy OK

## RC1 polish (Jul 26, 2026)

Final Medium/Low production polish on **Skisterapp** ahead of Release Candidate 1.

### Fixed this pass
- DE/FR/IT translations for About, ScanHandoff checklist, privacy honesty, reminders/analytics/scan/QR, request usage hint
- `format-prefs` applied on History, Reminders, Referral, RequestFlow, ShowHandoffQr
- Remaining fragile UI `navigate(-1)` → `navigateBack` with fallbacks
- Dual Home Ski editors verified (Profile + AdventureDetail both `updateProfile({ homeSkiResortId })`) — both kept
- PII-safe API/Auth error logging (no response-body dumps)
- DE privacy descriptions aligned with honest EN

### Verify
- `tsc --noEmit` clean · Vitest **125**/125 · Vite build · Android `assembleRelease` · iOS Release (unsigned compile)
- Score **95/100** · Canvas `skister-rc1-polish.canvas.tsx` · **RC1 ready**

### Residual Medium/Low
- Handoff tokens in custom-scheme URLs (accepted)
- Distance units not everywhere Explore shows place labels
- No temperature/time prefs (not invented)
- Non-PII console noise; device visual QA not exhaustive

## Final production audit (Jul 26, 2026)

Lead QA store-readiness pass on **Skisterapp**. No Critical/High open after fixes.

### Fixed this pass
- Email edit honesty (read-only)
- Privacy/notification honesty + in-app notification preference filtering
- OAuth PKCE-only (no token-in-URL)
- Android `allowBackup=false` + data extraction rules + narrowed FileProvider
- Blog HTML sanitizer
- Resort Weather “Coming soon” badge
- Reminders / Analytics / Rate / Scan / Show QR i18n for primary strings
- `.env` gitignore

### Verify
- `tsc --noEmit` clean · Vitest **122**/122
- Score **91/100** · Canvas `skister-final-production-audit.canvas.tsx`

### Residual Medium/Low
- ScanHandoff condition checklist English; About body EN; new keys inherit EN in DE/FR/IT; date/units lightly applied; handoff tokens in custom scheme

## Production UX audit + nav polish (Jul 26, 2026)

Full Profile / Settings / navigation QA pass in **Skisterapp** (preserve features; reorganize only):

### Fixed
- Capacitor hardware `backButton` in `Layout`
- Tab switches `replace: true` (no polluted history)
- `navigateBack()` via history `idx` + fallback (`lib/navigate-back.ts`)
- Profile tab highlight for `/profile/*`, `/settings/*`, account tools
- Canonical About (`AboutSkister`) for Profile + Settings; Settings About no longer re-lists Quick Access/Legal
- Legal: real licenses dialog; contact + website (removed fake Social = Website)
- Referral: ProfileSubpageHeader; `/referrals` → `/profile/referral`
- Reminders: Back header + Rate on returned rentals
- Account → Edit Profile uses `replace: true`
- Terminology: Adventure Timeline; Referral Centre page title

### Preserved
Adventure, Reputation, Achievements, Timeline, Preferences, Referral, Settings, Logout (Profile + Account), About, Premium, Network, History, Reminders, Analytics, Resources

### Verify
- `tsc --noEmit` clean · Vitest **115**/115
- Canvas: `canvases/skister-production-ux-audit.canvas.tsx`

### Open (backlog)
- Dual home-ski editors (Profile dialog + Adventure) — both still work
- Remaining hardcoded EN strings on Reminders/Analytics

## Profile dashboard + Settings hub UX (Jul 26, 2026)

Production UX polish in **Skisterapp** only (no backend / schema / trust / referral / auth / Edge Function changes):

### Profile hub (`/profile`)
- Dashboard cards: Adventure Profile, Community Reputation, Achievements, Adventure Timeline, Adventure Preferences, Referral Centre
- **Quick Access** 2-col grid above About: Premium, Network, History, Reminders, Analytics, Settings → full `/settings` hub
- Resources card · About Skister · Important disclaimer · Logout
- Achievements: “N Badge(s) Earned · M Available”; latest earned badge only on hub
- Reputation stages: New Member → Trusted Member → Reliable Lender → Community Favorite; numeric score only after completed exchanges
- Timeline: `resolveTimelineEventDisplay` never shows raw keys (fixes `adventure.achievement.early_supporter`)

### Settings hub (`/settings` + nested pages)
- Account · Privacy · Notifications · Appearance · Language · Data · Legal · About
- Privacy is a full page (grouped toggles + descriptions), not a small dialog
- Prefs persist via `skister_prefs` (`lib/skister-prefs.ts`); appearance a11y classes on `<html>`
- `/profile/about` and `/settings/about` share canonical `AboutSkister` (Settings uses `fallbackPath="/settings"`)

### Verify
- `tsc --noEmit` clean · Vitest **115**/115

## Production UX polish pass (Jul 26, 2026)

Final presentation-only polish in **Skisterapp** (no business logic / auth / referral / routing / schema changes in this pass):

### Shipped
1. **Home** — Borrow + Share primary; Invite + Scan secondary; Return Equipment only with active/approved rentals or pending returns; dismissible “New to Skister?” tip → `/profile/resources`
2. **Apple Sign-In** — disabled, reduced opacity, Coming Soon subtitle + tooltip; not pressable
3. **Splash** — Continue → after ~1s; auto-continue at 2.4s (same ceiling as before); focus cancels auto; `aria-live` for Continue
4. **Profile** — dashboard cards + Settings hub (see above; Quick Access removed from hub)
5. **Trust** — stages until completed exchanges; then numeric score (no faked scores)
6. **Empty states** — coaching copy for timeline, endorsements, achievements, borrow history
7. **Skeletons** — Home, Profile, Network, Timeline, Reputation, History, Analytics, profile subpages

### Verify
- `tsc --noEmit` clean · Vitest 110/110

### First-time UX audit (Jul 26, 2026)

20-persona simulation on Skisterapp; SAFE copy/UX only — no business-logic changes.

### Critical — fixed (re-sim: 0 Critical open)
- Onboarding CTA → “Continue to sign in” (was “Go to Home” → Login)
- Logout no longer clears `skister_onboarding_complete`
- Name hint clarifies pre-fill at signup
- Home empty getting-started (invite + share gear) + loadError/retry
- Explore no-results invite CTA + friendly loadError
- Network vs Referral invite labels disambiguated
- About Ski Network section; Premium tile label; FR/IT referral hub strings

### Still open (High/Medium/Low — backlog)
- Apple Sign-in “coming soon” honesty; Home Return/Scan prominence when idle; Splash skip; deeper FR/IT adventure pack

### Canvas
`canvases/skister-first-user-ux-audit.canvas.tsx`

## My Adventure Profile (Jul 26, 2026)

Flagship Profile in **Skisterapp** (`/profile`) — condensed hub + nested detail pages:

### Hub layout (~1 screen + short scroll)
Hero (settings gear) → Adventure / Reputation / Achievements / Activity / Preferences / Referral cards

### Nested routes
`/profile/adventure` · `/profile/reputation` · `/profile/achievements` · `/profile/timeline` · `/profile/preferences` · `/profile/referral` · `/profile/resources` · `/settings/*` (About via `/settings/about`)

### Trust / endorsements / achievements
- Hub shows compact Trust Score + top endorsement only; full breakdown on Reputation page
- Achievements hub: latest 3 unlocked + counts; full grid on Achievements page
- About copy canonical in `skister-about-copy.ts` (synced Help/FAQ/legal/landing)

### Backend (unchanged)
- Migration `20260726160000_adventure_profile.sql`; Edge `/adventure/*`; Trust Score auto-only

### Verify
- `tsc --noEmit` + Vitest + Vite production build clean

## Complete visual polish (Jul 26, 2026)

Production visual polish across **Skister-main** (marketing) + **Skisterapp** (app):

### Design system
- Typography: Outfit (display) + Source Sans 3 (body) in app `fonts.css` and landing/help
- Shadow tokens: `--shadow-card`, `--shadow-elevated`, `--shadow-cta`, `--shadow-photo` + `.skister-photo-hero*` utilities
- Bright green reserved for primary CTAs; nav/sidebar uses muted forest soft fill
- Empty states gain soft forest radial wash

### App screens
- Explore / My Gear: photo heroes (`/assets/home/explore-hero.jpg`, `my-gear-hero.jpg`)
- Profile: **My Adventure Profile** flagship redesign (hero + adventure sections + Trust Score); resort banner or tools-hero photo
- Tool details: shared `ToolPhotoHero` with catalog photography (DIN, ski length, boot size, packing, maintenance, emergency, trip)
- Desktop sidebar active state: `primary-soft` (not neon CTA fill); bottom nav stays muted

### Marketing site
- Tighter section rhythm; premium CTA gradient on waitlist submit
- `#home-actions` photo strip (borrow/share/return/scan)
- `#tools` full-bleed `tools-hero.jpg` backdrop; taller photo tiles
- `#roadmap` photo cards (snow / weather / emergency); muted status badges (no neon body accents)
- Help: labeled screenshot figures + denser card spacing; refreshed packing/maintenance photography

### Verify
- Skisterapp `tsc --noEmit` + Vite production build clean

## Emergency Information (Jul 26, 2026)

Live Safety tool in **Skisterapp** (`/tools/emergency-information`):

- Table `public.emergency_contacts` + RLS public SELECT of active rows; seed DE/AT/CH/FR/IT (national + ski regions)
- Migration `20260726150000_emergency_contacts.sql` applied; Edge `GET /emergency/countries` + `GET /emergency/contacts`
- Offline-first: bundled seed + `localStorage` cache (`skister_emergency_contacts_v1`); search by country/region/aliases
- UI: dialable numbers, official rescue websites, first-aid guidance (i18n EN/DE/FR/IT)
- Docs: `Skisterapp/docs/EMERGENCY_INFORMATION.md`; Help + Safety + landing `#tools` / `#roadmap` updated
- Catalog status `live`; removed from `FEATURE_INTEREST_SLUGS`
- `tsc --noEmit` + Vitest emergency module + Vite production build clean; Edge redeployed

## Snow Conditions Preview Experience (Jul 26, 2026)

Redesigned in **Skisterapp** (`/tools/snow-conditions`) + marketing site:

- Removed all placeholder/fake resorts, weather, snowfall, temperatures, and interactive controls
- Preview Experience: large photo hero, **Preview** label, headline + under-development subtitle, CSS mockups (labels only, skeleton bars — no numbers), **Notify me when available**
- Interest stored in Supabase `public.feature_interest` (RLS: own rows only); Edge `GET/POST /feature-interest`; client `services/feature-interest-api.ts`
- Domain types + provider contract kept under `lib/snow-conditions/` for future live mountain data; placeholder provider/data deleted
- Website: new `#roadmap` section (Live Snow Conditions / Resort Weather / Emergency); snow tool card copy updated; Help updated
- `tsc --noEmit` + Vitest snow module + Vite production build clean; Edge redeployed; migration `20260726140000_feature_interest.sql` applied

## Tool calculations private history + sync (Jul 26, 2026)

Implemented in **Skisterapp** (canonical Supabase project `ayomhapkzckbhgwxenwr`):

- Table `public.tool_calculations` + RLS (`auth.uid() = user_id` only); soft-delete for sync
- Migration `20260726130000_tool_calculations.sql` applied; Edge Function endpoints under `/tools/calculations` (list, upsert, delete, duplicate, sync)
- Offline-first cache keyed by userId + toolSlug; LWW merge; legacy localStorage imported once
- Wired tools: Trip Planner, Packing Checklist, DIN, Ski Length, Boot Size, Gear Maintenance
- Features: recent, favorites, rename, duplicate, delete, usage count, last used, cross-device sync
- Docs: `Skisterapp/docs/TOOLS_CALCULATIONS.md` + Edge Functions README
- `tsc --noEmit` + Vite production build clean; Edge redeployed

## Tools hub premium redesign (Jul 26, 2026)

Implemented in **Skisterapp** (`/tools`):

- Premium dashboard layout: photo hero banner → sectioned tiles (max 2 per row)
- Sections: **Winter Tools → Planning → Equipment → Safety** (Outdoor renamed to Equipment)
- Visual tiles match Home action cards: background image, dark overlay, icon, title, short description, arrow
- Removed Ready / Coming Soon / placeholder badges from hub cards
- Catalog: `lib/tools-catalog.ts` (+ `image` per tool); tiles: `components/tools/tool-card.tsx`
- Assets: `public/assets/tools/*.jpg` (hero + per-tool)
- Snow Conditions + Resort Weather moved under Winter; Gear Maintenance under Equipment
- **Skister-main**: landing `#tools` section restyled as premium photo tiles (2-col), Help + landing-content category copy updated; screenshots under `assets/images/tools/`
- `tsc --noEmit` + Vite production build clean

## Multi-activity Add Gear (Jul 26, 2026)

Implemented in **Skisterapp** (+ Help/FAQ in Skister-main):

- Two-step category selection in Add Gear wizard: **Activity → Equipment**
- Activities (skiing first): Skiing, Snowboarding, Camping, Hiking, Climbing, Cycling, Fishing, Photography, Watersports, BBQ, Other Outdoor
- Equipment lists load dynamically per activity; custom category supported (slugified)
- Stored fields: activity, category, brand, model, condition, purchase year, replacement value, availability, notes (+ existing size/images)
- Migration `20260726120000_gear_activity_categories.sql` applied to project `ayomhapkzckbhgwxenwr` (backward compatible; legacy categories kept)
- Edge Function + client API updated; Explore `matchesActivity` prefers `gear.activity`
- My Gear filters by activity; i18n EN/DE/FR/IT; Help + landing FAQ updated
- Taxonomy: `src/app/lib/gear-taxonomy.ts`; wizard: `add-gear-wizard.tsx`
- `tsc --noEmit` + Vite build clean; Edge redeployed

## Home screen visual polish (Jul 26, 2026)

Implemented in **Skisterapp** (`src/app/screens/Home.tsx`):

- Four primary action cards redesigned with full-bleed background photos (`public/assets/home/{borrow,share,return,scan}.jpg`), dark + soft green gradients, rounded-2xl, white readable text, hover scale + press animations (`prefers-reduced-motion` respected)
- Header now leads with product subtitle: “The easiest way to share ski gear with people you trust”
- **Quick Access** section under the cards: Find Ski Gear (opens date/name finder), My Reservations (`/reminders` + unread badge), My Gear (`/my-gear`), Invite Friends (`/network?invite=1`)
- Network opens invite sheet when `?invite=1` is present
- EN/DE/FR/IT translations updated; onboarding ready copy mentions Home actions; Help (Skister-main `Help.tsx` + `help.html`) documents Home + Quick Access; help page includes home action imagery
- Duplicate Reminders/Invite shortcut row removed (covered by Quick Access)
- `tsc --noEmit` + Vite production build clean

## Snow Conditions dashboard (Jul 2026)

Replaced (Jul 26) by **Preview Experience** — no demo resorts or fabricated weather. See “Snow Conditions Preview Experience” above. Provider types remain for a future live integration.

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
- Sections: **Winter Tools → Planning → Equipment → Safety** (premium visual tiles as of Jul 26 redesign)
- Catalog-driven UI: add tools in `src/app/lib/tools-catalog.ts` — they appear automatically
- Nested routes: `/tools/:toolSlug` → live tool or polished placeholder (tool-specific highlights)
- Live tools: Trip Planner (`/tools/trip-planner`), Ski DIN Calculator (`/tools/din-calculator`), Ski Length Finder (`/tools/ski-length-finder`), Boot Size Converter (`/tools/boot-size-converter`), Packing Checklist (`/tools/packing-checklist`), Gear Maintenance (`/tools/gear-maintenance`), Emergency Information (`/tools/emergency-information`); Snow Conditions (`/tools/snow-conditions`) is a Preview Experience (no live data); remaining tools are placeholders
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

### Marketing ↔ app alignment (Jul 26, 2026)

Landing now mirrors the mobile app surface:

- New **Tools** section (`#tools`): DIN, ski length, boot size, trip planner, packing, snow conditions, gear maintenance, beyond-winter adventure
- New **Pricing / Premium** section (`#pricing`): Free €0, Premium €4.99/mo (annual €39.99), Founder Lifetime €89.99 — sharing never paywalled
- FAQ cost + Ski Network answers aligned with app; FR/ES/IT onboarding brought to invite-first
- SEO: refined meta description/keywords; added Organization + SoftwareApplication + FAQPage JSON-LD (existing seo-inject.js kept)
- Help / Privacy overview / blog index / footer+nav links updated for Tools & Pricing
- CMS snapshot `data/landing-content.json` includes new nav/pricing/tools/FAQ keys for DE/EN

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
- **Footer scroll fix (Jul 26):** removed `scroll-snap-type: y mandatory` + `scroll-snap-stop: always` — mandatory snap trapped the viewport on the last snap section (FAQ), so the non-snapped footer was unreachable. Natural document scroll restored; hero still full-viewport.
- Feature cards + Help copy aligned to production app (Maintenance Center, QR handoff, Adventure Profile, offline, Trusted Network). Home strip includes Explore + My Gear heroes. WebP + compressed JPEGs. Shipped `features.*` / `homeActions.*` keys from `data/landing-content.json` re-applied after CMS so stale API copy cannot override product truth.
- App Store badges remain honest “coming soon” (no live store URLs yet).
- Mascot/onboarding artwork URLs and order unchanged; no mobile-app / business-logic changes in this pass.

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

## Production readiness program (Jul 26, 2026)

Completed a 10-phase production audit across **Skisterapp** (app + Edge) and **Skister-main** (marketing).

### Critical fixes shipped
- Runtime crash fixes: missing imports (`ResortUserCardView`, `doesDateRangeOverlap`, `resolveAvatarUrl`)
- Security: referral RPC `auth.uid()` binding migration applied; cron auth + QR handoff fail-closed; `QR_HANDOFF_SECRET` + `CRON_SECRET` set; legacy admin password removed
- Marketing: mobile nav + cookie banner + Twitter cards + sitemap legal pages + ski-first hero video
- i18n Critical gaps closed (oauth hint, refresh, FR/IT referral/premium, Home/Profile/Layout/LanguageSelection)
- Subscription Upgrade CTA no longer no-ops (“coming soon”)
- `/inventory` redirects to `/explore` (legacy route)

### Build verification
- `tsc --noEmit`: clean
- Vitest: 89/89 pass
- Vite production build: success (main chunk ~940KB — still large; warning remains)
- Android `assembleRelease`: success
- iOS Release (unsigned): success
- Edge Function redeployed to `ayomhapkzckbhgwxenwr`

### Remaining High (not ship-blocking correctness, but must track)
- Signup still uses `email_confirm: true` (no outbound email server) — mitigated by referral RPC binding
- Paid IAP not wired (CTA disabled honestly)
- No native push; notification prefs local-only
- CMS / hardcoded FAQ / JSON-LD still three sources of truth
- Main JS bundle still large (locale split recommended)
- Chat table RLS not fully verifiable in migrations
- No ESLint pipeline yet (`typecheck` script added)

### Ops note
- Configure scheduled cron with `Authorization: Bearer $CRON_SECRET` (secret set in Supabase; value was written once to a local temp file for scheduler setup — rotate if exposed).

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

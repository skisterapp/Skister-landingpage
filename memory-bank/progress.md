# Progress

## What works

- Public landing + blog surfaces exist in static HTML
- My Adventure Profile (Skisterapp `/profile`): adventure identity, Trust Score, endorsements, achievements, timeline, preferences — synced to Supabase with RLS
- Release tooling exists (`scripts/release-new.mjs`)
- Supabase Edge Function deploy workflow is defined (`npm run supabase:deploy`)
- Landing CMS content syncs to git via GitHub Actions; Edge Function can dispatch publish on save

## Current work

- Onboarding/auth/branding regression fix (Jul 26) in **Skisterapp**: wrong “D” launcher → official Skister IconKitchen icons; returning users skip onboarding; final-page auth CTAs; first-run persistence; Vitest **155**
- Maintenance Center production QA (Jul 26): Critical/High fixed (tombstones, private docs, LWW, cascade delete, offline create, health, delete UI); Vitest **149**; Edge + migration deployed — **production-ready for Maintenance Center**
- v1.0 stabilization (Jul 26): Condition dialog/Users/Shortages i18n, Home/Explore date prefs, handoff URL hygiene, DEV-gated logs, a11y touch targets — Skisterapp `tsc` + Vitest **135** + Vite + Android/iOS Release · readiness **97/100** · **Production Ready (v1.0)** · canvas `skister-v1-stabilization.canvas.tsx`
- Equipment Maintenance Center (Jul 26): My Gear health summaries + `/my-gear/:gearId/maintenance` (records, analytics, reminders, attachments, templates, offline sync); migration + Edge deployed; Gear Maintenance tool + premium log preserved — Skisterapp `tsc` + Vitest **133**
- RC1 polish (Jul 26): Medium/Low i18n + date/unit prefs + navigateBack + privacy honesty + PII logs — Skisterapp `tsc` + Vitest **125** + Vite + Android Release + iOS Release · readiness **95/100** · **RC1 ready** · canvas `skister-rc1-polish.canvas.tsx`
- Final production audit (Jul 26): Critical/High store blockers fixed (OAuth PKCE, backup, blog sanitize, settings honesty, notif filter, QR/Reminders i18n) — Skisterapp `tsc` + Vitest **122** · readiness **91/100** · canvas `skister-final-production-audit.canvas.tsx`
- Production UX audit + nav polish (Jul 26): hardware back, tab replace history, history-aware Back, About/Legal dedupe, Reminders Back+Rate, Referral canonical route — Skisterapp `tsc` + Vitest **115** clean; canvas `skister-production-ux-audit.canvas.tsx`
- Profile dashboard + Settings hub UX (Jul 26): Profile slimmed to 6 cards; Settings becomes full control center (`/settings/*`); timeline localization never leaks keys; reputation stages + friendly trust copy; achievements “Badge Earned / Available”; About shared via AboutSkister — Skisterapp `tsc` + Vitest **115** clean
- Production UX polish (Jul 26): Home contextual CTAs + Return gate + New-to-Skister tip; Apple Sign-In disabled Coming Soon; Splash Continue; New Member trust until completed rentals; coaching empty states; skeletons across key screens — Skisterapp `tsc` + Vitest + Vite production build clean
- First-time UX audit (Jul 26): 20-persona sim → Critical SAFE fixes shipped in Skisterapp (onboarding CTA, logout persistence, Home/Explore empty+offline, invite disambiguation, Premium/About Ski Network); re-sim **0 Critical**; canvas `skister-first-user-ux-audit.canvas.tsx`
- My Adventure Profile (Jul 26): condensed Profile hub + nested detail pages (`/profile/adventure|reputation|achievements|timeline|preferences|referral|resources`); About via `/settings/about`; About copy synced Help/FAQ/legal/landing; `tsc` + Vitest + Vite build clean
- Complete visual polish (Jul 26): typography (Outfit + Source Sans 3), shadow/photo-hero tokens, Explore/MyGear/Profile/tool photo heroes, landing home-actions + tools-hero + roadmap photos, refreshed packing/maintenance imagery, Help labeled screenshots; Skisterapp typecheck + Vite build clean
- Emergency Information (Jul 26): live Safety tool; `emergency_contacts` table + Edge GET; offline cache; first-aid; Help/Safety/landing updated; Skisterapp typecheck + build + Edge deploy clean
- Snow Conditions Preview Experience (Jul 26): removed fake resort/weather data; preview hero + mockups + Notify me; `feature_interest` table + Edge endpoints; website `#roadmap` + Help; Skisterapp typecheck + build + Edge deploy clean
- Tool calculations private history + sync (Jul 26): `tool_calculations` table + RLS; Edge `/tools/calculations`; offline cache per user; Trip/Packing/DIN/Ski Length/Boot Size/Maintenance wired; docs in Skisterapp `docs/TOOLS_CALCULATIONS.md`; typecheck + Vite build + Edge deploy clean
- Tools hub premium redesign (Jul 26): photo hero + visual tiles (2/row); sections Winter / Planning / Equipment / Safety; no Ready/Coming Soon badges; landing `#tools` + Help screenshots updated; Skisterapp typecheck + Vite build clean
- Multi-activity Add Gear (Jul 26): two-step Activity → Equipment wizard; custom categories; brand/model/purchase year/replacement value; schema migration + Edge deploy; Help/FAQ/i18n updated; Skisterapp typecheck + Vite build clean
- Home screen visual polish (Jul 26): primary action cards with photo backgrounds + Quick Access row; translations/help/onboarding updated; Skisterapp typecheck + Vite build clean
- Production readiness program (Jul 26): Critical runtime + security + marketing + i18n fixes shipped; Android/iOS/web builds verified; Edge + referral migration deployed
- Add Gear wizard redesign in Skisterapp: photo-first flow now includes activity + equipment steps, draft auto-save, large buttons
- Onboarding redesign in Skisterapp: 5-screen teach flow (intent → activities → invite → profile → home/login); selections saved for Explore/Home personalization
- My Gear management redesign in Skisterapp (`/my-gear`): owner inventory with stats, borrower/reservation info, Edit/Share/Maintain/unavailable/Delete — Maintain opens Gear Maintenance with gear prefilled; filters by activity
- Ski-first brand repositioning (Skister-main + Skisterapp): ski sharing primary; camping/hiking/other outdoor secondary; Ski Network restored; trusted-network framing; onboarding/empty states/tools hub no longer lead with generic outdoor
- Trusted-network copy pass (Jul 26): reinforced private communities / friends / families / ski clubs / local groups across landing, help, onboarding, empty states, invite, network, profile, FAQ, borrow/request wording — no marketplace implication; business logic unchanged
- Marketing ↔ app alignment (Jul 26): landing Tools + Pricing/Premium sections, FAQ/Premium messaging, FR/ES/IT invite-first onboarding, JSON-LD structured data, help/privacy/blog/footer updates — ski-first trusted-network positioning intact
- Skisterapp UI polish complete (tokens, spacing ~25% tighter in-card / roomier sections, empty/skeleton, motion, CTA-only bright green, 44px targets, radius consistency) — pending visual sign-off on dark Home/Explore/Tools/Profile
- Tools hub redesign in Skisterapp (`/tools`): outdoor utilities in **Winter Tools / Planning / Equipment / Safety**; catalog in `lib/tools-catalog.ts`; premium photo tiles (Jul 26)
- Live tools: Trip Planner (`/tools/trip-planner`), Ski DIN Calculator (`/tools/din-calculator`), Ski Length Finder (`/tools/ski-length-finder`), Boot Size Converter (`/tools/boot-size-converter`), Packing Checklist (`/tools/packing-checklist`), Gear Maintenance (`/tools/gear-maintenance`), Emergency Information (`/tools/emergency-information`); Snow Conditions (`/tools/snow-conditions`) is a **Preview Experience** (no live mountain data); Resort Weather remains a polished placeholder
- Functional tools (except Snow Conditions) persist private per-user history to `tool_calculations` with RLS + offline sync (recent, favorites, rename, duplicate, delete)
- Snow Conditions: Preview Experience only — no fictional resorts/weather; notify interest via `feature_interest`; provider types kept for future live API
- Gear Maintenance Tracker: reminders + recurrence + history; synced via `tool_calculations`; My Gear Maintain deep-link; unit tests in `gear-maintenance.test.ts`
- Packing Checklist: trip type / duration / weather / people / children → checklist; tick, custom items, save/duplicate, PDF export; cloud + offline sync; unit tests in `packing-checklist.test.ts`
- Ski DIN Calculator: ISO 11088 metric estimator, DIN range + disclaimer, synced history; unit tests in `din-calculator.test.ts`
- Ski Length Finder: height/weight/optional gender/ability/terrain → length range + explanation + community ski matches; synced history; unit tests in `ski-length-finder.test.ts`
- Boot Size Converter: Mondopoint/EU/UK/US Men/US Women instant convert + foot-length guide; synced history; unit tests in `boot-size-converter.test.ts`
- Explore consumer redesign in Skisterapp: standalone `/explore` with Search / Activity / Location / Dates + Browse Gear CTA; keeps `getAllGear` / `getAvailableGear` / `getResortGear`
- Home action-first dashboard in Skisterapp: primary actions + auto-hiding pickups/returns/friend requests/activity sections
- Fixed live site CMS overwrite bug (stale `landing-content.json` after API apply) — pushed to Skister-landingpage
- Wired Edge Function auto GitHub publish on landing/blog CMS save (`github_landing_publish.tsx`)
- Yesterday’s blog posts were already regenerated on remote (tegernsee, augsburg, wallis, etc.)
- `fix/production-polish`: shared content container, vertical rhythm, header/FAQ/footer polish; **mandatory scroll-snap removed** so footer is reachable on all viewports; production feature copy + WebP imagery + SEO/a11y polish — pending review/merge

## Known gaps / risks

- Live Landing CMS API may still serve older hero/FAQ until Publish / content sync picks up ski-first copy from `data/landing-content.json`.
- If CMS save does not create a GitHub Actions run, rotate/recheck `GITHUB_LANDING_DISPATCH_TOKEN` (needs `actions:write` on skisterapp/Skister-landingpage).
- Some UI changes may be applied directly to built artifacts under `dist/` if source code is not present in this repo; these changes can be overwritten by rebuilds.
- Pending resort request form still accepts free-text country/region (localized names); approve now resolves aliases, but prefer English/ISO in CMS when possible.

# Progress

## What works

- Public landing + blog surfaces exist in static HTML
- Release tooling exists (`scripts/release-new.mjs`)
- Supabase Edge Function deploy workflow is defined (`npm run supabase:deploy`)
- Landing CMS content syncs to git via GitHub Actions; Edge Function can dispatch publish on save

## Current work

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
- Tools hub redesign in Skisterapp (`/tools`): outdoor utilities in **Winter Tools / Outdoor Tools / Planning / Safety**; catalog in `lib/tools-catalog.ts`
- Live tools: Trip Planner (`/tools/trip-planner`), Ski DIN Calculator (`/tools/din-calculator`), Ski Length Finder (`/tools/ski-length-finder`), Boot Size Converter (`/tools/boot-size-converter`), Packing Checklist (`/tools/packing-checklist`), Gear Maintenance (`/tools/gear-maintenance`), Snow Conditions (`/tools/snow-conditions`); other tools polished placeholders
- Snow Conditions: provider-based dashboard (placeholder data) with snow depth, fresh snow, temp, wind, lifts, runs, webcam placeholder, forecast, favourites; `lib/snow-conditions/` + unit tests
- Gear Maintenance Tracker: local reminders + recurrence + history; My Gear Maintain deep-link; unit tests in `gear-maintenance.test.ts`
- Packing Checklist: trip type / duration / weather / people / children → offline checklist; tick, custom items, save/duplicate, PDF export; localStorage; unit tests in `packing-checklist.test.ts`
- Ski DIN Calculator: ISO 11088 metric estimator, DIN range + disclaimer, local recent-history; unit tests in `din-calculator.test.ts`
- Ski Length Finder: height/weight/optional gender/ability/terrain → length range + explanation + community ski matches; local history; unit tests in `ski-length-finder.test.ts`
- Boot Size Converter: Mondopoint/EU/UK/US Men/US Women instant convert + foot-length guide; local history; unit tests in `boot-size-converter.test.ts`
- Explore consumer redesign in Skisterapp: standalone `/explore` with Search / Activity / Location / Dates + Browse Gear CTA; keeps `getAllGear` / `getAvailableGear` / `getResortGear`
- Home action-first dashboard in Skisterapp: primary actions + auto-hiding pickups/returns/friend requests/activity sections
- Fixed live site CMS overwrite bug (stale `landing-content.json` after API apply) — pushed to Skister-landingpage
- Wired Edge Function auto GitHub publish on landing/blog CMS save (`github_landing_publish.tsx`)
- Yesterday’s blog posts were already regenerated on remote (tegernsee, augsburg, wallis, etc.)
- `fix/production-polish`: shared content container, vertical rhythm, header/FAQ/footer polish, desktop snap + mobile natural scroll — pending review/merge

## Known gaps / risks

- Live Landing CMS API may still serve older hero/FAQ until Publish / content sync picks up ski-first copy from `data/landing-content.json`.
- If CMS save does not create a GitHub Actions run, rotate/recheck `GITHUB_LANDING_DISPATCH_TOKEN` (needs `actions:write` on skisterapp/Skister-landingpage).
- Some UI changes may be applied directly to built artifacts under `dist/` if source code is not present in this repo; these changes can be overwritten by rebuilds.
- Pending resort request form still accepts free-text country/region (localized names); approve now resolves aliases, but prefer English/ISO in CMS when possible.

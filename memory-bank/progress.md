# Progress

## What works

- Public landing + blog surfaces exist in static HTML
- Release tooling exists (`scripts/release-new.mjs`)
- Supabase Edge Function deploy workflow is defined (`npm run supabase:deploy`)
- Landing CMS content syncs to git via GitHub Actions; Edge Function can dispatch publish on save

## Current work

- Ski-first brand repositioning (Skister-main + Skisterapp): ski sharing primary; camping/hiking/other outdoor secondary; Ski Network restored; trusted-network framing
- Skisterapp UI polish (tokens, spacing, empty/skeleton, motion, CTA-only bright green) — pending visual sign-off
- Trip Planner live in Skisterapp Tools (`/tools`): packing, borrow suggestions from network gear, estimates, invite + Explore CTAs
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

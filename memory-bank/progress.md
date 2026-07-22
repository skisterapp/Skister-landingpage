# Progress

## What works

- Public landing + blog surfaces exist in static HTML
- Release tooling exists (`scripts/release-new.mjs`)
- Supabase Edge Function deploy workflow is defined (`npm run supabase:deploy`)
- Landing CMS content syncs to git via GitHub Actions; Edge Function can dispatch publish on save

## Current work

- Fixed live site CMS overwrite bug (stale `landing-content.json` after API apply) — pushed to Skister-landingpage
- Wired Edge Function auto GitHub publish on landing/blog CMS save (`github_landing_publish.tsx`)
- Yesterday’s blog posts were already regenerated on remote (tegernsee, augsburg, wallis, etc.)

## Known gaps / risks

- If CMS save does not create a GitHub Actions run, rotate/recheck `GITHUB_LANDING_DISPATCH_TOKEN` (needs `actions:write` on skisterapp/Skister-landingpage).
- Some UI changes may be applied directly to built artifacts under `dist/` if source code is not present in this repo; these changes can be overwritten by rebuilds.
- Pending resort request form still accepts free-text country/region (localized names); approve now resolves aliases, but prefer English/ISO in CMS when possible.

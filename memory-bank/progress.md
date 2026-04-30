# Progress

## What works

- Public landing + blog surfaces exist in static HTML
- Release tooling exists (`scripts/release-new.mjs`)
- Supabase Edge Function deploy workflow is defined (`npm run supabase:deploy`)

## Current work

- Ensure the app home header uses the signed-in user’s profile image instead of the mascot/logo

## Known gaps / risks

- Some UI changes may be applied directly to built artifacts under `dist/` if source code is not present in this repo; these changes can be overwritten by rebuilds.


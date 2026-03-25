# CMS + SEO (Skister) — implementation map

This project mirrors the **SeaDays-style** SEO CMS and static blog pipeline. The reference checklist lives in the SeaDays repo as `docs/CMS_SEO_REPLICATION_BRIEFING.md`.

## What is in this repo

| Area | Location |
|------|-----------|
| SEO CMS (Supabase Auth, roles, site/article SEO, visibility, comments queue, GitHub dispatch) | `seo-admin.html` |
| Edge Function (API) | `supabase/functions/make-server-080ebf84/index.tsx` (ignored by git; deploy from your copy) |
| KV helpers | `supabase/functions/make-server-080ebf84/kv_store.tsx` — includes `listByPrefix` for comment admin |
| Static generator | `scripts/generateBlogs.js` — `npm run generate:blogs` |
| Landing SEO inject (optional) | `scripts/seo-inject.js` — loaded from `index.html` |
| Crawl hints | `robots.txt`, `sitemap.xml` (regenerated in part by the generator) |
| CI | `.github/workflows/generate-blogs.yml` |

## API base

`https://ayomhapkzckbhgwxenwr.supabase.co/functions/v1/make-server-080ebf84`

### CMS / SEO routes

- `GET/PUT /site-seo` — site defaults (PUT: admin JWT)
- `GET/PUT /blog/posts/:slug/seo` — per-post overrides (PUT: admin JWT)
- `PUT /blog/posts/:slug/visibility` — `{ showOnWebsite: boolean }` (admin JWT)
- `GET /blog/posts?forWebsite=1` — public-visible posts only
- `GET /blog/posts?admin=1&summary=1` — lightweight list (moderator+ JWT)
- `GET/POST /landing-cms/me`, `members`, `comments/pending`, `comments/moderate`, `trigger-github-publish`
- `POST /landing-admin-verify`, `POST /landing-admin-reset-password` — password CMS (`X-Admin-Password`)
- `GET/PATCH/DELETE /blog/comments` — aggregate moderation (password header **or** CMS JWT)
- `GET/POST .../blog/posts/:slug/comments`, likes — public engagement

### KV keys (Skister)

- `skister:site:seo`
- `skister:blog-seo:{slug}` (URL-encoded slug segment)
- `skister:landing-cms:members`
- `skister:landing-cms:comment-queue`
- `skister:landing:admin-password` (after first password reset)
- `skister:blog-comments:{slug}`, `skister:blog-likes:{slug}`

### Secrets (Supabase Edge Function)

- `LANDING_CMS_BOOTSTRAP_ADMIN_IDS` — comma-separated Auth UUIDs
- `LANDING_ADMIN_PASSWORD` — optional until KV stores password via reset
- `GITHUB_LANDING_DISPATCH_TOKEN`, `GITHUB_LANDING_DISPATCH_REPO` — optional publish button
- Optional: `GITHUB_LANDING_WORKFLOW_FILE`, `GITHUB_LANDING_DISPATCH_REF`

### Static generator env

- `SUPABASE_ANON_KEY` (required)
- Optional: `SKISTER_SITE_URL`, `SKISTER_SUPABASE_URL`

## Deploy notes

Supabase CLI uploads **`index.ts`** as the function entrypoint. Edits are in **`index.tsx`**; `npm run supabase:deploy` copies `index.tsx` → `index.ts` before deploy so routes like `/landing-cms/me` are not missing on production.

Redeploy the Edge Function after changing `index.tsx` / `kv_store.tsx`. If your workflow copies sources elsewhere (e.g. `server/` → `make-server-080ebf84/`), follow that process; this tree edits `make-server-080ebf84` directly.

GitHub Actions needs `SUPABASE_ANON_KEY` in repo secrets for `generate-blogs.yml`.

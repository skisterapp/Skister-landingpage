# Static blog generation (Skister)

## Run locally

```bash
export SUPABASE_ANON_KEY="your-anon-jwt"
# optional: export SKISTER_SITE_URL="https://skister.app"
npm run generate:blogs
```

Writes:

- `blog/{slug}/index.html` — article pages with canonical, OG/Twitter, JSON-LD Article
- `blog/{slug}.html` — redirect to canonical URL
- `blog/index.html` — static index of visible posts
- `sitemap.xml` — core URLs + article URLs

## Inputs

- `GET /site-seo`
- `GET /blog/posts?forWebsite=1`
- `GET /blog/posts/:slug`
- `GET /blog/posts/:slug/seo`

## CI

Workflow: `.github/workflows/generate-blogs.yml` (manual + daily). Configure repository secret `SUPABASE_ANON_KEY` and optionally variable `SKISTER_SITE_URL`.

## CMS publish button (optional)

The **SEO CMS** (`seo-admin.html`) can trigger GitHub Actions to regenerate the static site from the admin panel.

Required Supabase Edge Function secrets:

- `GITHUB_LANDING_DISPATCH_TOKEN` — GitHub PAT (fine-grained recommended) with permission to run Actions workflows on the landing repo
- `GITHUB_LANDING_DISPATCH_REPO` — `owner/repo` (no URL), e.g. `your-org/skister`

Optional:

- `GITHUB_LANDING_WORKFLOW_FILE` — defaults to `generate-blogs.yml`
- `GITHUB_LANDING_DISPATCH_REF` — defaults to `main`

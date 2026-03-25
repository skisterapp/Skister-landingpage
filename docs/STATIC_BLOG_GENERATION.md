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

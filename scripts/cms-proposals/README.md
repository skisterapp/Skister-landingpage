# CMS content proposals (review only)

**Do not apply to production Supabase without explicit authorization.**

## Files

| File | Purpose |
|------|---------|
| `skischuhe-236-mm.body.html` | Full replacement HTML for post `content` (below title/featured image in CMS). |
| `bsl-safety-block.html` | Shared safety section; insert once before `<h2>Fazit</h2>` on six sibling BSL posts. |
| `manifest.json` | Slug list and apply rules. |

## CMS field

Paste into **blog post → `content`** (German HTML). Keep existing `title`, `slug`, `metaTitle`, `metaDescription`, `featuredImage`, and URL unchanged.

## Local static preview

```bash
node scripts/apply-cms-proposals-local.js
npm run validate:bsl-cms-proposals

`generateBlogs.js` automatically re-applies this bundle for managed slugs after each article HTML build (no production CMS write). `validate-bsl-regeneration-guard` simulates stale CMS output and asserts re-apply restores the bundle.
npm run validate:deploy
```

Regenerating with `generate:blogs` **without** CMS updates will overwrite local static HTML.

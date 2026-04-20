# Deploy to live landing page (skisterapp/Skister-landingpage)

This folder is the source for the live site: **https://skisterapp.github.io/Skister-landingpage/**

The repo lives in a different account: **https://github.com/skisterapp/Skister-landingpage**

**Note:** This project is **not** configured to push to Skister-landingpage by default. The live repo is stored as the remote `skister-live` (not `origin`), so normal `git push` will not update it. Only push to the live site when you intentionally deploy (see below).

## Link this folder to the live repo and push

1. **Live repo remote:** The live repo is already added as `skister-live` (not `origin`), so normal pushes do not update it. To deploy intentionally:

2. **Fetch and push to the live repo** (only when you want to update the live site):

   ```bash
   git fetch skister-live
   git push skister-live main:main
   ```

   Or if you're on `main`:

   ```bash
   git push skister-live main
   ```

3. **If you need to force-push** (only if you're replacing the live site with this content—use with care):

   ```bash
   git push skister-live main:main --force
   ```

   Use with care: this overwrites the history on the live repo.

## Make this folder the main copy for the live repo

To push this folder to [skisterapp/Skister-landingpage](https://github.com/skisterapp/Skister-landingpage) (intentional deploy only):

```bash
git add .
git commit -m "Update blog thumbnails and landing page"
git push skister-live main
```

You need **write access** to the **skisterapp/Skister-landingpage** repo (member of the org or added as collaborator).

## After pushing

GitHub Pages will rebuild automatically. The site will update at https://skisterapp.github.io/Skister-landingpage/ within a few minutes.

## SEO: canonical URL, `robots.txt`, and redirects

**Canonical host:** `https://skister.app/` (HTTPS, no `www`, no `index.html` in the preferred URL).

- **Canonical `<link>` tags** are present on the main HTML entry points (`index.html`, `blog.html`, `blog-post.html`, admin screens, and generated blog pages under `blog/`).
- **`robots.txt`** at the site root lists `Sitemap: https://skister.app/sitemap.xml` (regenerated with `npm run generate:blogs` when needed).
- **`_redirects`** (Netlify / Cloudflare Pages–style) is included for hosts that honor it. **GitHub Pages does not apply `_redirects`**, so behavior depends on the platform:
  - **HTTP → HTTPS** and **`www` → apex** are already handled by GitHub Pages for the custom domain (verify with `curl -sI http://skister.app/` and `curl -sI https://www.skister.app/` — expect a single `301` to `https://skister.app/`).
  - **`/index.html` → `/`:** `index.html` includes a small script that replaces the location when the path is exactly `/index.html`, plus a canonical pointing at `https://skister.app/`. For a true **301** at the edge, add a redirect rule on your DNS/CDN (e.g. Cloudflare: `https://skister.app/index.html` → `https://skister.app/`).

**Quick checks after deploy:**

```bash
curl -sI "https://skister.app/robots.txt" | head -5
curl -sI "https://skister.app/sitemap.xml" | head -5
curl -sI "http://www.skister.app/" | head -8
```

# Google Search Console (Skister)

1. Ensure `https://skister.app/robots.txt` references `sitemap.xml`.
2. After running `npm run generate:blogs`, deploy so `sitemap.xml` includes article URLs.
3. In [Google Search Console](https://search.google.com/search-console), add the property and submit `https://skister.app/sitemap.xml`.
4. Use **URL Inspection** to request indexing for new posts.
5. Monitor **Indexing → Pages**, **Performance**, and **Core Web Vitals**.

If the site is served from GitHub Pages under a different host, use that canonical host in `site-seo` and `SKISTER_SITE_URL` when generating.

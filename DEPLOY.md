# Deploy to live landing page (skisterapp/Skister-landingpage)

This folder is the source for the live site: **https://skisterapp.github.io/Skister-landingpage/**

The repo lives in a different account: **https://github.com/skisterapp/Skister-landingpage**

## Link this folder to the live repo and push

1. **Add the live repo as a remote** (if not already):

   ```bash
   cd /Users/sharanestone/Semprog/Skister/Skister-main/Skister-landingpage-main
   git remote add live https://github.com/skisterapp/Skister-landingpage.git
   ```

   If you already have a different `origin`, keep it. Use `live` for the skisterapp repo.

2. **Fetch and push to the live repo**:

   ```bash
   git fetch live
   git push live main:main
   ```

   Or if the default branch on GitHub is `main` and you're on it:

   ```bash
   git push live main
   ```

3. **If this folder was not cloned from skisterapp/Skister-landingpage**, you may need to force-push once (only if you're replacing the live site with this content):

   ```bash
   git push live main:main --force
   ```

   Use with care: this overwrites the history on the live repo.

## Make this folder the main copy for the live repo

To use this folder as the only copy and push it to skisterapp/Skister-landingpage:

```bash
cd /Users/sharanestone/Semprog/Skister/Skister-main/Skister-landingpage-main
git remote set-url origin https://github.com/skisterapp/Skister-landingpage.git
git add .
git commit -m "Update blog thumbnails and landing page"
git push -u origin main
```

You need **write access** to the **skisterapp/Skister-landingpage** repo (member of the org or added as collaborator).

## After pushing

GitHub Pages will rebuild automatically. The site will update at https://skisterapp.github.io/Skister-landingpage/ within a few minutes.

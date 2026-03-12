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

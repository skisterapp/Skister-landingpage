# Landing SEO CMS — team & roles (Skister)

## Roles

- **Bootstrap admin** — always admin; set via Edge Function secret `LANDING_CMS_BOOTSTRAP_ADMIN_IDS` (Supabase Auth UUIDs). Cannot be removed via `seo-admin` Team UI.
- **KV admin / moderator** — managed in **Team** tab in `seo-admin.html` (Supabase sign-in required).

## Permissions

| Capability | Admin | Moderator |
|------------|-------|-----------|
| Site SEO, article SEO, visibility, GitHub publish, team | ✓ | — |
| Blog visibility table (view) | ✓ | ✓ |
| Pending guest comments | ✓ | ✓ |
| Password-only blog comment list (`blog-admin` / `admin.html`) | ✓ (shared password) | — |

## Adding the first CMS user

1. Create the user in **Supabase Auth** (email/password).
2. Add their UUID to `LANDING_CMS_BOOTSTRAP_ADMIN_IDS` **or** have an existing admin add them under Team.

## Legacy admin password

`admin.html`, `landing-admin.html`, and `blog-admin.html` use **X-Admin-Password** against `landing-admin-verify`. Password is stored in KV after a successful **reset password** from Settings, or matched against `LANDING_ADMIN_PASSWORD` until then.

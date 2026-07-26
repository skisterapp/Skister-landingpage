# IconKitchen-Skister (canonical brand package)

This folder is the **single source of truth** for Skister launcher / favicon / store icons.

Keep the same package in:

- Website: `Skister-main/branding/IconKitchen-Skister`
- App: `Skisterapp/resources/IconKitchen-Skister`

## Contents

| Path | Use |
|------|-----|
| `android/` | Play Store 512 + adaptive mipmaps |
| `ios/` | App Store / Xcode AppIcon set |
| `web/` | favicon.ico, apple-touch-icon, PWA 192/512 (+ maskable) |

## Apply after replacing this package

From each repo root, regenerate installed assets from this folder (do not invent alternate logos).

### App (Skisterapp)

Copy Android `android/res/mipmap-*` → `android/app/src/main/res/mipmap-*` as `ic_launcher*`,  
copy `android/play_store_512.png` → `resources/icon.png` + `src/assets/skister-*.png`,  
copy `ios/*` into `ios/App/App/Assets.xcassets/AppIcon.appiconset/`,  
copy `web/*` into `public/`.

### Website (Skister-main)

Copy `web/*` → repo root + `assets/`,  
copy `android/play_store_512.png` → `assets/skister-app-icon.png`,  
keep `assets/favicon.png` aligned with `web/icon-512.png`.

Do **not** use leftover icons from other projects or older IconKitchen exports.

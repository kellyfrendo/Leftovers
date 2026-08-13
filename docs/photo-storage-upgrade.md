# Photo storage upgrade plan (deferred)

**Status:** Planned — not started (user asked to revisit later)  
**Live app:** https://frendofamily.netlify.app

## Why upgrade

Today, product photos are stored as compressed base64 JPEG data URLs inside `settings.presets[].photo`. The entire settings object syncs to Supabase on every save.

**Current practical limit:** ~20–50 photographed shortcuts before sync/load feels slow.  
**After upgrade:** hundreds of photos (limited mainly by Supabase Storage quota, ~1 GB on free tier).

## Target architecture

```
iPad / browser
  → pick photo in Settings → Shortcuts
  → upload file to Supabase Storage (per kitchen)
  → save URL on preset: { id, description, categoryId, location, photoUrl }
  → settings JSON stays small; Add by Photo loads images from CDN URLs
```

## Implementation phases

### Phase A — Supabase Storage setup

1. Create bucket `product-photos` (private, not public-by-default).
2. Path convention: `{kitchen_key}/{preset_id}.jpg`
3. RLS / policies: access only via service role from Netlify functions (matches current `sync-kitchen` pattern — no service role in the app).
4. Optional: max object size ~500 KB at bucket level.

### Phase B — Netlify functions

Add endpoints (or extend `sync-kitchen`):

| Action | Method | Purpose |
|--------|--------|---------|
| Upload photo | `POST /.netlify/functions/upload-preset-photo` | multipart or base64 body → Storage → return signed or public URL |
| Delete photo | `DELETE` or POST with `action: delete` | remove object when shortcut deleted or photo replaced |

Reuse `kitchen_key` + validation from existing `kitchen.mjs`.

### Phase C — App changes (`app.js`)

1. **Schema:** `preset.photo` → `preset.photoUrl` (keep `photo` temporarily for migration).
2. **Settings UI:** after compress locally, upload file; store returned URL on preset.
3. **Add by Photo:** `<img src="${preset.photoUrl}">` (with lazy loading).
4. **Delete/replace:** call delete endpoint when removing photo or shortcut.
5. **Loading states:** spinner/placeholder on tiles while images fetch.
6. **Offline:** optional — cache URLs in `localStorage` / service worker later.

### Phase D — Migration

1. On app load (once per kitchen): for each preset with legacy `photo` data URL:
   - upload to Storage
   - set `photoUrl`
   - delete `photo` from preset
   - save settings
2. Track `_schemaVersions.presetPhotos = "storage-v1"` to avoid re-migration.
3. Cap migration batch size per session (e.g. 5 uploads) so first load after deploy doesn’t freeze iPad.

### Phase E — Backup / export

- JSON export: include `photoUrl` only (not binary).
- Document that restoring backup requires URLs still valid in Storage, OR re-upload photos after import.

## What improves

| | Embedded (now) | Separate files |
|--|----------------|----------------|
| Settings payload | Large | Small |
| Photo count comfort zone | ~20–50 | 500+ |
| Per-photo quality | ~180 KB cap | Configurable (e.g. 500 KB) |
| Initial app load | Heavier | Lighter |
| Complexity | Low | Medium |

## Risks / trade-offs

- Requires network to upload and first-view photos.
- Orphan files if delete endpoint fails — occasional cleanup job optional.
- Slightly more Netlify function surface area.
- Export/import story needs clear UX.

## Rough effort

| Phase | Estimate |
|-------|----------|
| A Supabase bucket + policies | 1–2 hours |
| B Netlify upload/delete | 2–3 hours |
| C App UI + Add by Photo | 2–3 hours |
| D Migration | 1–2 hours |
| E Backup notes + testing on iPad | 1 hour |

**Total:** ~1–2 days focused work.

## When to do it

Consider starting when:

- Photo shortcut count is **~40+**, or
- Saves/sync feel slow, or
- User wants higher-quality photos, or
- User explicitly asks to implement this plan.

## Reminder for future sessions

User requested: **plan now, implement later** — remind them this plan exists when discussing photo limits, Add by Photo, or Supabase performance.

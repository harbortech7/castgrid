markdown
# 📺 CastGrid Project Plan

Digital signage and menu display system for Android TV and Fire TV Stick, powered by Netlify (Functions + Identity) and GitHub.

---

## 🧩 Overview

**CastGrid** is a grid-based signage app that:
- Runs on Android TV and Fire TV Stick
- Displays media from a web-based backend
- Supports up to 8 grid zones per screen
- Automatically plays videos and image slideshows based on alphabetical order
- Supports multi-tenant management (separate clients) with per-tenant logins

---

## 🛠️ Tech Stack

| Layer        | Technology                          | Notes |
|--------------|--------------------------------------|-------|
| Backend API  | Netlify Functions (Node.js)          | REST endpoints served from `/api/*` |
| Auth         | Netlify Identity                     | Email login, roles, per-tenant access control |
| Data store   | GitHub repo (JSON files per tenant)  | Versioned config: devices, grids, media boxes, media items |
| Media store  | Netlify Large Media or Netlify Blobs | Media files or external CDN (Cloudinary/S3) |
| Frontend     | HTML/CSS/JS                          | Admin dashboard (hosted on Netlify) |
| Hosting      | Netlify                              | Global CDN, HTTPS |

---

## 🗂️ Multi-tenant Layout (GitHub)

Repository structure for tenant separation:

```
data/
  tenants/
    {tenantSlug}/
      devices.json          # [{ deviceId, location, grids: [gridId...] }]
      grids.json            # [{ gridId, deviceId, position, mediaBoxId }]
      media-boxes.json      # [{ mediaBoxId, name, mediaItems: [mediaId...] }]
      media-items.json      # [{ mediaId, type, filename, url, duration }]
```

Access rules:
- Users authenticate via Netlify Identity
- Each user is assigned a `tenantSlug` in app metadata (or role naming convention like `tenant:acme`)
- All admin actions are scoped to `data/tenants/{tenantSlug}/...`

---

## 📦 Data Schema

### 🔹 Device
```json
{
  "deviceId": "tv_001",
  "location": "Lobby",
  "grids": ["grid_1", "grid_2"]
}
```

### 🔹 Grid
```json
{
  "gridId": "grid_1",
  "deviceId": "tv_001",
  "position": 1,
  "mediaBoxId": "mb_001"
}
```

### 🔹 MediaBox
```json
{
  "mediaBoxId": "mb_001",
  "name": "Breakfast Menu",
  "mediaItems": ["media_001", "media_002"]
}
```

### 🔹 MediaItem
```json
{
  "mediaId": "media_001",
  "type": "video", // "image"
  "filename": "A_breakfast.mp4",
  "url": "https://media.cdn/tenant/acme/A_breakfast.mp4",
  "duration": 30
}
```

---

## 🌐 API Endpoints (Netlify Functions)

All endpoints are under `/api`.

Admin (authenticated via Netlify Identity; scoped to requester tenant):
- `GET   /api/tenants/me` → tenant info for current user
- `GET   /api/devices` → list devices
- `POST  /api/devices` → create/update device
- `DELETE /api/devices/:deviceId` → delete device
- `GET   /api/grids?deviceId=tv_001` → list grids for a device
- `PUT   /api/grids/:gridId` → assign media box to grid
- `GET   /api/media-items` → list media items
- `POST  /api/media-items` → create/update media metadata
- `DELETE /api/media-items/:mediaId` → delete media metadata
- `GET   /api/media-boxes` → list media boxes
- `POST  /api/media-boxes` → create/update media box
- `DELETE /api/media-boxes/:mediaBoxId` → delete media box

Public (no auth; for Android app playback):
- `GET /api/public/layout/:tenant/:deviceId` → resolved layout for a device:
  ```json
  {
    "device": { /* device */ },
    "grids": [ /* grids with resolved media boxes */ ],
    "mediaBoxes": [ /* used boxes */ ],
    "mediaItems": [ /* used items with URLs */ ]
  }
  ```

---

## 🧠 Playback Logic (Android App)

1) App calls `GET /api/public/layout/{tenantSlug}/{DEVICE_ID}` on startup and periodically
2) Sorts each media box’s items alphabetically by `filename`
3) Videos play for full duration; images show for `duration` seconds
4) Loops indefinitely per grid zone

---

## 🚀 Next Steps

- [ ] Enable Netlify Identity on the site and configure email sign-in
- [ ] Create Netlify Functions:
  - [ ] `tenants/me`
  - [ ] `devices` (GET/POST/DELETE)
  - [ ] `grids` (GET/PUT)
  - [ ] `media-items` (GET/POST/DELETE)
  - [ ] `media-boxes` (GET/POST/DELETE)
  - [ ] `public/layout/:tenant/:deviceId`
- [ ] Define per-tenant storage in GitHub (`data/tenants/{tenant}` JSON files)
- [ ] Update web admin to call the new `/api/*` endpoints
- [ ] Decide media storage: Netlify Large Media/Blobs or external CDN, store URLs in `media-items.json`
- [ ] Ship Android app consuming the public layout endpoint

---

## 📌 Notes

- Multi-tenant isolation is enforced by Netlify Functions using Identity JWT claims
- GitHub commits serve as an audit log and backup for configuration
- Consider adding scheduling (time-based playlists) in a future phase
- Offline caching on Android recommended for unstable networks
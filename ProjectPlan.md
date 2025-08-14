markdown
# 📺 CastGrid Project Plan

Digital signage and menu display system for Android TV and Fire TV Stick, powered by Firebase and Node.js.

---

## 🧩 Overview

**CastGrid** is a grid-based signage app that:
- Runs on Android TV and Fire TV Stick
- Displays media from a web-based backend
- Supports up to 8 grid zones per screen
- Automatically plays videos and image slideshows based on alphabetical order

---

## 🛠️ Tech Stack

| Layer       | Technology         | Notes |
|-------------|--------------------|-------|
| Backend     | Node.js + Express  | REST API for device/grid/media management |
| Database    | Firebase Firestore | Real-time sync, scalable |
| Storage     | Firebase Storage   | Secure media hosting |
| Frontend    | HTML/CSS/JS        | Admin dashboard (optional: React) |
| Hosting     | Firebase Hosting   | Free tier for dashboard and API |

---

## 📦 Data Schema

### 🔹 Device
```json
{
  "deviceId": "tv_001",
  "location": "Lobby",
  "grids": ["grid_1", "grid_2"]
}
🔹 Grid
json
{
  "gridId": "grid_1",
  "deviceId": "tv_001",
  "position": 1,
  "mediaBoxId": "mb_001"
}
🔹 MediaBox
json
{
  "mediaBoxId": "mb_001",
  "name": "Breakfast Menu",
  "mediaItems": ["media_001", "media_002"]
}
🔹 MediaItem
json
{
  "mediaId": "media_001",
  "type": "video",
  "filename": "A_breakfast.mp4",
  "url": "https://yourcdn.com/media/A_breakfast.mp4",
  "duration": 30
}
🌐 API Endpoints
Method	Endpoint	Description
GET	/devices	List all devices
GET	/devices/:id	Get device details
GET	/grids/:deviceId	Get grid layout
GET	/media-boxes/:id	Get media box contents
POST	/media-boxes/:id/media	Upload media
DELETE	/media/:mediaId	Remove media item
PUT	/grids/:gridId	Assign media box to grid
🧠 Playback Logic
App fetches grid layout → gets media box → loads media items

Sort media items alphabetically by filename

Videos play first if they come before images

Image slideshows auto-play with default or custom durations

🚀 Next Steps
[ ] Set up Firebase project (Firestore + Storage)

[ ] Build Express backend with REST API

[ ] Create admin dashboard (optional)

[ ] Develop Android TV app with grid renderer

[ ] Test media sync and playback logic

[ ] Deploy and monitor performance

📌 Notes
Consider adding scheduling logic for time-based media rotation

Offline caching recommended for unstable networks

Firebase free tier is sufficient for MVP
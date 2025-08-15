# CastGrid - Digital Signage (Android TV + Web Admin)

A simple, production-ready signage system. Web Admin is static (Netlify). Data is stored as JSON in your GitHub repo via Netlify Functions. Authentication is optional. The simplest path uses a single Admin Access Code.

## Quick Start (no Identity)

1) Fork this repo to your GitHub account.
2) Create a new site on Netlify and connect your fork.
3) In Netlify → Site settings → Environment variables, add:
   - `GITHUB_REPO` = `harbortech7/castgrid` (or your fork `yourname/castgrid`)
   - `GITHUB_BRANCH` = `main`
   - `GITHUB_TOKEN` = GitHub Personal Access Token with `repo` scope
   - `ADMIN_TOKEN` = any strong secret string (you choose)
4) In your GitHub repo, create tenant data files (example tenant `acme`):
   - `data/tenants/acme/devices.json` → `[]`
   - `data/tenants/acme/grids.json` → `[]`
   - `data/tenants/acme/media-boxes.json` → `[]`
   - `data/tenants/acme/media-items.json` → `[]`
5) Open your Netlify site URL. In the Admin Access area:
   - Admin Access Code = the value of `ADMIN_TOKEN`
   - Tenant = `acme` (or your tenant)
   - Click "Use Access Code" → Click "Test API Connection"

You can now create devices, media boxes, and grids from the dashboard.

## Why this is easy

- No database to run. JSON files live in GitHub.
- No complex auth required. Use one Admin Access Code.
- Public Android endpoint is simple and cache-friendly.

## Netlify Identity (optional)

You do NOT need Identity for this setup. If you later want multi-user logins:
- Enable Identity from Netlify site settings.
- Assign users a role like `tenant:acme`.
- The system will auto-detect Identity users instead of Admin Access Code.

## Environment variables (details)

- `GITHUB_REPO`: `owner/repo` (example: `harbortech7/castgrid`)
- `GITHUB_BRANCH`: branch to write to (default `main`)
- `GITHUB_TOKEN`: GitHub PAT with `repo` scope (can be classic token)
- `ADMIN_TOKEN`: secret you will type into the dashboard (header `X-Admin-Token`)

## API endpoints (Netlify Functions)

Base path: `/.netlify/functions`

- `GET  /devices` → list devices
- `POST /devices` → upsert a device
- `DELETE /devices?deviceId=...` → delete
- `GET  /grids?deviceId=...` → list grids (optionally by device)
- `PUT  /grids?gridId=...` → update a grid
- `GET  /media-boxes` / `POST` / `DELETE?mediaBoxId=...`
- `GET  /media-items` / `POST` / `DELETE?mediaId=...`
- Public layout for TVs (no auth): `/public-layout/:tenant/:deviceId`

Headers for Admin Access Code:
- `X-Admin-Token: <ADMIN_TOKEN>`
- `X-Tenant: <tenant>` (example: `acme`)

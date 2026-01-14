# Project: Better World Browser

## Overview
An Electron-based browser application that wraps social media platforms (Facebook, etc.) with injected "Report Brain Rot" buttons, enabling users to identify and report harmful content with minimal friction. Think "Waze for Social Media" - crowdsourced hazard reporting that trains ML models to detect and warn about brain rot content.

## Goals
- **Primary:** Enable frictionless reporting of brain rot content directly from social media feeds
- **Secondary:** Persist user sessions so they don't have to re-login every time
- **Future:** Real-time ML-based warnings about suspected brain rot content
- **Success criteria:** Mac DMG installs and works, users can login, see brainrot buttons on Facebook posts, click to capture and submit

## Tech Stack
- **Framework:** Electron 28.x
- **UI:** HTML/CSS/JS, BrowserView for social media
- **Session Storage:** electron-store (encrypted)
- **Backend:** brainrot.bluechiplabs.ai (PHP API)
- **Packaging:** electron-builder

## Architecture

### Main Process (main.js)
- Creates main window with toolbar
- Creates BrowserView for Facebook content
- Manages session persistence (both brainrot and Facebook)
- Handles IPC for login, capture, logout
- Injects brainrot buttons via executeJavaScript()

### Renderer Process (src/)
- index.html - Main UI with toolbar and login form
- renderer.js - UI logic, form handlers
- styles.css - Styling

### Preload Scripts
- preload.js - Main window bridge (exposes brainrot API)
- fb-injector.js - Facebook view bridge (forwards captures)

### Data Flow
```
User clicks [BRAINROT] button on Facebook post
    ↓
Injected JS captures post HTML/text
    ↓
postMessage to parent window
    ↓
IPC to main process
    ↓
HTTP POST to brainrot.bluechiplabs.ai/api/capture.php
    ↓
Stored in database as submission
```

## Key Decisions & Rationale

| Decision | Why | Date |
|----------|-----|------|
| Electron over browser extension | Full control, session persistence, no extension store review | 2026-01-13 |
| BrowserView over webview tag | Better isolation, official API | 2026-01-13 |
| electron-store for sessions | Simple encrypted storage | 2026-01-13 |
| Simple token auth | Demo-ready, JWT can be added later | 2026-01-13 |

## Known Gotchas

### Facebook DOM Changes
Facebook frequently changes their DOM structure. The injection script uses multiple selectors:
- `[data-pagelet*="FeedUnit"]`
- `[role="article"]`
- `div[data-ad-comet-preview]`

May need updates as Facebook changes their markup.

### Session Persistence
- Facebook cookies are stored encrypted
- Restoring cookies on startup enables auto-login
- If Facebook changes session handling, may need adjustment

## External Dependencies
- **Backend:** https://brainrot.bluechiplabs.ai/api/
  - `/api/auth.php` - Login
  - `/api/capture.php` - Submit captures

## Current Status

### What's Working
- Basic Electron shell with toolbar
- Login form UI
- API endpoints on brainrot server
- Button injection script for Facebook

### What's In Progress
- Session persistence testing
- Mac packaging

### What's Planned
- Drawing/annotation tools
- Screenshot capture
- Windows/Linux builds
- Real-time ML warnings

---
*Created: 2026-01-13*

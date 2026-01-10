# Stay Close App - Session Handoff

**Last Updated:** 2026-01-11 (Session 3)
**App Version:** 2.2.0
**Branch:** main

---

## Bug Fixes This Session

### Fixed: Registration "Password too long" Error
**Problem:** Users couldn't register - error "password cannot be longer than 72 bytes" even for short passwords.

**Root Cause:** Version incompatibility between `passlib 1.7.4` and `bcrypt 4.1+`. The new bcrypt removed `__about__` attribute that passlib expects.

**Solution:** Pinned `bcrypt==4.0.1` in `backend/requirements.txt`

**Commits:**
- `ff51276` - Fix: Pin bcrypt==4.0.1 for passlib compatibility
- `c0eb444` - Fix: Password 72-byte bcrypt limit + Release signing setup

---

## Play Store Release Progress

### Completed
- [x] Generated release keystore (`android/app/stay-close-release.keystore`)
- [x] Configured signing in `build.gradle`
- [x] Built release AAB (`android/app/build/outputs/bundle/release/app-release.aab` - 7.3MB)
- [x] Created `PLAY_STORE_LISTING.md` with copy-paste ready content
- [x] Added keystore to `.gitignore`
- [x] Fixed registration bug (bcrypt/passlib compatibility)

### Keystore Credentials (SAVE THESE!)
```
File: android/app/stay-close-release.keystore
Password: stayclose2024
Alias: stay-close
Key Password: stayclose2024
```

### Pending (After Bug Fixes)
- [ ] **REBUILD AAB** (run `npm run build:android && cd android && ./gradlew bundleRelease`)
- [ ] Take screenshots (minimum 2)
- [ ] Create test account for Google reviewers
- [ ] Upload to Play Console
- [ ] Fill Data Safety form
- [ ] Submit for Internal Testing

### Files Created This Session
- `android/app/stay-close-release.keystore` - Release signing key
- `android/keystore.properties` - Keystore config (gitignored)
- `PLAY_STORE_LISTING.md` - Copy-paste ready store listing

---

## Current App Status

### Working Features
- **Authentication** - JWT + Firebase (Google Sign-In)
- **Message Generation** - AI-powered personalized messages (Groq)
- **Contact Management** - Encrypted storage (AES-256)
- **Reminder System** - 4 types (one_time, daily, weekly, recurring) via Android local notifications
- **Banner Ads** - Bottom of Messages & Contacts pages (FREE/TRIAL users)
- **Interstitial Ads** - Every 3rd message (FREE users only)
- **Rewarded Video Ads** - +25 messages bonus when daily limit hit
- **Admin Panel** - Live toggles for ads and donations
- **i18n** - Hebrew + English support
- **Professional App Icons** - Ready for Play Store

### Backend Settings (PostgreSQL)
- `ads_enabled` = `'true'`
- `donation_enabled` = `'false'`

### Ad Unit IDs (Production)
- Banner: `ca-app-pub-1245288761068546/5996451103`
- Interstitial: `ca-app-pub-1245288761068546/4215501546`
- Rewarded: `ca-app-pub-1245288761068546/6806345170`

---

## Open Tasks (Priority Order)

### Priority 1: Play Store Release (Critical)

| Task | Status | Notes |
|------|--------|-------|
| Generate release keystore | Not Started | **CRITICAL** - Cannot update app without this! |
| Configure signing in `build.gradle` | Not Started | Add signingConfigs for release |
| Build release AAB | Not Started | `./gradlew bundleRelease` |
| Create Google Play Console account | Not Started | $25 USD one-time |
| Upload to Internal Testing | Not Started | Invite 20-50 testers |

**Keystore Command:**
```bash
cd android/app
keytool -genkey -v -keystore stay-close-release.keystore \
  -alias stay-close -keyalg RSA -keysize 2048 -validity 10000
```

### Priority 2: AdMob Setup

| Task | Status | Notes |
|------|--------|-------|
| Test ads on real Android device | Not Started | Verify all 3 ad types work |
| Setup `app-ads.txt` | Not Started | Required for AdMob ownership verification |

### Priority 3: Payment System (Allpay)

| Task | Status | Notes |
|------|--------|-------|
| Add env vars to Railway | Not Started | `ALLPAY_LOGIN`, `ALLPAY_API_KEY` |
| Configure products in Allpay dashboard | Not Started | |
| Configure webhooks | Not Started | |
| Test end-to-end payment flow | Not Started | |

### Priority 4: Viral Growth Features

| Task | Status | Notes |
|------|--------|-------|
| Share app button | Not Started | Add to message result screen |
| Referral system | Not Started | Invite friend = bonus messages |
| Gamification (streaks, achievements) | Not Started | Lower priority |

---

## Key Files Reference

### Ads & Monetization
- `services/admob.ts` - Interstitial & rewarded video logic
- `components/AdBanner.tsx` - Banner ad component
- `app/paywall/page.tsx` - Subscription/upgrade page
- `backend/allpay_service.py` - Payment gateway

### Core App
- `app/messages/page.tsx` - Main message generation
- `app/contacts/page.tsx` - Contact management
- `services/api.ts` - API client (JWT + Firebase auth)
- `backend/main.py` - FastAPI endpoints

### Config & Assets
- `android/app/build.gradle` - Android build config
- `store-assets/` - Play Store assets (icon + feature graphic)
- `i18n/he.json` & `i18n/en.json` - Translations

---

## Quick Commands

### Development
```bash
npm run dev              # Web dev server (localhost:3000)
cd backend && python main.py  # Backend (localhost:8000)
```

### Android Build
```bash
npm run build:android    # Build + sync to Android
npm run cap:open:android # Open Android Studio
```

### Release Build
```bash
cd android
./gradlew bundleRelease  # Creates AAB in app/build/outputs/bundle/release/
```

### Debugging
```
1. Connect Android device (USB debugging enabled)
2. Open Chrome: chrome://inspect/#devices
3. Find "Stay Close" -> Click "inspect"
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
SECRET_KEY=...
GROQ_API_KEY=...
FIREBASE_*=...
ALLPAY_*=...
ENCRYPTION_KEY=...
```

---

## Recent Commits
```
440671f Optimize: Reduce ad delays + integrate new professional app icons
449b410 Feature: Donation system + Premium upgrade UI + UX improvements
f9621bc CRITICAL FIX: Enable ads by default + add comprehensive logging
a162164 Docs: Add comprehensive documentation of current ads implementation
21e401a Docs: Add comprehensive Google Play Store upload and viral growth strategy guide
```

---

## Architecture Summary

```
Frontend (Next.js 14 + React + TypeScript)
    |
    v
Backend (FastAPI + Python 3.11)
    |
    v
Database (PostgreSQL on Railway)

Mobile: Capacitor 6 for Android
Auth: Firebase Authentication
AI: Groq API
Ads: Google AdMob
Notifications: Android Local Notifications (no FCM)
```

---

## Notes for Next Session

- **Keystore generation is the #1 blocker** for Play Store release
- All icons and store assets are ready in `store-assets/`
- Ad delays already optimized (reduced ~50%)
- FCM/push notifications removed - using local Android notifications only
- See `GOOGLE_PLAY_STORE_AND_VIRAL_STRATEGY.md` for detailed upload guide

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stay Close is a Hebrew-language proximity/relationship management application. It's a full-stack app with:
- **Frontend**: Next.js 14 (App Router) + React + TypeScript with RTL support
- **Backend**: FastAPI (Python 3.11+) with PostgreSQL
- **Mobile**: Capacitor 6 for Android with native features (Firebase Auth, AdMob, Push Notifications)

## Development Commands

### Frontend
```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build for web
npm test             # Run Jest tests
npm run lint         # Run ESLint
```

### Backend
```bash
cd backend
python3 main.py      # Start FastAPI server (localhost:8000)
pytest               # Run backend tests
```

### Android/Mobile
```bash
npm run build:capacitor    # Build for Capacitor (static export)
npm run build:android      # Build and sync to Android
npm run android            # Build, sync, and open Android Studio
npm run cap:sync           # Sync web build to native platforms
npm run cap:open:android   # Open Android Studio
```

**Note**: The build system uses `CAPACITOR_BUILD=true` environment variable to switch between web mode (default) and static export mode (for Capacitor).

## Architecture

### Frontend Structure

```
app/                    # Next.js App Router pages
  ├── login/           # Authentication pages
  ├── messages/        # Main message generation UI
  ├── contacts/        # Contact management
  ├── settings/        # User settings
  ├── admin/           # Admin dashboard
  └── paywall/         # Subscription/payment flow

components/            # Shared React components
  ├── AuthGuard.tsx   # Authentication routing guard
  ├── Header.tsx      # App header with navigation
  └── ...

services/              # API and platform services
  ├── api.ts                      # Core API client (JWT + Firebase auth)
  ├── auth.ts                     # Authentication logic
  ├── contacts.ts                 # Contact CRUD operations
  ├── messages.ts                 # Message generation
  ├── reminders.ts                # Reminder management
  ├── notifications.ts            # Browser notifications
  ├── capacitorNotifications.ts   # Native push notifications
  └── localNotifications.ts       # Capacitor local notifications

state/                 # State management hooks
  └── useSettings.ts  # Settings with localStorage persistence

i18n/                  # Internationalization
  └── he.json         # Hebrew translations
```

### Backend Structure

```
backend/
  ├── main.py                    # FastAPI app entry point
  ├── database.py               # SQLAlchemy setup
  ├── models.py                 # SQLAlchemy models (User, Contact, Reminder, etc.)
  ├── auth.py                   # JWT + Firebase authentication
  ├── encryption.py             # AES encryption for PII
  ├── push_notifications.py     # Push notification service
  ├── subscription_service.py   # Subscription management
  ├── usage_limiter.py          # Usage limit enforcement
  ├── allpay_service.py         # Payment gateway integration
  └── requirements.txt          # Python dependencies
```

### Key Architectural Patterns

#### 1. Authentication Flow
- **Dual authentication**: JWT tokens (for regular login) and Firebase tokens (for Google/OAuth)
- **Token priority**: API service tries JWT (`auth_token`) first, falls back to Firebase token
- **AuthGuard component**: Protects routes, redirects unauthenticated users to `/login`
- **Automatic logout**: 401 responses clear tokens and redirect to login

#### 2. Data Encryption
- **PII encryption**: Usernames, emails, and contact names are encrypted at rest
- **Dual storage**: Hash for lookups (SHA256), encrypted for display (AES)
- Backend models: `username_hash` + `username_encrypted`, `email_hash` + `email_encrypted`

#### 3. API Service Layer
- Centralized in `services/api.ts`
- Automatic token injection into headers
- Automatic 401 handling and redirect
- All API calls use `fetchApi()` wrapper for consistency

#### 4. Reminder System (Android Local Notifications)
- **Offline-first**: Notifications scheduled locally on Android device via Capacitor LocalNotifications
- **No backend push**: FCM/Firebase Cloud Messaging has been completely removed
- Supports 4 reminder types:
  - `one_time`: Single scheduled notification
  - `recurring`: Interval-based (hours/days)
  - `daily`: Daily at specific time (uses native `every: 'day'`)
  - `weekly`: Specific weekdays at specific time (workaround: schedules 52 individual notifications)
- **Capacitor Workarounds**:
  - Weekly reminders: Schedules up to 365 days of individual notifications (one per week)
  - Custom intervals (e.g., "every 3 days"): Schedules 52 individual occurrences
  - Limitation: Maximum 64 notifications per app (Capacitor limit)
- **Sync on app load**: `ReminderChecker` component re-syncs all reminders from backend to device
- **Timezone-aware**: Uses reminder.timezone for correct scheduling
- **Implementation**: See `services/localNotifications.ts` for detailed workaround logic

#### 5. Dual Build Mode (Web + Mobile)
- **Web mode** (default): Standard Next.js with server-side features
- **Capacitor mode** (`CAPACITOR_BUILD=true`): Static export to `out/` directory
- Key difference: `output: 'export'` in `next.config.js` when building for mobile
- Mobile build triggered by `npm run build:capacitor` or `npm run build:android`

#### 6. i18n System
- Custom translation system (not react-i18next in some components)
- `i18n/he.json` contains all Hebrew strings
- `useTranslation()` hook for accessing translations
- Settings stored in localStorage with `app_language` key

#### 7. Trial and Subscription Model
- Users start with a trial period
- Usage limits enforced by `usage_limiter.py`
- Payment via AllPay integration
- Subscription status stored in `User.subscription_status` (trial/free/premium)

## Development Guidelines

### General Principles
- **Prioritize technical correctness and architectural integrity**: Avoid "quick fixes" or hacks that bypass established system flows
- **Maintain separation of concerns**: Keep API logic in services, UI logic in components, business logic in backend
- **Follow existing patterns**: New features should match the established architecture (service layer, encryption, etc.)

### Frontend Guidelines
- **RTL support**: All UI must support right-to-left layout for Hebrew
- **Use service layer**: Never call `fetch()` directly; use functions from `services/`
- **Authentication**: Protect new routes by wrapping them in `<AuthGuard>` or adding to `publicPaths` array
- **Styling**: Use CSS Modules (`.module.css` files) for component-specific styles
- **TypeScript**: Use path aliases (`@/components`, `@/services`, `@/state`) defined in `tsconfig.json`

### Backend Guidelines
- **Python version**: Requires Python 3.7+ (3.11+ recommended)
- **Database**: Use SQLAlchemy ORM; avoid raw SQL
- **Encryption**: Always encrypt PII (use `encrypt()` and `decrypt()` from `encryption.py`)
- **Authentication**: Use `get_current_user()` dependency for protected endpoints
- **CORS**: Already configured in `main.py` for development
- **Background jobs**: REMOVED - No background jobs for notifications (Android local notifications handle scheduling)

### Mobile/Capacitor Guidelines
- **Build for mobile**: Always use `npm run build:android` (not `npm run build`) before testing on Android
- **Capacitor sync**: Run `npm run cap:sync` after changing web assets
- **Native features**: Use Capacitor plugins for local notifications and AdMob
- **Notifications**: ONLY local notifications via Capacitor LocalNotifications (FCM removed)
- **Firebase**: Firebase Authentication ONLY (configured in `capacitor.config.ts`) - messaging removed
- **Testing**: Test on actual device or emulator (Capacitor features don't work in browser)
- **Notification limit**: Max 64 notifications can be scheduled at once (Capacitor limitation)

### Testing
- **Frontend tests**: Jest + React Testing Library
- **Backend tests**: pytest
- **Run tests before commits**: Ensure `npm test` and `pytest` pass

## Environment Variables

Create `.env.local` in root for frontend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `.env` in `backend/` directory (see existing `.env` file for required keys):
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `GROQ_API_KEY`: AI message generation
- `FIREBASE_*`: Firebase credentials
- `ALLPAY_*`: Payment gateway credentials
- `ENCRYPTION_KEY`: AES encryption key

## Common Pitfalls

1. **Forgetting to encrypt PII**: Always encrypt usernames, emails, and contact names before storing
2. **Breaking RTL layout**: Test Hebrew text rendering after UI changes
3. **Wrong build for mobile**: Using `npm run build` instead of `npm run build:android`
4. **Ignoring token priority**: JWT tokens should be preferred over Firebase tokens
5. **Timezone issues**: Always use timezone-aware datetimes for reminders
6. **64-notification limit**: Capacitor limits to 64 scheduled notifications; weekly/custom reminders count multiple times
7. **Re-sync required**: Weekly reminders need re-syncing after ~1 year (notifications expire)
8. **Android-only notifications**: Reminders only work on Android app, not on web browser

## Database Schema Notes

Key models in `backend/models.py`:
- **User**: Encrypted username/email, subscription status (NOTE: `notification_platform` field removed)
- **Contact**: Encrypted name, belongs to user, has default tone for messages
- **Reminder**: Complex reminder system with multiple types (one_time, recurring, daily, weekly)
- **Subscription**: Payment records linked to users
- **UsageStats**: Daily/monthly usage tracking for limits
- **PushToken**: REMOVED - No longer needed (FCM notifications removed)

All models use soft deletes and cascade on user deletion.

**Recent Changes (2026-01):**
- Removed FCM/push notification infrastructure entirely
- Removed `PushToken` model and `User.notification_platform` field
- Notifications now handled entirely by Android local scheduling

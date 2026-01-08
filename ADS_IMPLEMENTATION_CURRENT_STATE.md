# Ads Implementation - Current State (v2.2.0)

**Last Updated**: 2026-01-08
**App Version**: 2.2.0
**AdMob Status**: ✅ Production Mode (Real Ad Units)

---

## 📱 Ad Types & Locations

### 1. **Banner Ads** (Bottom of Screen)

**Type**: AdMob Adaptive Banner
**Ad Unit ID**: `ca-app-pub-1245288761068546/5996451103`
**Position**: Bottom center of screen
**Size**: Adaptive Banner (auto-adjusts to screen width)

#### Where Shown:
- ✅ **Messages Page** (`/messages`) - Bottom of screen
- ✅ **Contacts Page** (`/contacts`) - Bottom of screen

#### When Shown:
```
User Status: FREE or TRIAL (NOT premium)
Platform: Android only (native AdMob)
Condition: ads_enabled = true (from server settings)
```

#### Visibility Logic:
```typescript
// From components/AdBanner.tsx
const shouldShow = ads_enabled && subscription_status !== 'premium';

// For Android:
if (shouldShow && isAndroid) {
  // Shows AdMob native banner at bottom
  AdMob.showBanner({
    adId: ADMOB_BANNER_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER
  })
}

// For Web:
if (shouldShow && !isAndroid) {
  // Shows placeholder text:
  // "פרסומת - Stay Close - תודה שאתם משתמשים באפליקציה! 💙"
  // + Link: "הסר פרסומות ושדרג לפרימיום"
}
```

#### Implementation Details:
- **File**: `components/AdBanner.tsx`
- **Preloads**: Banner loads automatically when component mounts
- **Placeholder**: 65px height reserved on Android (prevents layout shift)
- **Web Fallback**: Shows styled placeholder on web (not real ad)

---

### 2. **Interstitial Ads** (Full-Screen)

**Type**: AdMob Interstitial (full-screen)
**Ad Unit ID**: `ca-app-pub-1245288761068546/4215501546`
**Display**: Full-screen overlay between content

#### Where Shown:
- ✅ **Messages Page** - During message generation process

#### When Shown:
```
Trigger: When user clicks "Generate AI Message" button
User Status: FREE only (NOT trial or premium)
Platform: Android only
Frequency: Every 3rd message
```

#### Exact Trigger Logic:
```typescript
// From app/messages/page.tsx (lines 183-197)
const dailyUsed = usageStatus?.messages?.daily_used || 0
const shouldShowAd = dailyUsed > 0 && dailyUsed % 3 === 0 // Every 3rd message

if (usageStatus?.subscription_status === 'free' &&
    isAdsSupported() &&
    shouldShowAd) {
  console.log('📺 [Messages] Showing interstitial ad (every 3rd message)')
  setGenerationStage('ad')
  await showInterstitialAd()
}
```

#### User Flow:
```
User clicks "Generate Message"
  ↓
Check: Is user FREE? Is this their 3rd, 6th, 9th message today?
  ↓
YES → Show full-screen interstitial ad
  ↓
User closes ad (or ad finishes)
  ↓
Message generation continues
  ↓
AI generates message and displays result
```

#### Ad States During Generation:
1. **Preparing** (if ad needed): "⏳ מכין הודעה..."
2. **Showing Ad**: "⏳ יוצר הודעה אישית עבורך... 💡 בזמן ההמתנה - פרסומת קצרה"
3. **Generating**: "🤖 ה-AI כותב הודעה מושלמת... עוד רגע!"

#### Optimization:
- **Preloading**: Ad is preloaded when Messages page loads (for free users)
- **Result**: Ad shows INSTANTLY when needed (no loading delay)
- **Auto-reload**: After showing an ad, next ad preloads in background (1 second delay)

**Implementation**:
- **File**: `services/admob.ts` - `showInterstitialAd()` function
- **Trigger**: `app/messages/page.tsx` - `handleGenerate()` function
- **Preload**: Lines 161-168 in messages page

---

### 3. **Rewarded Video Ads** (Earn Bonus Messages)

**Type**: AdMob Rewarded Video (user must watch to completion)
**Ad Unit ID**: `ca-app-pub-1245288761068546/6806345170`
**Display**: Full-screen video with countdown

#### Where Shown:
- ✅ **Messages Page** - Modal popup when daily limit reached

#### When Shown:
```
Trigger: When user hits daily message limit (10 messages/day for free users)
User Status: FREE only
Platform: Android only
User Action: User must click "צפה בסרטון וקבל 25 הודעות" button
```

#### Exact Trigger Logic:
```typescript
// From app/messages/page.tsx (lines 225-246)
// When message generation FAILS due to limit:
if (response.error) {
  const errorObj = JSON.parse(response.error)
  if (errorObj.reason === 'daily_limit_reached' ||
      errorObj.reason === 'monthly_limit_reached') {
    console.log('🎯 [Messages] Daily limit reached - showing rewarded video modal')
    setShowRewardedVideoModal(true) // Shows modal
  }
}
```

#### User Flow:
```
User hits daily limit (10 messages)
  ↓
Error: "הגעת למגבלת ההודעות היומית"
  ↓
Modal appears with 3 options:
  1. 📺 "צפה בסרטון וקבל 25 הודעות"
  2. ⭐ "שדרג לפרימיום (ללא מגבלות)"
  3. 🚫 "סגור"
  ↓
User clicks "צפה בסרטון"
  ↓
Full-screen video ad plays (30 seconds)
  ↓
User watches to completion
  ↓
✅ Reward granted: +25 bonus messages added to daily quota
  ↓
Alert: "✅ קיבלת 25 הודעות נוספות!"
  ↓
User can continue generating messages
```

#### Modal Content:
```
Title: "הגעת למגבלת ההודעות היומית"
Description: "צפה בסרטון קצר (30 שניות) וקבל 25 הודעות נוספות! 🎉"

[If user already earned bonuses today:]
Bonus Counter: "עד כה צברת X הודעות בונוס היום! 🎁"

Buttons:
- [📺 צפה בסרטון וקבל 25 הודעות]
- [⭐ שדרג לפרימיום (ללא מגבלות)]
- [סגור]
```

#### Reward Logic:
```typescript
// From app/messages/page.tsx (lines 302-314)
const result = await showRewardedVideoAd()

if (result.rewarded) {
  // Call backend to add +25 messages
  const response = await postData('/api/usage/rewarded-video', {})

  if (response.success) {
    alert(`✅ ${response.data.message}`) // "קיבלת 25 הודעות נוספות!"

    // Reload usage status to show new quota
    const usageRes = await getData('/api/usage/status')
    setUsageStatus(usageRes.data)
  }
} else {
  alert('⚠️ צפה בסרטון עד הסוף כדי לקבל 25 הודעות נוספות')
}
```

#### Backend Integration:
- **Endpoint**: `POST /api/usage/rewarded-video`
- **Action**: Adds +25 to `rewarded_video_bonus` field in today's usage stats
- **Limit**: No limit on how many videos user can watch per day
- **Expiry**: Bonus resets daily (bonus messages don't carry over to next day)

**Implementation**:
- **File**: `services/admob.ts` - `showRewardedVideoAd()` function
- **Modal**: `app/messages/page.tsx` - Lines 493-521
- **Trigger**: Lines 225-246, 252-266 in messages page

---

## 🎯 Ad Display Rules Summary

| Ad Type | Location | User Status | Frequency | Platform |
|---------|----------|-------------|-----------|----------|
| **Banner** | Messages & Contacts pages | FREE or TRIAL | Always visible | Android only |
| **Interstitial** | During message generation | FREE only | Every 3rd message | Android only |
| **Rewarded Video** | When limit reached | FREE only | On-demand (user choice) | Android only |

---

## 👥 User Type Behavior

### Premium Users
- ❌ No banner ads
- ❌ No interstitial ads
- ❌ No rewarded videos
- ✅ Unlimited messages

### Trial Users
- ✅ Banner ads shown (bottom of screen)
- ❌ No interstitial ads (trial = unlimited messages)
- ❌ No rewarded videos (no limits during trial)

### Free Users
- ✅ Banner ads shown (bottom of screen)
- ✅ Interstitial ads (every 3rd message)
- ✅ Rewarded videos (when hitting 10 messages/day limit)
- 📊 Quota: 10 messages/day + unlimited bonuses from videos (25 per video)

---

## 🔧 Technical Implementation

### Ad Initialization
```typescript
// File: services/admob.ts (lines 25-52)
export async function initializeAdMob(): Promise<boolean> {
  if (isInitialized) return true

  const isNative = Capacitor.getPlatform() === 'android'
  if (!isNative) return false

  await AdMob.initialize({
    testingDevices: ['DE492EA88D9B9D65E5B0D047D4A5500C'],
    initializeForTesting: false // Production mode
  })

  isInitialized = true
  return true
}
```

### Ad Preloading Strategy
```typescript
// Interstitial ads are preloaded in advance:

// 1. When Messages page loads (for free users):
useEffect(() => {
  if (usageStatus?.subscription_status === 'free' && isAdsSupported()) {
    preloadInterstitialAd() // Preload first ad
  }
}, [usageStatus?.subscription_status])

// 2. After showing an ad:
export async function showInterstitialAd() {
  await AdMob.showInterstitial() // Show preloaded ad instantly

  interstitialReady = false

  // Preload next ad in background (1 second delay)
  setTimeout(() => {
    preloadInterstitialAd()
  }, 1000)
}
```

### Banner Ad Lifecycle
```typescript
// File: components/AdBanner.tsx

// Initialize once when component mounts
if (!isAdMobInitialized) {
  await AdMob.initialize()
  isAdMobInitialized = true
}

// Show banner
await AdMob.showBanner({
  adId: ADMOB_BANNER_ID,
  adSize: BannerAdSize.ADAPTIVE_BANNER,
  position: BannerAdPosition.BOTTOM_CENTER,
  margin: 0,
  isTesting: false // Production
})

// Banner stays visible until:
// - User navigates away from page
// - User upgrades to premium
// - Banner is explicitly hidden
```

---

## 📊 Ad Performance Tracking

### Console Logs
All ad events are logged with `[AdMob]` prefix:

```
✅ [AdMob] Initialized successfully
✅ [AdMob] Interstitial ad preloaded and ready
📺 [Messages] Showing interstitial ad (every 3rd message)
✅ [AdMob] Interstitial ad shown
✅ [AdMob] Banner is now visible
✅ [AdMob] User earned reward: {type: "rewarded", amount: 1}
```

### Ad Metrics to Monitor
- **Banner Fill Rate**: How often banner successfully loads
- **Interstitial Show Rate**: Every 3rd message for free users
- **Rewarded Video Completion Rate**: Users who watch full video
- **Daily Video Views per User**: Track engagement with rewarded videos
- **Bonus Message Redemption**: How many 25-message bonuses granted

---

## 🚨 Important Notes

### Production Mode
- ✅ All ads are in **PRODUCTION MODE** (real ads, real revenue)
- ✅ Real Ad Unit IDs configured
- ✅ `isTesting: false` in all ad configurations
- ⚠️ One test device ID whitelisted: `DE492EA88D9B9D65E5B0D047D4A5500C`

### Platform Limitations
- **Android Only**: All ads require native Android app (Capacitor)
- **Web Fallback**: Shows placeholder/design-only banners (no real ads)
- **iOS**: Not implemented (would require iOS-specific AdMob setup)

### Ad Loading Times
- **Banner**: Loads automatically on page mount (~500ms delay)
- **Interstitial**: Preloaded (shows instantly when triggered)
- **Rewarded Video**: Loads when modal opens (may take 2-3 seconds)

### Error Handling
```typescript
// All ad functions handle errors gracefully:
try {
  await showInterstitialAd()
} catch (error) {
  console.error('❌ [AdMob] Interstitial error:', error)
  // App continues normally (ad failure doesn't block functionality)
}
```

---

## 🎮 User Experience Flow

### Scenario 1: Free User Generating 5 Messages
```
Message 1: Generate → [No ad] → Message created ✓
Message 2: Generate → [No ad] → Message created ✓
Message 3: Generate → [Interstitial ad shows] → Ad closes → Message created ✓
Message 4: Generate → [No ad] → Message created ✓
Message 5: Generate → [No ad] → Message created ✓

[Banner ad visible at bottom throughout entire session]
```

### Scenario 2: Free User Hitting Daily Limit
```
Messages 1-10: Generate normally (with interstitial on 3rd, 6th, 9th)
  ↓
Message 11: Attempt to generate
  ↓
❌ Error: "הגעת למגבלת ההודעות היומית"
  ↓
Modal appears with 3 options
  ↓
User watches rewarded video (30 seconds)
  ↓
✅ +25 bonus messages added
  ↓
Messages 11-35: Can continue generating (with interstitials every 3rd)
  ↓
Message 36: Hits limit again
  ↓
User can watch another video for +25 more messages
[Process repeats - unlimited videos allowed]
```

---

## 📝 Files Reference

### Core Ad Service
- **`services/admob.ts`** - All AdMob functionality
  - `initializeAdMob()` - Initialize SDK
  - `preloadInterstitialAd()` - Preload interstitial in background
  - `showInterstitialAd()` - Show full-screen ad
  - `showRewardedVideoAd()` - Show video ad with reward
  - `isAdsSupported()` - Check if platform supports ads

### Ad Components
- **`components/AdBanner.tsx`** - Banner ad component
  - Used in Messages and Contacts pages
  - Auto-initializes and shows native banner on Android
  - Shows placeholder on web

### Ad Integration Points
- **`app/messages/page.tsx`** - Main integration
  - Lines 31: Import ad functions
  - Lines 161-168: Preload interstitial on page load
  - Lines 183-200: Show interstitial every 3rd message
  - Lines 225-266: Show rewarded video modal when limit reached
  - Lines 302-314: Handle rewarded video completion
  - Line 490: Banner ad placement

- **`app/contacts/page.tsx`** - Secondary integration
  - Line 11: Import AdBanner
  - Line 278: Banner ad placement

### Configuration
- **`android/app/src/main/AndroidManifest.xml`** - AdMob App ID
  - Line 38-39: `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-1245288761068546~7169931973"/>`

---

## 🔮 Future Enhancements (Not Implemented)

Ideas for consideration:
- [ ] Track ad impressions/clicks in analytics
- [ ] A/B test different interstitial frequencies (every 3rd vs every 5th)
- [ ] Native ads inline with content
- [ ] Reward users for watching ads even before hitting limit
- [ ] Daily streak bonuses for watching ads
- [ ] Limit number of rewarded videos per day (prevent abuse)

---

**Last Updated**: 2026-01-08
**Maintained By**: Development Team
**Review Frequency**: After each ad-related change

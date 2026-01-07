# AdMob Setup Guide - Stay Close App

## Overview
The Stay Close app now uses a new monetization model with AdMob ads:
- **Free users**: 10 messages/day with interstitial ads during generation
- **Rewarded videos**: Watch a 30-second video to unlock 25 more messages
- **Premium users**: Unlimited messages, no ads

## Step 1: Create Ad Units in AdMob Console

1. **Go to AdMob Console**: https://apps.admob.google.com
2. **Select your app**: "Stay Close" (or create it if you haven't)
3. **Create TWO Ad Units**:

### Ad Unit 1: Interstitial Ad (Message Generation)
- Click "Ad units" → "Add ad unit"
- Choose **"Interstitial"**
- Name: `Message Generation Interstitial`
- Copy the **Ad Unit ID** (format: `ca-app-pub-XXXXX/YYYYY`)

### Ad Unit 2: Rewarded Video Ad (Extra Messages)
- Click "Add ad unit" again
- Choose **"Rewarded"**
- Name: `Extra Messages Reward`
- Copy the **Ad Unit ID** (format: `ca-app-pub-XXXXX/ZZZZZ`)

## Step 2: Update the Code with Real Ad Unit IDs

Open `services/admob.ts` and replace the test IDs:

```typescript
// Ad Unit IDs
export const AD_UNIT_IDS = {
  // Replace these test IDs with your REAL Ad Unit IDs from AdMob
  INTERSTITIAL: 'ca-app-pub-XXXXX/YYYYY', // ← Paste Interstitial Ad Unit ID here
  REWARDED: 'ca-app-pub-XXXXX/ZZZZZ',     // ← Paste Rewarded Ad Unit ID here
}
```

Also set `initializeForTesting` and `isTesting` to `false` for production:

```typescript
// In initializeAdMob():
await AdMob.initialize({
  testingDevices: [myDeviceId],
  initializeForTesting: false // ← Change to false
})

// In showInterstitialAd():
const options: AdOptions = {
  adId: AD_UNIT_IDS.INTERSTITIAL,
  isTesting: false // ← Change to false
}

// In showRewardedVideoAd():
const options: AdOptions = {
  adId: AD_UNIT_IDS.REWARDED,
  isTesting: false // ← Change to false
}
```

## Step 3: Enable Ads in Admin Panel

1. Open the app and go to **Admin Panel** (you must be an admin user)
2. Find the "**Enable Ads (LIVE)**" toggle button
3. Click to enable ads for all users
4. The button will turn blue when ads are enabled

## Step 4: Test the Flow

### Testing Interstitial Ads:
1. Log in as a **free user** (not premium, trial expired)
2. Go to **Messages** page
3. Configure and click "**Generate Message**"
4. You should see:
   - Progress text: "⏳ יוצר הודעה אישית עבורך..."
   - Then: "💡 בזמן ההמתנה - פרסומת קצרה"
   - **Interstitial ad appears**
   - After ad closes, message is generated

### Testing Rewarded Video:
1. Generate **10 messages** as a free user
2. Try to generate an 11th message
3. You should see a **modal popup**:
   - "הגעת למגבלת ההודעות היומית"
   - "צפה בסרטון קצר (30 שניות) וקבל 25 הודעות נוספות!"
4. Click "**צפה בסרטון וקבל 25 הודעות**"
5. **Rewarded video plays** (30 seconds)
6. Watch it until the end
7. You should see: "✅ נוספו 25 הודעות נוספות! 🎉"
8. You can now generate 25 more messages

## How It Works

### Backend
- **Daily limit**: 10 free messages (configurable in `app_settings` table: `free_messages_per_day`)
- **Rewarded bonus**: Each rewarded video adds 25 messages (stored in `usage_stats.rewarded_video_bonus`)
- **API endpoint**: `POST /api/usage/rewarded-video` redeems the bonus after video completion
- **Premium users**: Unlimited messages, no ads

### Frontend
- **AdMob service** (`services/admob.ts`): Handles interstitial and rewarded video ads
- **Message generation flow**:
  1. Check if user is free tier
  2. Show interstitial ad during generation (fills the wait time)
  3. Generate message with AI
  4. If limit reached, show rewarded video modal
- **Progress stages**:
  - `preparing`: "⏳ מכין הודעה..."
  - `ad`: "💡 בזמן ההמתנה - פרסומת קצרה"
  - `generating`: "🤖 ה-AI כותב הודעה מושלמת..."

## Revenue Estimates (Approximate)

Based on average AdMob rates in Israel:

### Per User Economics:
- **Message cost** (AI): $0.001-0.003 per message
- **Interstitial revenue**: ~$0.05-0.15 per view
- **Rewarded video revenue**: ~$0.30-1.50 per view

### Example: User generates 25 messages/day
- Cost: 25 × $0.003 = $0.08
- Interstitial revenue: 25 × $0.08 = $2.00
- **Net profit: $1.92/day per user**

### Example: User watches 1 rewarded video
- Cost: 25 × $0.003 = $0.08
- Rewarded video revenue: ~$0.50
- **Net profit: $0.42 per video**

## Troubleshooting

### Ads not showing?
1. Check AdMob console: Are your ad units approved?
2. Check admin panel: Is "ads_enabled" turned ON?
3. Check user status: Premium users don't see ads
4. Check logs: Look for `[AdMob]` messages in Android logcat

### Rewarded video not giving bonus?
1. User must watch the **entire video** until the end
2. Check backend logs for: "✅ [REWARDED] User X watched rewarded video"
3. Check database: `usage_stats.rewarded_video_bonus` should increase

### Test mode issues?
- Make sure your device ID is in the `testingDevices` list
- For production, set `isTesting: false` in all ad configurations

## Admin Controls

In the admin panel, you can control:
- `ads_enabled`: Master switch for all ads (banner + interstitial + rewarded)
- `donation_enabled`: Show/hide the "Upgrade to Premium" option
- `free_messages_per_day`: Change the daily free message limit (default: 10)

## Next Steps

1. ✅ Create ad units in AdMob console
2. ✅ Update `services/admob.ts` with real Ad Unit IDs
3. ✅ Set `isTesting: false` for production
4. ✅ Enable ads in admin panel
5. ✅ Test the entire flow
6. ✅ Monitor revenue in AdMob console
7. ✅ Adjust limits based on user behavior and revenue

## Files Modified

### Backend:
- `backend/models.py`: Added `rewarded_video_bonus` column
- `backend/database.py`: Migration 16 for new column
- `backend/usage_limiter.py`: New functions for rewarded video bonuses
- `backend/main.py`: New endpoint `/api/usage/rewarded-video`

### Frontend:
- `services/admob.ts`: **NEW** - AdMob integration service
- `app/messages/page.tsx`: Enhanced with ads + rewarded video modal
- `app/messages/page.module.css`: Modal styles

## Support

If you encounter any issues:
1. Check Android logcat: `adb logcat | grep -i admob`
2. Check backend logs on Railway
3. Verify AdMob console shows ad requests
4. Ensure your AdMob account is not suspended or limited

---

**Happy monetizing!** 🎉

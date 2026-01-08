# How to View Android Logs for Stay Close App

**Purpose**: Debug ads and other issues by viewing console logs from the Android app

---

## 📱 Method 1: Chrome DevTools (EASIEST)

### Steps:

1. **Connect your Android device to computer via USB**
   - Enable USB debugging on your Android device:
     - Go to Settings → About Phone
     - Tap "Build Number" 7 times to enable Developer Options
     - Go to Settings → Developer Options
     - Enable "USB Debugging"
   - Accept the "Allow USB Debugging" prompt on your phone

2. **Open Chrome on your computer**
   - Navigate to: `chrome://inspect/#devices`

3. **Find your app**
   - You should see "Stay Close" (com.stayclose.app) listed under "Remote Target"
   - If you don't see it, make sure:
     - USB debugging is enabled
     - App is running on your phone
     - USB cable is properly connected

4. **Click "inspect"**
   - A DevTools window will open
   - Click the "Console" tab
   - You'll see all console.log() output from the app

5. **Look for these logs**:
   ```
   📊 [ADS DEBUG] Usage status details: {...}
   🔵 [AdBanner] Checking ads status...
   📊 [AdBanner DEBUG] Status: {...}
   📺 [REWARDED VIDEO] User clicked watch button
   [AdMob] ...
   ```

---

## 📱 Method 2: Android Studio Logcat

### Steps:

1. **Open Android Studio**
   ```bash
   npm run cap:open:android
   ```

2. **Run the app**
   - Click the green "Run" button
   - Or: Shift+F10

3. **Open Logcat**
   - Bottom panel → "Logcat" tab
   - Or: View → Tool Windows → Logcat

4. **Filter logs**
   - In the search box, enter one of:
     - `Capacitor/Console` (shows all console.log)
     - `chromium` (shows web console)
     - `AdMob` (shows only AdMob logs)
     - `ADS DEBUG` (shows our custom ad debug logs)

5. **Look for our logs**:
   - Filter by "Capacitor" to see JavaScript console.log
   - Filter by "AdMob" to see native ad events

---

## 📱 Method 3: adb logcat (Command Line)

### Steps:

1. **Install Android SDK Platform Tools** (if not already installed)
   - Included with Android Studio

2. **Connect device via USB**
   - Enable USB debugging (see Method 1)

3. **Open terminal/command prompt**

4. **Run adb logcat with filter**:
   ```bash
   # All app logs
   adb logcat | grep -i "stayclose"

   # Only console logs (JavaScript)
   adb logcat | grep -i "Capacitor/Console"

   # Only AdMob logs
   adb logcat | grep -i "AdMob"

   # Only our custom debug logs
   adb logcat | grep -E "ADS DEBUG|REWARDED VIDEO|AdBanner"
   ```

5. **Save logs to file**:
   ```bash
   adb logcat > android_logs.txt
   ```

---

## 🔍 What to Look For

### 1. Ads Status Check
```
📊 [ADS DEBUG] Usage status details: {
  subscription_status: "free",
  ads_enabled: false,  ← THIS SHOULD BE TRUE!
  donation_enabled: false,
  daily_used: 3,
  daily_limit: 10
}
```

**If `ads_enabled: false`** → Ads are disabled in backend settings!

---

### 2. Banner Ad Logs
```
🔵 [AdBanner] Checking ads status...
📊 [AdBanner DEBUG] Status: {
  subscription_status: "free",
  ads_enabled: true,
  donation_enabled: false,
  isAndroid: true,
  shouldShow: true
}
✅ [AdBanner] Should show banner - initializing...
[AdMob] Initializing AdMob with device: ...
✅ [AdMob] Banner is now visible
```

**If you see `❌ [AdBanner] Banner hidden`** → Check the "Reason" object to see why

---

### 3. Interstitial Ad Logs
```
🎯 [Messages] Ad check: {
  dailyUsed: 3,
  modulo: 0,
  shouldShowAd: true,
  isFree: true,
  adsSupported: true
}
📺 [Messages] Showing interstitial ad (every 3rd message)
[AdMob] Preloading interstitial ad...
✅ [AdMob] Interstitial ad preloaded and ready
[AdMob] Showing interstitial ad...
✅ [AdMob] Interstitial ad shown
```

**If you see `✅ [Messages] Skipping ad`** → Check the reason in logs

---

### 4. Rewarded Video Logs
```
📺 [REWARDED VIDEO] User clicked watch button
📺 [REWARDED VIDEO] Calling showRewardedVideoAd()...
[AdMob] Preparing rewarded video ad...
✅ [AdMob] Rewarded video ad prepared
[AdMob] Rewarded video ad shown
✅ [AdMob] User earned reward: {...}
📺 [REWARDED VIDEO] Result: { rewarded: true, amount: 25 }
✅ [REWARDED VIDEO] User watched complete video - calling backend...
📺 [REWARDED VIDEO] Backend response: {...}
```

**If video doesn't show** → Check for AdMob errors in logs

---

## 🐛 Common Issues & What Logs Show

### Issue: No banner ads at bottom

**Expected Logs**:
```
✅ [AdBanner] Should show banner - initializing...
[AdMob] Initializing...
✅ [AdMob] Banner is now visible
```

**If you see instead**:
```
❌ [AdBanner] Banner hidden. Reason: {
  ads_enabled: false,  ← PROBLEM!
  subscription_status: "free",
  isAndroid: true
}
```

**Fix**: Run `python3 backend/enable_ads.py` to enable ads in database

---

### Issue: No interstitial ads every 3rd message

**Expected Logs on 3rd message**:
```
🎯 [Messages] Ad check: { dailyUsed: 3, modulo: 0, shouldShowAd: true, ... }
📺 [Messages] Showing interstitial ad (every 3rd message)
```

**If you see instead**:
```
✅ [Messages] Skipping ad - not 3rd message or premium user
```

**Check**:
- `dailyUsed` value (should be 3, 6, 9...)
- `isFree` value (should be true)
- `adsSupported()` value (should be true)

---

### Issue: Rewarded video doesn't play

**Expected Logs**:
```
📺 [REWARDED VIDEO] User clicked watch button
📺 [REWARDED VIDEO] Calling showRewardedVideoAd()...
[AdMob] Preparing rewarded video ad...
```

**If you see errors**:
```
❌ [AdMob] Rewarded ad failed to load: { errorCode: ..., message: ... }
```

**Possible causes**:
- No internet connection
- AdMob not initialized
- Ad inventory not available (try again later)
- Ad Unit ID incorrect

---

## 📋 Log Checklist for Debugging

When reporting an issue, provide these logs:

- [ ] Full startup logs (from app launch)
- [ ] Usage status logs (`📊 [ADS DEBUG]`)
- [ ] Banner status logs (`📊 [AdBanner DEBUG]`)
- [ ] Interstitial trigger logs (when generating 3rd, 6th message)
- [ ] Rewarded video logs (when clicking watch button)
- [ ] Any error messages (lines with `❌`)

---

## 🔧 Quick Debug Commands

**Copy entire log to clipboard** (Chrome DevTools):
```
Right-click in console → Save as... → Save to file
```

**Filter only errors**:
```
In Chrome DevTools console, click "Errors" filter
```

**Clear old logs**:
```
In Chrome DevTools console, click 🚫 icon (clear console)
Then reproduce the issue for clean logs
```

---

## 📤 Sending Logs

**Best way to share logs with developer**:

1. **Chrome DevTools method**:
   - Right-click in console
   - Select "Save as..."
   - Save as `android-logs-[date].log`
   - Send the file

2. **adb method**:
   ```bash
   adb logcat > android-logs.txt
   # Reproduce issue
   # Ctrl+C to stop
   # Send android-logs.txt file
   ```

3. **Screenshot method** (for quick checks):
   - Take screenshots of relevant log sections
   - Make sure timestamps are visible

---

## 🎯 Key Logs to Watch

### On App Launch:
```
🔵 [MessagesPage] Fetching usage status...
📊 [ADS DEBUG] Usage status details: { ads_enabled: ?, ... }
🔵 [AdBanner] Checking ads status...
📊 [AdBanner DEBUG] Status: { shouldShow: ?, ... }
```

### On 3rd Message Generation:
```
🎯 [Messages] Ad check: { dailyUsed: 3, shouldShowAd: ?, ... }
📺 [Messages] Showing interstitial ad (every 3rd message)
[AdMob] Showing interstitial ad...
```

### On Rewarded Video Click:
```
📺 [REWARDED VIDEO] User clicked watch button
📺 [REWARDED VIDEO] Calling showRewardedVideoAd()...
📺 [REWARDED VIDEO] Result: { rewarded: ?, ... }
```

---

**Last Updated**: 2026-01-08
**App Version**: 2.2.0

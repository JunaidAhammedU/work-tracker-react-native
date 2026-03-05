# Fix: Provisioning profile doesn't support App Group (WorkTrackerWidget / WorkTrackerLiveActivity)

If you see:

```text
Provisioning profile "*[expo] com.worktracker.task.WorkTrackerLiveActivity ..." doesn't support the group.com.worktracker.task App Group.
```

then the **extension’s App ID** in Apple Developer does not have the App Group capability, so the provisioning profile EAS creates for it doesn’t include the group. Do the steps below **once** so the App ID (and future profiles) include the App Group.

---

## Step 1: App Group in Apple Developer

1. Open **[Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list)** and sign in.
2. In the left sidebar, click **App Groups** (under “Identifiers”).
3. If **group.com.worktracker.task** is not in the list:
   - Click **+** to add a new App Group.
   - Description: e.g. `Work Tracker shared`.
   - Identifier: **group.com.worktracker.task**
   - Click **Continue** → **Register**.

---

## Step 2: Enable App Group on each App ID

You must enable **App Groups** and add **group.com.worktracker.task** for **all three** of these App IDs (main app + both extensions).

For **each** of these identifiers, do the same steps:

- **com.worktracker.task** (main app)
- **com.worktracker.task.WorkTrackerWidget**
- **com.worktracker.task.WorkTrackerLiveActivity**

Steps per App ID:

1. In **[Identifiers](https://developer.apple.com/account/resources/identifiers/list)**, open the App ID (e.g. **com.worktracker.task.WorkTrackerLiveActivity**).
2. Enable **App Groups** (checkbox).
3. Click **Configure** next to App Groups.
4. Select **group.com.worktracker.task** (or add it if it’s not in the list).
5. Click **Save**, then **Continue**, then **Save** again.

Repeat for the other two App IDs.

---

## Step 3: Remove extension profiles in EAS and rebuild

EAS will keep using the **old** provisioning profile until you remove it. If the error always shows the **same timestamp** (e.g. `2026-03-04T12:13:32.881Z`), that exact profile is still in use — you must remove it.

### Option A: Remove via Expo dashboard (recommended)

1. Open **https://expo.dev** → sign in → open your account → **work-tracker** (or your project).
2. Go to **Credentials** (or **Project settings** → Credentials).
3. Select **iOS** and the build profile (e.g. **production**).
4. Find the **Provisioning Profile** entry for **com.worktracker.task.WorkTrackerLiveActivity** (and **WorkTrackerWidget** if needed) and **delete / remove** it.
5. If you don’t see separate entries per target, use **Option B** and remove all iOS provisioning profiles for this build profile so the next build recreates them.

### Option B: Remove via CLI

1. Run:
   ```bash
   eas credentials -p ios
   ```
2. Choose the build profile (e.g. **production**).
3. Select **Provisioning Profile** (or **Set up a new credentials** and then manage profiles).
4. Choose **Remove** for the profile(s) for:
   - **com.worktracker.task.WorkTrackerLiveActivity**
   - **com.worktracker.task.WorkTrackerWidget**
5. Exit the flow, then build:
   ```bash
   eas build -p ios --profile production
   ```

### Option C: Remove all iOS credentials for this profile (“nuclear”)

If the same profile timestamp still appears after Options A/B, remove **every** iOS credential for this build profile so the next build creates everything from scratch:

1. **Expo dashboard**: Project → Credentials → iOS → your profile → remove **all** provisioning profiles (and distribution certificate if you want a full reset).
2. Or **CLI**: `eas credentials -p ios` → production → remove each credential until none are left for iOS.
3. Then run:
   ```bash
   eas build -p ios --profile production
   ```
   EAS will create new credentials; with the App IDs fixed in Step 2, the new profiles will include the App Group.

---

## If you still see the same error

- **Same timestamp in the error** → The old profile is still in use. Use Option C (remove all iOS credentials for that profile), then build again.
- Confirm in Apple Developer that **all three** App IDs have **App Groups** enabled and **group.com.worktracker.task** selected.
- After changing capabilities in Apple Developer, wait 2–5 minutes (sometimes up to an hour) before building so Apple’s servers are in sync.

---

## Guaranteed fix: use local credentials

If the remote profile still never gets the App Group, use **local credentials** and supply your own provisioning profiles (created in Apple Developer with the App Group). See **[LOCAL-CREDENTIALS-SETUP.md](./LOCAL-CREDENTIALS-SETUP.md)**. Then run:

```bash
eas build -p ios --profile production-local
```

This always works because you control the profiles.

# Regenerate iOS extension provisioning profiles (App Group fix)

**If the error keeps coming back after deleting the profile and rebuilding**, the extension’s **App ID** in Apple Developer likely doesn’t have the App Group capability. Follow **[APP-GROUP-APPLE-DEVELOPER-SETUP.md](./APP-GROUP-APPLE-DEVELOPER-SETUP.md)** to add it once, then remove the profile and rebuild.

---

If you see:

```text
Provisioning profile "*[expo] com.worktracker.task.WorkTrackerWidget ..." doesn't support the group.com.worktracker.task App Group.
```
or
```text
Provisioning profile "*[expo] com.worktracker.task.WorkTrackerLiveActivity ..." doesn't support the group.com.worktracker.task App Group.
```

that extension’s provisioning profile was created **without** the App Group capability. Regenerate it so EAS creates a new profile that includes the App Group.

## Steps

1. **Regenerate the extension provisioning profiles**
   - Run: `eas credentials -p ios`
   - Choose your build profile (e.g. **production**).
   - Open **Provisioning Profile**.
   - **Remove** the profile(s) for:
     - **com.worktracker.task.WorkTrackerWidget**
     - **com.worktracker.task.WorkTrackerLiveActivity**
     - (Or remove **all** iOS provisioning profiles to regenerate everything.)
   - Quit the credentials flow.

2. **Rebuild**
   - Run: `eas build -p ios --profile production`
   - EAS will create new provisioning profiles for the extensions and sync capabilities from `app.json` (`ios.entitlements` and `extra.eas.build.experimental.ios.appExtensions[].entitlements`), so the new profiles should include the App Group.

3. **If it still fails**
   - In [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list):
     - Ensure an **App Group** exists with identifier: `group.com.worktracker.task`.
     - For **com.worktracker.task**, **com.worktracker.task.WorkTrackerWidget**, and **com.worktracker.task.WorkTrackerLiveActivity**: ensure **App Groups** is enabled and this group is selected.
   - Then run `eas credentials -p ios` again, remove the extension provisioning profile(s), and run `eas build -p ios --profile production` again.

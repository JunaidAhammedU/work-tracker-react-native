# Regenerate iOS extension provisioning profile (App Group fix)

If you see:

```text
Provisioning profile "*[expo] com.worktracker.task.WorkTrackerWidget ..." doesn't support the group.com.worktracker.task App Group.
```

the extension’s provisioning profile was created **without** the App Group capability. Regenerate it so EAS creates a new profile that includes the App Group.

## Steps

1. **Regenerate the extension’s provisioning profile**
   - Run: `eas credentials -p ios`
   - Choose your build profile (e.g. **production**).
   - Open **Provisioning Profile**.
   - Find the profile for **com.worktracker.task.WorkTrackerWidget** and **Remove** it (or remove all iOS provisioning profiles to regenerate everything).
   - Quit the credentials flow.

2. **Rebuild**
   - Run: `eas build -p ios --profile production`
   - EAS will create a new provisioning profile for the extension and will sync capabilities from `app.json` (main app `ios.entitlements` and `extra.eas.build.experimental.ios.appExtensions[].entitlements`), so the new profile should include the App Group.

3. **If it still fails**
   - In [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list):
     - Ensure an **App Group** exists with identifier: `group.com.worktracker.task`.
     - Open the App ID for **com.worktracker.task** and ensure **App Groups** is enabled and this group is selected.
     - Open the App ID for **com.worktracker.task.WorkTrackerWidget** and ensure **App Groups** is enabled and this group is selected.
   - Then run `eas credentials -p ios` again, remove the extension’s provisioning profile, and run `eas build -p ios --profile production` again.

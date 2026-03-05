# Fix App Group / provisioning profile by using local credentials

If the build keeps failing with:

```text
Provisioning profile "... WorkTrackerLiveActivity ..." doesn't support the group.com.worktracker.task App Group.
```

and removing the profile in EAS doesn’t help (same timestamp every time), use **local credentials** and supply your own provisioning profiles created in Apple Developer (with the App Group). This always works because you control the profiles.

---

## 1. Apple Developer: App Group + App IDs

Do this once (same as in [APP-GROUP-APPLE-DEVELOPER-SETUP.md](./APP-GROUP-APPLE-DEVELOPER-SETUP.md)):

1. **[App Groups](https://developer.apple.com/account/resources/identifiers/list)**  
   Create **group.com.worktracker.task** if it doesn’t exist.

2. **For each App ID** (open it → enable **App Groups** → Configure → select **group.com.worktracker.task** → Save):
   - **com.worktracker.task**
   - **com.worktracker.task.WorkTrackerWidget**
   - **com.worktracker.task.WorkTrackerLiveActivity**

---

## 2. Distribution certificate (one for all targets)

1. In Apple Developer go to **Certificates** → **+** → **Apple Distribution**.
2. Create the cert, download it, double‑click to add to Keychain.
3. In Keychain Access: right‑click the cert → **Export** → save as **dist.p12** and set a password.  
   Put **dist.p12** in the project folder **certs/** (create the folder if needed).

---

## 3. Provisioning profiles (one per target, with App Group)

Create **three** App Store provisioning profiles in Apple Developer:

1. **Profiles** → **+** → **App Store** (or App Store Connect).
2. For each profile, choose the right **App ID** and your **Distribution** cert, then generate and download:

| Profile name (any) | App ID |
|--------------------|--------|
| Main app           | **com.worktracker.task** |
| Widget             | **com.worktracker.task.WorkTrackerWidget** |
| Live Activity      | **com.worktracker.task.WorkTrackerLiveActivity** |

3. Save the three `.mobileprovision` files into the project **certs/** folder as:
   - **WorkTracker.mobileprovision**
   - **WorkTrackerWidget.mobileprovision**
   - **WorkTrackerLiveActivity.mobileprovision**

---

## 4. Project setup

1. Create **certs/** in the project root (if it doesn’t exist).
2. Copy the example and edit:
   ```bash
   cp credentials.json.example credentials.json
   ```
3. In **credentials.json**:
   - Set **provisioningProfilePath** for each target to the paths above (they already point to **certs/**).
   - Set **distributionCertificate.path** to **certs/dist.p12**.
   - Set **distributionCertificate.password** to the password you used when exporting **dist.p12**.
4. Ensure **credentials.json** and **certs/** are in **.gitignore** (they are in this project). Do not commit them.

---

## 5. Build with local credentials

Use the **production-local** profile so EAS uses your **credentials.json** and **certs/** instead of remote profiles:

```bash
eas build -p ios --profile production-local
```

EAS will use your three provisioning profiles (all with the App Group) and the build should succeed.

---

## Summary

- **production** → EAS-managed credentials (remote). Use after you’ve fixed App IDs and removed old profiles if you want to go back to remote.
- **production-local** → Your own **credentials.json** and **certs/** (profiles + dist cert). Use when the remote WorkTrackerLiveActivity profile never gets the App Group and you need a reliable build.

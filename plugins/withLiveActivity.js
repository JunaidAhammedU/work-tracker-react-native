/**
 * withLiveActivity.js
 *
 * Expo Config Plugin that:
 *  1. Copies ios-live-activity/ Swift files into a new Xcode extension target
 *     called "WorkTrackerLiveActivity".
 *  2. Copies LiveActivityBridge.swift + .m into the main app target.
 *  3. Sets SWIFT_VERSION, DEVELOPMENT_TEAM, and all required build settings.
 *  4. Adds the App Group entitlement to the new extension.
 *  5. Registers NSSupportsLiveActivities in the main app's Info.plist.
 */

const {
    withXcodeProject,
    withEntitlementsPlist,
    withInfoPlist,
    createRunOncePlugin,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP = "group.com.worktracker.task";
const LA_TARGET_NAME = "WorkTrackerLiveActivity";
const LA_BUNDLE_ID = "com.worktracker.task.WorkTrackerLiveActivity";

// ── 1. NSSupportsLiveActivities in main app Info.plist ────────────────────────

const withLiveActivitiesPlist = (config) => {
    return withInfoPlist(config, (mod) => {
        mod.modResults["NSSupportsLiveActivities"] = true;
        mod.modResults["NSSupportsLiveActivitiesFrequentUpdates"] = true;
        return mod;
    });
};

// ── 2. App Group entitlement on main app (already added by widget plugin,
//       this is a no-op if already present) ───────────────────────────────────

const withLiveActivityEntitlement = (config) => {
    return withEntitlementsPlist(config, (mod) => {
        const groups = mod.modResults["com.apple.security.application-groups"] || [];
        if (!groups.includes(APP_GROUP)) {
            mod.modResults["com.apple.security.application-groups"] = [...groups, APP_GROUP];
        }
        return mod;
    });
};

// ── 3. Xcode target + file wiring ─────────────────────────────────────────────

const withLiveActivityExtension = (config) => {
    return withXcodeProject(config, async (mod) => {
        const xcodeProject = mod.modResults;
        const projectRoot = mod.modRequest.projectRoot;
        const platformProjectRoot = mod.modRequest.platformProjectRoot;
        const projectName = mod.modRequest.projectName;
        const teamId = config.ios?.appleTeamId || "";

        // ── a) Copy Live Activity Swift files into ios/WorkTrackerLiveActivity/ ──
        const destDir = path.join(platformProjectRoot, LA_TARGET_NAME);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        const srcDir = path.join(projectRoot, "ios-live-activity");
        const swiftFiles = [
            "TaskTimerAttributes.swift",
            "TaskTimerLiveActivity.swift",
            "WorkTrackerLiveActivityBundle.swift",
        ];
        const otherFiles = ["WorkTrackerLiveActivity.entitlements"];

        for (const file of [...swiftFiles, ...otherFiles]) {
            const src = path.join(srcDir, file);
            const dest = path.join(destDir, file);
            if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        }

        // Info.plist must match addTarget()'s expected name: "<Target>-Info.plist"
        const infoSrc = path.join(srcDir, "Info.plist");
        const infoDest = path.join(destDir, `${LA_TARGET_NAME}-Info.plist`);
        if (fs.existsSync(infoSrc)) fs.copyFileSync(infoSrc, infoDest);

        // ── b) Copy LiveActivityBridge native files into main app ─────────────
        const mainAppDir = path.join(platformProjectRoot, projectName);
        const bridgeFiles = ["LiveActivityBridge.swift", "LiveActivityBridge.m"];
        for (const file of bridgeFiles) {
            const src = path.join(projectRoot, "ios-native", file);
            const dest = path.join(mainAppDir, file);
            if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        }

        // ── c) Skip if target was already added in a previous prebuild run ────
        if (xcodeProject.pbxTargetByName(LA_TARGET_NAME)) {
            return mod;
        }

        // ── d) Add the extension target ────────────────────────────────────────
        const target = xcodeProject.addTarget(
            LA_TARGET_NAME,
            "app_extension",
            LA_TARGET_NAME,
            LA_BUNDLE_ID
        );

        // ── e) Set SWIFT_VERSION directly on build configs ────────────────────
        {
            const configListUuid = target.pbxNativeTarget.buildConfigurationList;
            const configList = xcodeProject.pbxXCConfigurationList()[configListUuid];
            if (configList) {
                for (const item of configList.buildConfigurations) {
                    const bc = xcodeProject.pbxXCBuildConfigurationSection()[item.value];
                    if (bc && bc.buildSettings) {
                        bc.buildSettings.SWIFT_VERSION = "5.0";
                        bc.buildSettings.DEVELOPMENT_TEAM = teamId;
                        bc.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
                        bc.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.1";
                        bc.buildSettings.SKIP_INSTALL = "YES";
                        bc.buildSettings.CODE_SIGN_ENTITLEMENTS =
                            `${LA_TARGET_NAME}/WorkTrackerLiveActivity.entitlements`;
                    }
                }
            }
        }

        // ── f) Create a Sources build phase for the new target ────────────────
        xcodeProject.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);

        // ── g) Create an empty PBX group then add source files ────────────────
        const laGroup = xcodeProject.addPbxGroup([], LA_TARGET_NAME, LA_TARGET_NAME);
        const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
        xcodeProject.addToPbxGroup(laGroup.uuid, mainGroup);

        for (const file of swiftFiles) {
            xcodeProject.addSourceFile(file, { target: target.uuid }, laGroup.uuid);
        }

        // ── h) Add bridge files to the MAIN app target ─────────────────────────
        for (const file of bridgeFiles) {
            const buildFiles = xcodeProject.pbxBuildFileSection();
            const alreadyAdded = Object.values(buildFiles).some(
                (bf) => bf && bf.fileRef_comment === file
            );
            if (!alreadyAdded) {
                xcodeProject.addSourceFile(
                    `${projectName}/${file}`,
                    null,
                    xcodeProject.getFirstProject().firstProject.mainGroup
                );
            }
        }

        return mod;
    });
};

// ── Compose ───────────────────────────────────────────────────────────────────

const withLiveActivity = (config) => {
    config = withLiveActivitiesPlist(config);
    config = withLiveActivityEntitlement(config);
    config = withLiveActivityExtension(config);
    return config;
};

module.exports = createRunOncePlugin(withLiveActivity, "with-live-activity", "1.0.0");

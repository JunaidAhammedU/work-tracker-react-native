const {
    withXcodeProject,
    withEntitlementsPlist,
    createRunOncePlugin,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP = "group.com.worktracker.task";
const WIDGET_NAME = "WorkTrackerWidget";

/**
 * Adds the App Group entitlement to the main app so it can share
 * UserDefaults with the widget extension.
 */
const withAppGroupEntitlement = (config) => {
    return withEntitlementsPlist(config, (mod) => {
        mod.modResults["com.apple.security.application-groups"] = [APP_GROUP];
        return mod;
    });
};

/**
 * Copies the widget extension Swift files into the iOS project directory
 * and adds the widget target to the Xcode project.
 *
 * Root causes fixed in this version:
 *  1. addTarget() creates an empty buildPhases:[]. Without a Sources build phase
 *     on the widget target, xcode-lib's buildPhaseObject() falls back to the first
 *     PBXSourcesBuildPhase it finds — the MAIN app's — so Swift files were
 *     registered under "WorkTracker" instead of "WorkTrackerWidget".
 *     Fix: explicitly call addBuildPhase() for the widget target before adding files.
 *
 *  2. Passing files to addPbxGroup() creates orphan PBXBuildFile entries (no target).
 *     Then addSourceFile() also creates build files → duplicates.
 *     Fix: create the group EMPTY, add files only via addSourceFile().
 *
 *  3. addSourceFile() was called with "WorkTrackerWidget/WorkTrackerWidget.swift"
 *     while the group already has path "WorkTrackerWidget", causing Xcode to resolve
 *     the full path as "WorkTrackerWidget/WorkTrackerWidget/WorkTrackerWidget.swift".
 *     Fix: pass only the filename ("WorkTrackerWidget.swift") — the group path
 *     provides the folder context.
 */
const withWidgetExtension = (config) => {
    return withXcodeProject(config, async (mod) => {
        const xcodeProject = mod.modResults;
        const projectRoot = mod.modRequest.projectRoot;
        const platformProjectRoot = mod.modRequest.platformProjectRoot;

        const widgetDir = path.join(platformProjectRoot, WIDGET_NAME);

        if (!fs.existsSync(widgetDir)) {
            fs.mkdirSync(widgetDir, { recursive: true });
        }

        // --- Copy files ---
        const sourceDir = path.join(projectRoot, "ios-widget");
        const swiftFiles = [
            "WorkTrackerWidget.swift",
            "WorkTrackerWidgetBundle.swift",
        ];
        const otherFiles = [`${WIDGET_NAME}.entitlements`];

        for (const file of [...swiftFiles, ...otherFiles]) {
            const src = path.join(sourceDir, file);
            const dest = path.join(widgetDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
            }
        }

        // addTarget() sets INFOPLIST_FILE = "<TargetName>/<TargetName>-Info.plist",
        // so the plist must be copied with that exact name.
        const infoSrc = path.join(sourceDir, "Info.plist");
        const infoDest = path.join(widgetDir, `${WIDGET_NAME}-Info.plist`);
        if (fs.existsSync(infoSrc)) {
            fs.copyFileSync(infoSrc, infoDest);
        }

        // Skip if the widget target was already added by a previous prebuild run.
        if (xcodeProject.pbxTargetByName(WIDGET_NAME)) {
            return mod;
        }

        // --- Add widget extension target ---
        const target = xcodeProject.addTarget(
            WIDGET_NAME,
            "app_extension",
            WIDGET_NAME,
            `${config.ios?.bundleIdentifier || "com.worktracker.task"}.${WIDGET_NAME}`
        );

        // addTarget() does not set SWIFT_VERSION, leaving it empty and causing:
        // "SWIFT_VERSION '' is unsupported, supported versions are: 4.0, 4.2, 5.0, 6.0"
        //
        // updateBuildProperty(prop, value, build, targetName) silently fails here because
        // addToPbxNativeTargetSection stores the name with embedded quotes ('"WorkTrackerWidget"')
        // while pbxTargetByName looks for 'WorkTrackerWidget' — they never match, so validConfigs
        // stays empty and no setting is applied.
        //
        // Instead, navigate directly through the target object returned by addTarget():
        {
            const configListUuid = target.pbxNativeTarget.buildConfigurationList;
            const configList = xcodeProject.pbxXCConfigurationList()[configListUuid];
            if (configList) {
                for (const item of configList.buildConfigurations) {
                    const buildConfig =
                        xcodeProject.pbxXCBuildConfigurationSection()[item.value];
                    if (buildConfig && buildConfig.buildSettings) {
                        buildConfig.buildSettings.SWIFT_VERSION = "5.0";
                    }
                }
            }
        }

        // Fix #1 — addTarget() leaves buildPhases empty.
        // Explicitly create a Sources build phase for the widget target so that
        // buildPhaseObject() can find it when addSourceFile() is called below.
        xcodeProject.addBuildPhase(
            [],
            "PBXSourcesBuildPhase",
            "Sources",
            target.uuid
        );

        // Fix #2 — Create the group EMPTY (no files).
        // Passing files to addPbxGroup() creates orphan PBXBuildFile entries that
        // are not associated with any target or build phase.
        const widgetGroup = xcodeProject.addPbxGroup(
            [],
            WIDGET_NAME,
            WIDGET_NAME
        );

        // Attach the group to the main project navigator group.
        const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
        xcodeProject.addToPbxGroup(widgetGroup.uuid, mainGroup);

        // Fix #3 — Pass only the filename, not "WidgetName/filename".
        // The group already has path "WorkTrackerWidget", so xcode-lib constructs
        // the full path as: group.path + "/" + filename = "WorkTrackerWidget/WorkTrackerWidget.swift".
        // Prefixing with the folder name again causes the double-folder bug.
        for (const file of swiftFiles) {
            xcodeProject.addSourceFile(
                file,
                { target: target.uuid },
                widgetGroup.uuid
            );
        }

        return mod;
    });
};

/**
 * The main Expo config plugin that sets up the iOS widget.
 */
const withWorkTrackerWidget = (config) => {
    config = withAppGroupEntitlement(config);
    config = withWidgetExtension(config);
    return config;
};

module.exports = createRunOncePlugin(
    withWorkTrackerWidget,
    "work-tracker-widget",
    "1.0.0"
);

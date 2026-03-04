const {
    withXcodeProject,
    withInfoPlist,
    withEntitlementsPlist,
    createRunOncePlugin,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP = "group.com.worktracker.shared";
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
 */
const withWidgetExtension = (config) => {
    return withXcodeProject(config, async (mod) => {
        const xcodeProject = mod.modResults;
        const projectRoot = mod.modRequest.projectRoot;
        const platformProjectRoot = mod.modRequest.platformProjectRoot;

        const widgetDir = path.join(platformProjectRoot, WIDGET_NAME);

        // Create widget directory
        if (!fs.existsSync(widgetDir)) {
            fs.mkdirSync(widgetDir, { recursive: true });
        }

        // Copy Swift widget files
        const sourceDir = path.join(projectRoot, "ios-widget");
        const filesToCopy = [
            "WorkTrackerWidget.swift",
            "WorkTrackerWidgetBundle.swift",
            "Info.plist",
            `${WIDGET_NAME}.entitlements`,
        ];

        for (const file of filesToCopy) {
            const src = path.join(sourceDir, file);
            const dest = path.join(widgetDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
            }
        }

        // Add the widget extension target to the Xcode project
        const targetUuid = xcodeProject.generateUuid();
        const groupName = WIDGET_NAME;

        // Check if target already exists
        const existingTarget = xcodeProject.pbxTargetByName(WIDGET_NAME);
        if (!existingTarget) {
            // Add widget target
            const target = xcodeProject.addTarget(
                WIDGET_NAME,
                "app_extension",
                WIDGET_NAME,
                `${config.ios?.bundleIdentifier || "com.worktracker"}.${WIDGET_NAME}`
            );

            // Add source files to widget target
            const widgetGroup = xcodeProject.addPbxGroup(
                filesToCopy.filter((f) => f.endsWith(".swift")),
                WIDGET_NAME,
                WIDGET_NAME
            );

            // Add the group to the main project group
            const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
            xcodeProject.addToPbxGroup(widgetGroup.uuid, mainGroup);

            // Add swift files to build phase
            const swiftFiles = filesToCopy.filter((f) => f.endsWith(".swift"));
            for (const file of swiftFiles) {
                xcodeProject.addSourceFile(
                    `${WIDGET_NAME}/${file}`,
                    { target: target.uuid },
                    widgetGroup.uuid
                );
            }
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

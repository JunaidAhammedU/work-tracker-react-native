const {
    withXcodeProject,
    withEntitlementsPlist,
    createRunOncePlugin,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP = "group.com.worktracker.task";

/**
 * Adds App Group entitlement to the main app target.
 */
const withAppGroupEntitlement = (config) => {
    return withEntitlementsPlist(config, (mod) => {
        mod.modResults["com.apple.security.application-groups"] = [APP_GROUP];
        return mod;
    });
};

/**
 * Copies the native SharedGroupPreferences module and widget files
 * into the Xcode project so they get compiled.
 */
const withNativeFiles = (config) => {
    return withXcodeProject(config, async (mod) => {
        const xcodeProject = mod.modResults;
        const projectRoot = mod.modRequest.projectRoot;
        const projectName = mod.modRequest.projectName;
        const iosDir = path.join(mod.modRequest.platformProjectRoot, projectName);

        // --- Copy native bridge files into the main app target ---
        const nativeSourceDir = path.join(projectRoot, "ios-native");
        const filesToCopy = [
            "SharedGroupPreferences.swift",
            "SharedGroupPreferencesBridge.m",
        ];

        for (const file of filesToCopy) {
            const src = path.join(nativeSourceDir, file);
            const dest = path.join(iosDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);

                // Add to Xcode project if not already there
                if (file.endsWith(".swift") || file.endsWith(".m")) {
                    // Check if file already in project
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
            }
        }

        return mod;
    });
};

const withSharedGroupPreferences = (config) => {
    config = withAppGroupEntitlement(config);
    config = withNativeFiles(config);
    return config;
};

module.exports = createRunOncePlugin(
    withSharedGroupPreferences,
    "shared-group-preferences",
    "1.0.0"
);

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

                // Add to Xcode project under the MAIN app target if not already there
                if (file.endsWith(".swift") || file.endsWith(".m")) {
                    const buildFiles = xcodeProject.pbxBuildFileSection();
                    const filePath = `${projectName}/${file}`;
                    const alreadyAdded = Object.values(buildFiles).some(
                        (bf) => bf && typeof bf === "object" &&
                            (bf.fileRef_comment === file || bf.fileRef_comment === filePath)
                    );
                    if (!alreadyAdded) {
                        // Explicitly target the main app so files don't
                        // accidentally land in an extension target's build phase.
                        const mainAppTarget = xcodeProject.getFirstTarget().firstTarget;
                        const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
                        xcodeProject.addSourceFile(
                            filePath,
                            { target: mainAppTarget.uuid },
                            mainGroup
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

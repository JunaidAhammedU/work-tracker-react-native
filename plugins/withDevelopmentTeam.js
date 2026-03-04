const { withXcodeProject } = require("@expo/config-plugins");

const COMMENT_KEY = /_comment$/;

/**
 * Sets DEVELOPMENT_TEAM on every XCBuildConfiguration in the Xcode project.
 * This fixes "resource bundles are signed by default" errors on Xcode 14+
 * when resource bundle targets don't have a development team set.
 */
const withDevelopmentTeam = (config) => {
  return withXcodeProject(config, async (mod) => {
    const xcodeProject = mod.modResults;
    const teamId = config.ios?.appleTeamId;

    if (!teamId) {
      return mod;
    }

    const section = xcodeProject.pbxXCBuildConfigurationSection();
    if (!section) {
      return mod;
    }

    for (const id of Object.keys(section)) {
      if (COMMENT_KEY.test(id)) continue;
      const buildConfig = section[id];
      if (buildConfig.buildSettings) {
        buildConfig.buildSettings.DEVELOPMENT_TEAM = teamId;
      }
    }

    return mod;
  });
};

module.exports = withDevelopmentTeam;

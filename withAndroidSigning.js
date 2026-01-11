const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = (config, props) => {
    return withAppBuildGradle(config, (config) => {
        if (props.storePassword && props.keyAlias) {
            // 1. Define the release signing config
            const releaseSigning = `
    signingConfigs {
        release {
            storeFile file("../../${props.keystoreName}")
            storePassword "${props.storePassword}"
            keyAlias "${props.keyAlias}"
            keyPassword "${props.keyPassword}"
        }`;

            // 2. Inject the signingConfigs block
            config.modResults.contents = config.modResults.contents.replace(
                /signingConfigs\s*\{/,
                releaseSigning
            );

            // 3. FORCE the release build type to use signingConfigs.release
            // This regex looks for the release block and replaces the signingConfig line
            config.modResults.contents = config.modResults.contents.replace(
                /release\s*\{(?=[^}]*signingConfig\s+signingConfigs\.debug)[^}]*\}/,
                (match) =>
                    match.replace(
                        "signingConfig signingConfigs.debug",
                        "signingConfig signingConfigs.release"
                    )
            );
        }
        return config;
    });
};

import "dotenv/config";

export default {
    expo: {
        name: "Daffodil Hub",
        slug: "dcl-odoo-module",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "dcl",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: "org.reactjs.native.example.DaffodilHub",
            googleServicesFile: "./GoogleService-Info.plist",
        },
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png",
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            package: "com.odoo.dcl",
            googleServicesFile: "./google-services.json",
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png",
        },
        plugins: [
            [
                "./withAndroidSigning",
                {
                    keystoreName: "my-release-key.keystore",
                    storePassword: process.env.RELEASE_STORE_PASSWORD,
                    keyAlias: process.env.RELEASE_KEY_ALIAS,
                    keyPassword: process.env.RELEASE_KEY_PASSWORD,
                },
            ],
            "@react-native-firebase/app",
            "@react-native-firebase/messaging",
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#000783",
                    dark: {
                        backgroundColor: "#000783",
                    },
                },
            ],
            "expo-secure-store",
            [
                "expo-notifications",
                {
                    icon: "./assets/images/icon.png",
                    color: "#ffffff",
                    defaultChannel: "default",
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
    },
};

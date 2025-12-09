import messaging, {
    getMessaging,
    getToken,
    requestPermission,
} from "@react-native-firebase/messaging";
import * as SecureStore from "expo-secure-store";
import { PermissionsAndroid, Platform } from "react-native";
import { getDeviceId } from "./useDeviceId";

export async function requestUserPermission() {
    if (Platform.OS === "android") {
        // Android 13+ requires POST_NOTIFICATIONS
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log("POST_NOTIFICATIONS permission denied");
            return false;
        }

        return true;
    }

    // iOS uses messaging().requestPermission()
    const authStatus = await requestPermission(getMessaging());

    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
}

export function useFCMRegistration() {
    const registerFCM = async (
        userId: string | number | null,
        domain: string
    ) => {
        if (!userId) {
            console.log("No userId provided, skipping FCM registration");
            return;
        }

        try {
            // 1) Ask for permission
            const enabled = await requestUserPermission();
            if (!enabled) {
                console.log("FCM permission not granted");
                return;
            }

            // 2) Get current FCM token
            const fcmToken = await getToken(getMessaging());
            // console.log("FCM Token:", fcmToken);

            // 3) Get previous token (from SecureStore)
            const oldToken = await SecureStore.getItemAsync("fcm_token");

            // 4) Get stable device_id
            const deviceId = await getDeviceId();
            // console.log("Device ID:", deviceId);

            // 5) Only send to backend if token changed or first time
            if (!oldToken || oldToken !== fcmToken) {
                const res = await fetch(
                    `https://${domain}/firebase/register_token`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            device_id: deviceId,
                            fcm_token: fcmToken,
                            type: Platform.OS, // "android" / "ios"
                        }),
                    }
                ).then((res) => res.json());

                console.log("🚀 ~ registerFCM ~ res:", res.message);

                if (!res.ok) {
                    throw new Error(
                        `Failed to register token with backend: ${res.status}`
                    );
                }

                await SecureStore.setItemAsync("fcm_token", fcmToken);
            }
        } catch (error) {
            console.log("FCM Registration Error:", error);
        }
    };

    return { registerFCM };
}

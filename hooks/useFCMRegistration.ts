import messaging, { getMessaging } from "@react-native-firebase/messaging";
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
    const authStatus = await messaging().requestPermission();

    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
}

export function useFCMRegistration(userId: string | number | null) {
    const registerFCM = async () => {
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
            const fcmToken = await getMessaging().getToken();
            console.log("FCM Token:", fcmToken);

            // 3) Get previous token (from SecureStore)
            const oldToken = await SecureStore.getItemAsync("fcm_token");

            // 4) Get stable device_id
            const deviceId = await getDeviceId();
            console.log("Device ID:", deviceId);

            // 5) Only send to backend if token changed or first time
            if (!oldToken || oldToken !== fcmToken) {
                console.log("Sending token to backend...");

                // TODO: replace with your real API endpoint
                await fetch("https://your-api.com/device/register/", {
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
                });

                await SecureStore.setItemAsync("fcm_token", fcmToken);
            }

            // 6) Listen for token refresh
            getMessaging().onTokenRefresh(async (newToken) => {
                console.log("FCM token refreshed:", newToken);
                const currentDeviceId = await getDeviceId();

                await fetch("https://your-api.com/device/register/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        device_id: currentDeviceId,
                        fcm_token: newToken,
                        type: Platform.OS,
                    }),
                });

                await SecureStore.setItemAsync("fcm_token", newToken);
            });

            // 7) Optional: Foreground listener (just logs for now)
            getMessaging().onMessage(async (remoteMessage) => {
                console.log("Foreground message:", remoteMessage);
                // If you want, you can show an in-app banner or alert here
            });

            console.log("✅ FCM registration completed");
        } catch (error) {
            console.log("FCM Registration Error:", error);
        }
    };

    return { registerFCM };
}

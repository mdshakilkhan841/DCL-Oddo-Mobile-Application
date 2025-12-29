import { getMessaging, getToken } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getDeviceId } from "./useDeviceId";

async function checkPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;

    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === "granted";
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
            // 1) Ensure permission is granted
            const enabled = await checkPermission();
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

                // console.log("🚀 ~ registerFCM ~ res:", res.message);

                await SecureStore.setItemAsync("fcm_token", fcmToken);
            }
        } catch (error) {
            console.log("FCM Registration Error:", error);
        }
    };

    return { registerFCM };
}

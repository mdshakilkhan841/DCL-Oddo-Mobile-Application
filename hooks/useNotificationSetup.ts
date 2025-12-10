import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

export function useNotificationSetup() {
    useEffect(() => {
        // Set up notification channels and permissions
        const setupNotifications = async () => {
            try {
                // Request permissions
                const { status } =
                    await Notifications.requestPermissionsAsync();
                if (status !== "granted") {
                    console.log("Notification permissions not granted");
                    return;
                }

                // Set up notification channels for Android (required for Android 8+)
                if (Platform.OS === "android") {
                    await Notifications.setNotificationChannelAsync("default", {
                        name: "Default",
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: "#FF231F7C",
                        lockscreenVisibility:
                            Notifications.AndroidNotificationVisibility.PUBLIC,
                        bypassDnd: true,
                        sound: "default",
                        enableVibrate: true,
                    });

                    // Set up a channel specifically for high-priority notifications
                    await Notifications.setNotificationChannelAsync(
                        "high_priority",
                        {
                            name: "High Priority Notifications",
                            importance: Notifications.AndroidImportance.MAX,
                            vibrationPattern: [0, 250, 250, 250],
                            lightColor: "#FF231F7C",
                            lockscreenVisibility:
                                Notifications.AndroidNotificationVisibility
                                    .PUBLIC,
                            bypassDnd: true,
                            sound: "default",
                            enableVibrate: true,
                            showBadge: true,
                        }
                    );
                }

                console.log("🔔 Notification channels set up successfully");
            } catch (error) {
                console.log("Error setting up notifications:", error);
            }
        };

        setupNotifications();
    }, []);
}

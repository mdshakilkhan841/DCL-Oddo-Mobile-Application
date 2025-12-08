import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

// Configure how notifications should behave
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        console.log("🔔 Notification received:", {
            title: notification.request.content.title,
            body: notification.request.content.body,
            data: notification.request.content.data,
        });

        // Show notification even while app is in foreground
        return {
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        };
    },
});

export function useNotificationHandler() {
    useEffect(() => {
        // 1️⃣ Handle foreground notifications (App is open)
        const unsubscribeForeground = onMessage(
            getMessaging(),
            async (remoteMessage) => {
                console.log("📱 Foreground Message Received:", {
                    title: remoteMessage.notification?.title,
                    body: remoteMessage.notification?.body,
                    data: remoteMessage.data,
                });

                // Display using expo-notifications for heads-up banner
                if (remoteMessage.notification) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title:
                                remoteMessage.notification.title ||
                                "Notification",
                            body: remoteMessage.notification.body || "",
                            data: remoteMessage.data || {},
                            sound: "default",
                            badge: 1,
                        },
                        trigger: null, // Show immediately
                    });
                }
            }
        );

        // 2️⃣ Handle notification press (when user taps notification)
        const unsubscribeNotificationResponse =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    console.log("👆 Notification Pressed:");
                    console.log(
                        "Notification Data:",
                        response.notification.request.content.data
                    );

                    // Handle navigation or any action based on notification data
                    const data = response.notification.request.content.data;
                    if (data?.url && typeof data.url === "string") {
                        // Navigate to the URL
                        console.log("Navigate to:", data.url);
                        router.navigate({
                            pathname: "/home",
                            params: { baseUrl: data.url },
                        });
                    }
                }
            );

        return () => {
            unsubscribeForeground();
            unsubscribeNotificationResponse.remove();
        };
    }, []);
}

import {
    getInitialNotification,
    getMessaging,
    onMessage,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

// Configure how notifications should behave
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        // Show notification even while app is in foreground
        // Set high priority for heads-up display
        return {
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
        };
    },
});

export function useNotificationHandler(isReady: boolean) {
    useEffect(() => {
        if (!isReady) return;

        // 1️⃣ Handle foreground notifications (App is open)
        const unsubscribeForeground = onMessage(
            getMessaging(),
            async (remoteMessage) => {
                console.log("📱 Foreground Message Received:", {
                    title:
                        remoteMessage.data?.title ||
                        remoteMessage.notification?.title,
                    body:
                        remoteMessage.data?.body ||
                        remoteMessage.notification?.body,
                    data: remoteMessage.data,
                });

                // Display using expo-notifications for heads-up banner
                // Use data payload for title/body to be consistent

                const title = String(
                    remoteMessage.data?.title ||
                        remoteMessage.notification?.title ||
                        ""
                );
                const body = String(
                    remoteMessage.data?.body ||
                        remoteMessage.notification?.body ||
                        ""
                );

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title,
                        body,
                        data: remoteMessage.data || {},
                        sound: "default",
                        badge: 1,
                    },
                    trigger: null, // Show immediately
                });
            }
        );

        // 2️⃣ Handle notification press (when user taps notification)
        const unsubscribeNotificationResponse =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    console.log("👆 Notification Pressed:");

                    // Handle navigation or any action based on notification data
                    const data = response.notification.request.content.data;
                    console.log("🚀 ~ useNotificationHandler ~ data:", data);
                    if (
                        data?.record_url &&
                        typeof data.record_url === "string"
                    ) {
                        // Navigate to the URL
                        console.log("Navigate to:", data.record_url);
                        // Use router.replace instead of router.navigate to avoid navigation conflicts
                        router.navigate({
                            pathname: "/home",
                            params: { baseUrl: data.record_url },
                        });
                    }
                }
            );

        // When a notification is tapped while app is in background/killed
        // onNotificationOpenedApp(getMessaging(), (remoteMessage) => {
        //     console.log("📲 Notification Pressed (Background/Killed):");
        //     console.log("Title:", remoteMessage.notification?.title);
        //     console.log("Body:", remoteMessage.notification?.body);
        //     console.log("Data:", remoteMessage.data);
        // });

        // When app is launched BY tapping a notification from quit state
        getInitialNotification(getMessaging()).then((remoteMessage) => {
            if (remoteMessage) {
                console.log("🚀 App opened from quit state via notification:");
                const data = remoteMessage.data;
                console.log("🚀 ~ useNotificationHandler ~ data:", data);
                if (data?.record_url && typeof data.record_url === "string") {
                    // Navigate to the URL
                    console.log("Navigate to:", data.record_url);
                    // Use router.replace instead of router.navigate to avoid navigation conflicts
                    router.replace({
                        pathname: "/home",
                        params: { baseUrl: data.record_url },
                    });
                }
            }
        });

        return () => {
            unsubscribeForeground();
            unsubscribeNotificationResponse.remove();
        };
    }, [isReady]);
}

import { getDeviceId } from "@/hooks/useDeviceId";
import { useFCMRegistration } from "@/hooks/useFCMRegistration";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { useNotificationSetup } from "@/hooks/useNotificationSetup";
import { useSessionStore } from "@/store/sessionStore";
import {
    getMessaging,
    onNotificationOpenedApp,
    onTokenRefresh,
    setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { router, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-gesture-handler";

declare global {
    var __notificationData: any;
}

// Register background handler
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    // console.log("📩 Background Message Received:");
    // console.log("Title:", remoteMessage.notification?.title);
    // console.log("Body:", remoteMessage.notification?.body);
    // console.log("Data:", remoteMessage.data);
    // Since backend sends data-only messages, we need to display the notification using Expo
    // Extract title and body from data if not in notification
    // const title = String(
    //     remoteMessage.data?.title || remoteMessage.notification?.title || ""
    // );
    // const body = String(
    //     remoteMessage.data?.body || remoteMessage.notification?.body || ""
    // );
    // try {
    //     await Notifications.scheduleNotificationAsync({
    //         content: {
    //             title,
    //             body,
    //             data: remoteMessage.data || {},
    //             sound: "default",
    //             badge: 1,
    //         },
    //         trigger: null, // Show immediately
    //     });
    //     // console.log("✅ Background notification displayed successfully");
    // } catch (error) {
    //     console.log("❌ Error displaying background notification:", error);
    // }
    return Promise.resolve();
});

//     return Promise.resolve();
// });

export default function RootLayout() {
    // Initialize notification setup (channels, permissions)
    useNotificationSetup();

    // Initialize notification handler (handles foreground & press events)
    useNotificationHandler();
    const { sessions } = useSessionStore();
    const { registerFCM } = useFCMRegistration();

    useEffect(() => {
        // 1️⃣ App opened from background
        const unsubscribe = onNotificationOpenedApp(
            getMessaging(),
            (remoteMessage) => {
                if (remoteMessage?.data) {
                    handleNotificationNavigation(remoteMessage.data);
                }
            }
        );

        // 2️⃣ App opened from quit (background handler already stored data)
        if (global.__notificationData) {
            handleNotificationNavigation(global.__notificationData);
            global.__notificationData = null;
        }

        return unsubscribe;
    }, []);

    useEffect(() => {
        const tryRegister = async () => {
            if (sessions.length > 0) {
                // Assuming the last session is the active one
                const lastSession = sessions[sessions.length - 1];
                if (lastSession.user_id && lastSession.domain) {
                    // console.log("Attempting FCM registration on app start...");
                    await registerFCM(lastSession.user_id, lastSession.domain);
                }
            }
        };

        tryRegister();
    }, [sessions, registerFCM]); // Rerun if sessions change

    // Effect for handling token refresh
    useEffect(() => {
        const unsubscribe = onTokenRefresh(getMessaging(), async (newToken) => {
            // console.log("FCM token refreshed:", newToken);

            // We need user_id and domain. Get them from the store.
            const currentSessions = useSessionStore.getState().sessions;
            if (currentSessions.length === 0) {
                console.log(
                    "No active session, cannot re-register refreshed token."
                );
                return;
            }
            const lastSession = currentSessions[currentSessions.length - 1];
            const { user_id, domain } = lastSession;

            if (!user_id || !domain) {
                console.log(
                    "Missing user_id or domain, cannot re-register refreshed token."
                );
                return;
            }

            try {
                const deviceId = await getDeviceId();
                const res = await fetch(
                    `https://${domain}/firebase/register_token`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: user_id,
                            device_id: deviceId,
                            fcm_token: newToken,
                            type: Platform.OS,
                        }),
                    }
                );

                if (!res.ok) {
                    throw new Error(
                        `Backend registration failed: ${res.status}`
                    );
                }

                await SecureStore.setItemAsync("fcm_token", newToken);
                // console.log("✅ Refreshed token registered with backend.");
            } catch (error) {
                console.error("Failed to re-register refreshed token:", error);
            }
        });

        return () => {
            unsubscribe(); // Clean up the listener when the root layout unmounts
        };
    }, []); // Run only once

    const handleNotificationNavigation = (data: any) => {
        // console.log("🔀 Navigating using notification data:", data);

        // Example: Odoo URL passed from backend
        if (data.url) {
            router.push({
                pathname: "/home",
                params: { baseUrl: data.url },
            });
            return;
        }

        // Example: Navigate with task_id
        if (data.type === "task" && data.task_id) {
            const url = `/web#id=${data.task_id}&model=project.task&view_type=form`;

            router.push({
                pathname: "/home",
                params: { url },
            });
        }
    };

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen
                name="home"
                options={{
                    headerShown: true,
                    title: "Oddo Webview",
                    animation: "slide_from_right",
                }}
            />
        </Stack>
    );
}

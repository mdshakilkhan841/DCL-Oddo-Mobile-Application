import { getDeviceId } from "@/hooks/useDeviceId";
import { useFCMRegistration } from "@/hooks/useFCMRegistration";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { useNotificationSetup } from "@/hooks/useNotificationSetup";
import { useSessionStore } from "@/store/sessionStore";
import {
    getMessaging,
    onTokenRefresh,
    setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { router, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

declare global {
    var __notificationData: any;
}

// Register background handler
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    console.log("🔥 Background handler called with:", remoteMessage?.data);
    if (remoteMessage?.data) {
        // Store notification data globally for when app is launched from closed state
        global.__notificationData = remoteMessage.data;
        console.log("💾 Stored notification data:", global.__notificationData);
    }
    return Promise.resolve();
});

export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                // load fonts, storage, auth, etc.
                await new Promise((resolve) => setTimeout(resolve, 300)); // example
            } catch (e) {
                console.warn(e);
            } finally {
                setReady(true);
            }
        }

        prepare();
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (ready) {
            await SplashScreen.hideAsync();
        }
    }, [ready]);

    // Initialize notification setup (channels, permissions)
    useNotificationSetup();

    // Initialize notification handler (handles foreground & press events)
    useNotificationHandler();
    const { sessions } = useSessionStore();
    const { registerFCM } = useFCMRegistration();

    const handleNotificationNavigation = (data: any) => {
        console.log("🔀 Navigating using notification data:", data);

        // Example: Odoo URL passed from backend
        if (data.record_url) {
            console.log("🚀 Navigating to home with URL:", data.record_url);
            router.push({
                pathname: "/home",
                params: { baseUrl: data.record_url },
            });
            return;
        } else {
            console.log("❌ No record_url found in notification data");
        }
    };

    useEffect(() => {
        // Check for notification data that was stored when app was launched from quit state
        // This handles the case where getInitialNotification() stored data in global.__notificationData
        const notificationCheckTimeout = setTimeout(() => {
            console.log("🕒 Checking for stored notification data...");
            console.log(
                "🔍 Current global.__notificationData:",
                global.__notificationData
            );
            if (global.__notificationData) {
                console.log("✅ Found notification data, processing...");
                handleNotificationNavigation(global.__notificationData);
                global.__notificationData = null;
            } else {
                console.log("❌ No notification data found");
            }
        }, 500);

        return () => {
            clearTimeout(notificationCheckTimeout);
        };
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

    if (!ready) {
        // IMPORTANT: render NOTHING while splash is visible
        return null;
    }

    return (
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="sign-in" />
                <Stack.Screen
                    name="home"
                    options={{
                        gestureEnabled: false,
                        headerShown: true,
                        title: "Odoo Module",
                        animation: "slide_from_right",
                    }}
                />
            </Stack>
        </View>
    );
}

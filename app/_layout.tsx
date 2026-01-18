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
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

// Register background handler
setBackgroundMessageHandler(getMessaging(), async () => {
    return Promise.resolve();
});

export default function RootLayout() {
    const [ready, setReady] = useState(false);
    const { sessions } = useSessionStore();
    const { registerFCM } = useFCMRegistration();

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
    useNotificationHandler(ready);

    useEffect(() => {
        const tryRegister = async () => {
            if (sessions.length > 0) {
                // Assuming the last session is the active one
                const lastSession = sessions[sessions.length - 1];
                if (lastSession.user_id && lastSession.domain) {
                    // console.log("Attempting FCM registration on app start...");
                    await registerFCM(lastSession.user_id, lastSession.baseUrl);
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
                    "No active session, cannot re-register refreshed token.",
                );
                return;
            }
            const lastSession = currentSessions[currentSessions.length - 1];
            const { user_id, baseUrl } = lastSession;

            if (!user_id || !baseUrl) {
                console.log(
                    "Missing user_id or baseUrl, cannot re-register refreshed token.",
                );
                return;
            }

            try {
                const deviceId = await getDeviceId();
                const res = await fetch(`${baseUrl}/firebase/register_token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: user_id,
                        device_id: deviceId,
                        fcm_token: newToken,
                        type: Platform.OS,
                    }),
                });

                if (!res.ok) {
                    throw new Error(
                        `Backend registration failed: ${res.status}`,
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
                        title: "ERP Application",
                        animation: "slide_from_right",
                    }}
                />
            </Stack>
        </View>
    );
}

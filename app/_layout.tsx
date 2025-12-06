import { getMessaging } from "@react-native-firebase/messaging";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import "react-native-gesture-handler";

export default function RootLayout() {
    useEffect(() => {
        // 1️⃣ App opened from background
        const unsubscribe = getMessaging().onNotificationOpenedApp(
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

    const handleNotificationNavigation = (data: any) => {
        console.log("🔀 Navigating using notification data:", data);

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

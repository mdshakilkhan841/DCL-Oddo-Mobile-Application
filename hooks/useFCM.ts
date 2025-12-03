import messaging from "@react-native-firebase/messaging";
import { useEffect } from "react";

async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    console.log("🚀 ~ requestUserPermission ~ authStatus:", authStatus);
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
}

export function useFCM(onNewToken: (token: string) => void) {
    useEffect(() => {
        const init = async () => {
            const enabled = await requestUserPermission();
            if (!enabled) return;

            // 1) Get current token
            const token = await messaging().getToken();
            console.log("FCM Token:", token);
            onNewToken(token);

            // 2) Listen for token refresh
            const unsubscribeTokenRefresh = messaging().onTokenRefresh(
                (newToken) => {
                    console.log("FCM Token refreshed:", newToken);
                    onNewToken(newToken);
                }
            );

            // 3) Foreground message listener (optional – can move elsewhere)
            const unsubscribeOnMessage = messaging().onMessage(
                async (remoteMessage) => {
                    console.log("Foreground message:", remoteMessage);
                    // show custom in-app banner / Alert / etc.
                }
            );

            return () => {
                unsubscribeTokenRefresh();
                unsubscribeOnMessage();
            };
        };

        init();
    }, [onNewToken]);
}

import messaging, { getMessaging } from "@react-native-firebase/messaging";
import { useEffect } from "react";

async function requestUserPermission() {
    const authStatus = await getMessaging().requestPermission();
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
            const token = await getMessaging().getToken();
            console.log("FCM Token:", token);
            onNewToken(token);

            // 2) Listen for token refresh
            const unsubscribeTokenRefresh = getMessaging().onTokenRefresh(
                (newToken) => {
                    console.log("FCM Token refreshed:", newToken);
                    onNewToken(newToken);
                }
            );

            // 3) Foreground message listener (optional – can move elsewhere)
            const unsubscribeOnMessage = getMessaging().onMessage(
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

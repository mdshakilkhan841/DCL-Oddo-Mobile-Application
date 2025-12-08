import {
    getInitialNotification,
    getMessaging,
    onNotificationOpenedApp,
    setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import "expo-router/entry";

declare global {
    var __notificationData: any;
}

// Configure background notification behavior
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        return {
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        };
    },
});

// Required: Register background handler
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    console.log("📩 Background Message Received:");
    console.log("Title:", remoteMessage.notification?.title);
    console.log("Body:", remoteMessage.notification?.body);
    console.log("Data:", remoteMessage.data);

    // Display notification using expo-notifications even in background
    if (remoteMessage.notification) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: remoteMessage.notification.title || "Notification",
                    body: remoteMessage.notification.body || "",
                    data: remoteMessage.data || {},
                    sound: "default",
                    badge: 1,
                },
                trigger: null,
            });
        } catch (error) {
            console.log("Error displaying background notification:", error);
        }
    }
});

// When a notification is tapped while app is in background/killed
onNotificationOpenedApp(getMessaging(), (remoteMessage) => {
    console.log("📲 Notification Pressed (Background/Killed):");
    console.log("Title:", remoteMessage.notification?.title);
    console.log("Body:", remoteMessage.notification?.body);
    console.log("Data:", remoteMessage.data);

    global.__notificationData = remoteMessage.data; // TEMP STORE
});

// When app is launched BY tapping a notification
getInitialNotification(getMessaging()).then((remoteMessage) => {
    if (remoteMessage) {
        console.log("🚀 App opened from quit state via notification:");
        console.log("Title:", remoteMessage.notification?.title);
        console.log("Body:", remoteMessage.notification?.body);
        console.log("Data:", remoteMessage.data);
        global.__notificationData = remoteMessage.data;
    }
});

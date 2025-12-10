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
        // Always allow notifications to show, even in background
        return {
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
        };
    },
});

// Required: Register background handler
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    console.log("📩 Background Message Received:");
    console.log("Title:", remoteMessage.notification?.title);
    console.log("Body:", remoteMessage.notification?.body);
    console.log("Data:", remoteMessage.data);

    // In background state, Firebase automatically shows the notification
    // We just need to ensure it has the right priority for heads-up display
    // The notification will be shown by the native system automatically
    return Promise.resolve();
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

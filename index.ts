import {
    getInitialNotification,
    getMessaging,
    onNotificationOpenedApp
} from "@react-native-firebase/messaging";
import "expo-router/entry";

declare global {
    var __notificationData: any;
}

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

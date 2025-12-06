import messaging from "@react-native-firebase/messaging";
import "expo-router/entry";

// Required: Register background handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("📩 Background Message:", remoteMessage);
});

// When a notification is tapped while app is in background/killed
messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("📲 Notification pressed:", remoteMessage);

    global.__notificationData = remoteMessage.data; // TEMP STORE
});

// When app is launched BY tapping a notification
messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
        if (remoteMessage) {
            console.log(
                "🚀 App opened from quit state via notification:",
                remoteMessage
            );
            global.__notificationData = remoteMessage.data;
        }
    });

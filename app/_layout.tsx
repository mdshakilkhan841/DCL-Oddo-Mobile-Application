import "@react-native-firebase/app";
import { Stack } from "expo-router";
import "react-native-gesture-handler";

export default function RootLayout() {
    const userId = "123";
    // const sendTokenToBackend = async (token: string) => {
    //     try {
    //         await fetch("https://your-api.com/save-fcm-token/", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 // optionally include auth header / session cookie
    //             },
    //             body: JSON.stringify({
    //                 user_id: userId,
    //                 fcm_token: token,
    //             }),
    //         });
    //     } catch (e) {
    //         console.error("Failed to send FCM token to backend", e);
    //     }
    // };

    // useFCM(sendTokenToBackend);
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

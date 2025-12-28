import { useSessionStore } from "@/store/sessionStore";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";

export default function Index() {
    const { sessions } = useSessionStore();

    useEffect(() => {
        // Check if there are any valid sessions
        if (sessions.length > 0) {
            // Get the most recent session (last one in the array)
            const lastSession = sessions[sessions.length - 1];

            // Redirect to home page with the last used session's base URL
            router.replace({
                pathname: "/home",
                params: {
                    baseUrl: `${lastSession.baseUrl}/web`,
                },
            });
        }
    }, [sessions]);

    // Default redirect to sign-in if no valid sessions exist
    return <Redirect href="/sign-in" />;
}

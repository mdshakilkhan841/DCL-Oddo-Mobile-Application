import { useSessionStore } from "@/store/sessionStore";
import { getValidSession } from "@/utils/validateSession";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";

export default function Index() {
    const { sessions } = useSessionStore();

    useEffect(() => {
        const checkAndRedirect = async () => {
            // Check if there are any valid sessions
            if (sessions.length > 0) {
                // Validate sessions to find the first valid one
                const validSession = await getValidSession(sessions);

                if (validSession) {
                    // console.log(
                    //     "✅ Valid session found, redirecting to home..."
                    // );
                    // Redirect to home page with the valid session's base URL
                    router.replace({
                        pathname: "/home",
                        params: {
                            baseUrl: `${validSession.baseUrl}/web`,
                        },
                    });
                    return;
                } else {
                    console.log(
                        "❌ No valid sessions found (expired/invalid cookies)"
                    );
                    // All sessions are invalid, redirect to sign-in
                    router.replace("/sign-in");
                }
            }
        };

        checkAndRedirect();
    }, [sessions]);

    // Default redirect to sign-in if no valid sessions exist
    return <Redirect href="/sign-in" />;
}

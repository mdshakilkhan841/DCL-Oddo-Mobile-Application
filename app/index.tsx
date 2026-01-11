import { useSessionStore } from "@/store/sessionStore";
import { getValidSession } from "@/utils/validateSession";
import { router } from "expo-router";
import { useEffect } from "react";

export default function Index() {
    const { sessions } = useSessionStore();

    useEffect(() => {
        const checkAndRedirect = async () => {
            try {
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
                    }
                }

                // console.log(
                //     "❌ No valid sessions found, redirecting to sign-in"
                // );
                // No valid sessions, redirect to sign-in
                router.replace("/sign-in");
            } catch (error) {
                console.error("❌ Error during session validation:", error);
                // If there's any error, redirect to sign-in as a fallback
                router.replace("/sign-in");
            }
        };

        // Use setTimeout to ensure this runs after the initial render
        const timeoutId = setTimeout(checkAndRedirect, 50);
        return () => clearTimeout(timeoutId);
    }, [sessions]);

    // Return null during the check to avoid any rendering issues
    return null;
}

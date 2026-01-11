import { Session } from "@/store/sessionStore";
import CookieManager from "@react-native-cookies/cookies";

/**
 * Validates if a session is still valid by checking the session cookie
 * @param session The session to validate
 * @returns Promise<boolean> True if session is valid, false otherwise
 */
export async function validateSession(session: Session): Promise<boolean> {
    try {
        // Try to get the session cookie
        const cookies = await CookieManager.get(session.baseUrl, false);
        // console.log("🚀 ~ validateSession ~ cookies:", cookies);

        // Check if session_id cookie exists
        const sessionCookie = cookies?.session_id;
        // console.log("🚀 ~ validateSession ~ sessionCookie:", sessionCookie);

        if (!sessionCookie) {
            console.log("❌ No session cookie found");
            return false;
        }

        // Check if the cookie has expired (simple check for expiration)
        if (
            sessionCookie.expires &&
            new Date(sessionCookie.expires) < new Date()
        ) {
            console.log("❌ Session cookie has expired");
            return false;
        }

        // Additional validation: Check if we can access a protected endpoint
        // This ensures the session is actually valid on the server side
        try {
            const testUrl = `${session.baseUrl}/web/session/get_session_info`;

            const response = await fetch(testUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `session_id=${sessionCookie.value}`,
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {},
                }),
            });

            if (!response.ok) {
                // console.log(
                //     "❌ Session validation failed - server returned non-OK status:",
                //     response.status
                // );
                return false;
            }

            const data = await response.json();
            if (data.error) {
                // console.log(
                //     "❌ Session validation failed - server error:",
                //     data.error
                // );
                return false;
            }

            // If we get here, the session is valid
            // console.log("✅ Session is valid");
            return true;
        } catch (error) {
            console.log("❌ Session validation failed - network error:", error);
            return false;
        }
    } catch (error) {
        console.error("❌ Error validating session:", error);
        return false;
    }
}

/**
 * Validates all sessions and returns the first valid one
 * @param sessions Array of sessions to validate
 * @returns Promise<Session | null> First valid session or null if none are valid
 */
export async function getValidSession(
    sessions: Session[]
): Promise<Session | null> {
    if (!sessions || sessions.length === 0) {
        return null;
    }

    // Try sessions in reverse order (most recent first)
    for (let i = sessions.length - 1; i >= 0; i--) {
        const session = sessions[i];
        const isValid = await validateSession(session);
        if (isValid) {
            return session;
        }
    }

    return null;
}

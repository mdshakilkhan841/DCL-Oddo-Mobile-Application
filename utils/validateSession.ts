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

        // Check if session_id cookie exists
        const sessionCookie = cookies?.session_id;

        if (!sessionCookie) {
            console.log("❌ No session cookie found");
            return false;
        }

        // Check if the cookie has expired (simple check for expiration)
        // Note: This is a basic check. For more robust validation, you might need to
        // make an API call to verify the session on the server side.
        if (
            sessionCookie.expires &&
            new Date(sessionCookie.expires) < new Date()
        ) {
            console.log("❌ Session cookie has expired");
            return false;
        }

        console.log("✅ Session cookie is valid");
        return true;
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

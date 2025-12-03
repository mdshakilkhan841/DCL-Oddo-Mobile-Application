import { Feather } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import CookieManager from "@react-native-cookies/cookies";
import { getApps } from "@react-native-firebase/app";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SessionModal from "../components/SessionModal";
import { Session, useSessionStore } from "../store/sessionStore";

const Signin = () => {
    console.log("🚀 ~ getApps:", getApps());

    const [domain, setDomain] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const addSession = useSessionStore((state) => state.addSession);

    const bottomSheetRef = useRef<BottomSheet>(null);

    const LOGIN_URL = `https://${domain}/web/session/authenticate`;

    const body = {
        jesonrpc: "2.0",
        params: {
            db: "daffodil_ecommerce",
            login: email,
            password: password,
        },
    };

    const navigateToHome = (baseUrl: string) => {
        router.navigate({
            pathname: "/home",
            params: { baseUrl },
        });
    };

    const setSessionCookie = async (session: Session) => {
        await CookieManager.set(session.baseUrl, {
            name: "session_id",
            value: session.sessionId,
            path: "/",
            domain: session.baseUrl.replace("https://", ""),
            secure: true,
            httpOnly: true,
        });
    };

    const handleSelectSession = async (session: Session) => {
        try {
            setLoading(true);
            bottomSheetRef.current?.close();
            await setSessionCookie(session);
            navigateToHome(session.baseUrl);
        } catch (err: any) {
            Alert.alert("Error", "Could not apply session. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            setLoading(true);

            const res = await fetch(LOGIN_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                throw new Error(`Login failed (${res.status})`);
            }

            const data = await res.json();
            const baseUrl = data?.result?.["web.base.url"];

            // read Set-Cookie header
            const setCookieHeader = res.headers.get("set-cookie") || "";
            const match = setCookieHeader.match(/session_id=([^;]+)/);
            const sessionId = match?.[1];

            if (!sessionId) {
                throw new Error("session_id not found in Set-Cookie");
            }

            const newSession: Session = { domain, email, sessionId, baseUrl };

            // ✅ Save session to Zustand store (which persists to expo secure storage)
            addSession(newSession);

            // ✅ Save cookie in native cookie store for WebView
            await setSessionCookie(newSession);

            // navigate to webview
            navigateToHome(baseUrl);
        } catch (err: any) {
            console.error(err);
            Alert.alert("Login error", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // useEffect(() => {
    //     const init = async () => {
    //         // 1) Get current token
    //         const token = await messaging().getToken();
    //         console.log("FCM Token:", token);
    //     };

    //     init();
    // }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <LinearGradient
                colors={["#84fab0", "#8fd3f4"]}
                style={styles.container}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoidingContainer}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollViewContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>
                                Sign in to your account
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Domain Name"
                                value={domain}
                                onChangeText={setDomain}
                                autoCapitalize="none"
                                placeholderTextColor="#888"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="User Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#888"
                            />
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!isPasswordVisible}
                                    placeholderTextColor="#888"
                                />
                                <TouchableOpacity
                                    onPress={() =>
                                        setIsPasswordVisible(!isPasswordVisible)
                                    }
                                >
                                    <Feather
                                        name={
                                            isPasswordVisible
                                                ? "eye-off"
                                                : "eye"
                                        }
                                        size={20}
                                        color="gray"
                                    />
                                </TouchableOpacity>
                            </View>
                            <Pressable
                                onPress={handleLogin}
                                disabled={loading}
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                    loading && styles.buttonDisabled,
                                ]}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? "Logging in..." : "Login"}
                                </Text>
                            </Pressable>
                            <TouchableOpacity
                                activeOpacity={0.6}
                                style={styles.linkButton}
                                onPress={() => bottomSheetRef.current?.expand()}
                            >
                                <Text style={styles.linkButtonText}>
                                    Or login to an existing domain
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
            <SessionModal
                bottomSheetRef={bottomSheetRef}
                onSelectSession={handleSelectSession}
            />
        </GestureHandlerRootView>
    );
};

export default Signin;
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    formContainer: {
        width: "85%",
        alignItems: "center",
        alignSelf: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#2c3e50",
    },
    subtitle: {
        fontSize: 16,
        color: "#34495e",
        marginTop: 8,
    },
    input: {
        width: "100%",
        height: 46,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        color: "#333",
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 46,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 25,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        height: "100%",
        color: "#333",
    },
    button: {
        width: "100%",
        height: 46,
        backgroundColor: "#2c3e50",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        marginTop: 10,
    },
    buttonPressed: {
        backgroundColor: "#34495e",
    },
    buttonDisabled: {
        backgroundColor: "#95a5a6",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    linkButton: {
        marginTop: 20,
    },
    linkButtonText: {
        color: "#2c3e50",
        fontSize: 15,
        fontWeight: "500",
    },
});

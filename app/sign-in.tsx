import { useFCMRegistration } from "@/hooks/useFCMRegistration";
import { Feather } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import CookieManager from "@react-native-cookies/cookies";
import { getMessaging, getToken } from "@react-native-firebase/messaging";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
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
import { useDomainStore } from "../store/domainStore";
import { Session, useSessionStore } from "../store/sessionStore";

const Signin = () => {
    const {
        domain,
        databases,
        selectedDb,
        setDomain,
        setDatabases,
        setSelectedDb,
        loadStoredData,
        saveToStorage,
    } = useDomainStore();

    const [dbDropdownVisible, setDbDropdownVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [dbFetching, setDbFetching] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const { addSession } = useSessionStore();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { registerFCM } = useFCMRegistration();

    useEffect(() => {
        const initializeAndGetToken = async () => {
            const fcmToken = await getToken(getMessaging());
            console.log("🚀 ~ initializeAndGetToken ~ fcmToken:", fcmToken);
            setFcmToken(fcmToken);
        };
        initializeAndGetToken();
    }, []);

    // Load stored domain + DB
    useEffect(() => {
        loadStoredData();
    }, []);

    const LOGIN_API = `https://${domain}/web/session/authenticate`;

    const body = {
        jsonrpc: "2.0",
        params: {
            db: selectedDb,
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

    const fetchDatabaseList = async () => {
        if (!domain) {
            // Alert.alert("Error", "Enter domain first");
            return;
        }

        if (databases.length > 0) {
            setDbDropdownVisible(!dbDropdownVisible);
            return;
        }

        setDbFetching(true);
        try {
            const res = await fetch(`https://${domain}/web/database/list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {},
                }),
            });

            const data = await res.json();
            const list = data?.result || [];

            setDatabases(list);
            setSelectedDb(list[0]);
            setDbDropdownVisible(true);
            await saveToStorage();
        } catch (err) {
            console.log(err);
            Alert.alert("Error", "Could not fetch database list");
        } finally {
            setDbFetching(false);
        }
    };

    // RESTORED FEATURE: Select an existing domain from modal
    const handleSelectSession = async (session: Session) => {
        try {
            setLoading(true);
            bottomSheetRef.current?.close();

            // Fill domain & fetch DBs
            setDomain(session.domain);
            setDatabases([]); // reset
            setSelectedDb(null);

            // Fetch database list using new domain
            const res = await fetch(
                `https://${session.domain}/web/database/list`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "call",
                        params: {},
                    }),
                }
            );

            const data = await res.json();
            const list = data?.result || [];

            setDatabases(list);
            setSelectedDb(list[0]);

            await saveToStorage();

            navigateToHome(`${session.baseUrl}/web`);
        } catch (err) {
            Alert.alert("Error", "Could not load saved session");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            setLoading(true);

            const res = await fetch(LOGIN_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`Login failed (${res.status})`);

            const data = await res.json();
            const baseUrl = data?.result?.["web.base.url"];
            const user_id = data?.result?.uid;

            const setCookieHeader = res.headers.get("set-cookie") || "";
            const match = setCookieHeader.match(/session_id=([^;]+)/);
            const sessionId = match?.[1];

            if (!sessionId) throw new Error("session_id not found");

            const newSession: Session = {
                domain,
                email,
                user_id,
                sessionId,
                baseUrl,
            };

            addSession(newSession);
            await setSessionCookie(newSession);

            // Register FCM
            registerFCM(user_id, domain);

            navigateToHome(`${baseUrl}/web`);
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

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
                        {/* FCM Token Display */}
                        {fcmToken && (
                            <View style={styles.fcmContainer}>
                                <Text style={styles.fcmLabel}>FCM Token:</Text>
                                <View style={styles.fcmTokenWrapper}>
                                    <Text
                                        style={styles.fcmTokenText}
                                        numberOfLines={1}
                                        ellipsizeMode="middle"
                                    >
                                        {fcmToken}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            await Clipboard.setStringAsync(
                                                fcmToken
                                            );
                                        }}
                                    >
                                        <Feather
                                            name="copy"
                                            size={18}
                                            color="#34495e"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>
                                Sign in to your account
                            </Text>
                        </View>

                        {/* SECTION 1: DOMAIN SETTINGS */}
                        <View style={styles.formContainer}>
                            <Text style={styles.sectionTitle}>
                                Domain Settings
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Domain Name"
                                value={domain}
                                onChangeText={(v) => {
                                    setDomain(v);
                                    setDatabases([]);
                                    setSelectedDb(null);
                                }}
                                autoCapitalize="none"
                                placeholderTextColor="#888"
                            />

                            <View>
                                {/* DB Selector */}
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={styles.input}
                                    onPress={fetchDatabaseList}
                                >
                                    {dbFetching ? (
                                        <ActivityIndicator color="#333" />
                                    ) : (
                                        <Text
                                            style={{
                                                color: selectedDb
                                                    ? "#333"
                                                    : "#888",
                                            }}
                                        >
                                            {selectedDb || "Select Database"}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {dbDropdownVisible && (
                                    <ScrollView
                                        style={styles.dropdownBox}
                                        nestedScrollEnabled={true}
                                    >
                                        {databases.map((db) => (
                                            <TouchableOpacity
                                                activeOpacity={0.6}
                                                key={db}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setSelectedDb(db);
                                                    setDbDropdownVisible(false);
                                                    saveToStorage();
                                                }}
                                            >
                                                <Text
                                                    style={styles.dropdownText}
                                                >
                                                    {db}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        </View>

                        {/* SECTION 2: USER CREDENTIALS */}
                        <View style={styles.formContainer}>
                            <Text style={styles.sectionTitle}>
                                User Credentials
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="User Email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                placeholderTextColor="#888"
                            />

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    secureTextEntry={!isPasswordVisible}
                                    value={password}
                                    onChangeText={setPassword}
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
                        </View>

                        {/* EXISTING SESSION BUTTON */}
                        <TouchableOpacity
                            activeOpacity={0.6}
                            style={styles.linkButton}
                            onPress={() => bottomSheetRef.current?.expand()}
                        >
                            <Text style={styles.linkButtonText}>
                                Or login to an existing domain
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>

            {/* RESTORED MODAL HERE */}
            <SessionModal
                bottomSheetRef={bottomSheetRef}
                onSelectSession={handleSelectSession}
            />
        </GestureHandlerRootView>
    );
};

export default Signin;

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardAvoidingContainer: { flex: 1 },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    header: { alignItems: "center", marginBottom: 40 },
    title: { fontSize: 32, fontWeight: "bold", color: "#2c3e50" },
    subtitle: { fontSize: 16, color: "#34495e", marginTop: 8 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
        color: "#2c3e50",
    },
    formContainer: {
        width: "85%",
        alignSelf: "center",
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
        justifyContent: "center",
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
    buttonPressed: { backgroundColor: "#34495e" },
    buttonDisabled: { backgroundColor: "#95a5a6" },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    dropdownBox: {
        position: "absolute",
        top: 50, // Position it right below the input
        width: "100%",
        maxHeight: 200, // Set a max height for the dropdown
        backgroundColor: "white",
        borderRadius: 8,
        elevation: 5,
        zIndex: 10, // Ensure it's on top of other elements
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    dropdownText: {
        fontSize: 16,
        color: "#333",
    },
    linkButton: { marginTop: 15 },
    linkButtonText: {
        color: "#2c3e50",
        fontSize: 15,
        fontWeight: "500",
        textAlign: "center",
    },
    fcmContainer: {
        width: "85%",
        alignSelf: "center",
    },
    fcmLabel: {
        fontSize: 12,
        color: "#34495e",
        fontWeight: "bold",
        marginBottom: 4,
    },
    fcmTokenWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    fcmTokenText: {
        color: "#2c3e50",
        flex: 1,
        marginRight: 10,
    },
});

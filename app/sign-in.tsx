import { useFCMRegistration } from "@/hooks/useFCMRegistration";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import CookieManager from "@react-native-cookies/cookies";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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

    const { addSession } = useSessionStore();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { registerFCM } = useFCMRegistration();

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
        if (!domain) return;

        if (databases.length > 0) {
            setDbDropdownVisible(!dbDropdownVisible);
            return;
        }

        setDbFetching(true);
        try {
            const res = await fetch(`https://${domain}/web/database/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            Alert.alert("Error", "Could not fetch database list");
        } finally {
            setDbFetching(false);
        }
    };

    const handleSelectSession = async (session: Session) => {
        try {
            setLoading(true);
            bottomSheetRef.current?.close();

            setDomain(session.domain);
            setDatabases([]);
            setSelectedDb(null);

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
        } catch {
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

            if (!res.ok) throw new Error("Login failed");

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
            <StatusBar style="light" />

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Welcome Back!</Text>
                <Text style={styles.headerSubtitle}>
                    Sign in to your account
                </Text>
                {/* LOGO PLACEHOLDER */}
                <View style={styles.logoCircle}>
                    <Image
                        source={require("@/assets/images/daffodil-group-logo.png")}
                        style={{ width: 50, height: 50 }}
                        resizeMode="cover"
                    />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* DOMAIN CARD */}
                    <View style={styles.card}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 16,
                            }}
                        >
                            <View style={styles.logoContainer}>
                                <FontAwesome5
                                    name="globe"
                                    size={24}
                                    color="#000783"
                                />
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>
                                    Domain Information
                                </Text>
                                <Text style={styles.cardSubtitle}>
                                    Connected to your workspace
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.inputContainer, { zIndex: 1 }]}>
                            <View>
                                <Text style={styles.inputLabel}>
                                    Domain Name
                                </Text>
                                <TextInput
                                    style={styles.textInputStyle}
                                    placeholder="Domain"
                                    value={domain}
                                    onChangeText={(v) => {
                                        setDomain(v);
                                        setDatabases([]);
                                        setSelectedDb(null);
                                    }}
                                />
                            </View>

                            <View>
                                <Text style={styles.inputLabel}>Database</Text>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={fetchDatabaseList}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.dbInputContainer}>
                                        {dbFetching ? (
                                            <ActivityIndicator />
                                        ) : (
                                            <Text>
                                                {selectedDb ||
                                                    "Select Database"}
                                            </Text>
                                        )}
                                        <Feather
                                            name={
                                                dbDropdownVisible
                                                    ? "chevron-up"
                                                    : "chevron-down"
                                            }
                                            size={20}
                                            color="#666"
                                        />
                                    </View>
                                </TouchableOpacity>
                                {dbDropdownVisible && (
                                    <ScrollView
                                        style={styles.dropdownBox}
                                        nestedScrollEnabled
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
                                                <Text>{db}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        </View>

                        <View style={styles.successBox}>
                            <Feather
                                name="check-circle"
                                size={18}
                                color="#1e7f3c"
                            />
                            <Text style={styles.successText}>
                                Domain is active and connected
                            </Text>
                        </View>
                    </View>

                    {/* LOGIN CARD */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Login Panel</Text>

                        <TextInput
                            style={styles.textInputStyle}
                            placeholder="User ID"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <View style={styles.passwordBox}>
                            <TextInput
                                style={{ flex: 1, paddingVertical: 8 }}
                                placeholder="Password"
                                secureTextEntry={!isPasswordVisible}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() =>
                                    setIsPasswordVisible(!isPasswordVisible)
                                }
                            >
                                <Feather
                                    name={isPasswordVisible ? "eye-off" : "eye"}
                                    size={18}
                                />
                            </TouchableOpacity>
                        </View>

                        <Pressable
                            style={styles.loginButton}
                            onPress={handleLogin}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading ? "Logging in..." : "Login"}
                            </Text>
                        </Pressable>

                        <TouchableOpacity
                            style={styles.domainLogsBtn}
                            onPress={() => bottomSheetRef.current?.expand()}
                        >
                            <Text style={styles.domainLogsText}>
                                Domain Logs
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerText}>@Daffodil Family</Text>
                </ScrollView>
            </KeyboardAvoidingView>

            <SessionModal
                bottomSheetRef={bottomSheetRef}
                onSelectSession={handleSelectSession}
            />
        </GestureHandlerRootView>
    );
};

export default Signin;

const styles = StyleSheet.create({
    header: {
        height: 160,
        paddingVertical: 40,
        alignItems: "center",
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
        backgroundColor: "#000783",
        position: "relative",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "bold",
    },
    headerSubtitle: {
        color: "#dbe4ff",
    },
    logoCircle: {
        position: "absolute",
        bottom: -35,
        alignSelf: "center",
        width: 75,
        height: 75,
        borderRadius: 100,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        borderWidth: 6,
        borderColor: "#000783",
        zIndex: 20,
    },
    content: {
        paddingTop: 50,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "#EFF2FF",
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 14,
        elevation: 2,
        gap: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    cardSubtitle: {
        fontSize: 13,
        color: "#666",
    },
    logoContainer: {
        width: 44,
        height: 44,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        elevation: 2,
    },
    inputContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        elevation: 1,
        padding: 16,
        gap: 12,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        justifyContent: "center", // Kept for the TouchableOpacity
        height: 40, // Give it a consistent height
    },
    textInputStyle: {
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        paddingVertical: 8,
    },
    dbInputContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownBox: {
        position: "absolute",
        bottom: -45, // Position it right below the input
        width: "100%",
        maxHeight: 150, // Set a max height for the dropdown
        backgroundColor: "white",
        borderBottomRightRadius: 6,
        borderBottomLeftRadius: 6,
        elevation: 3,
        zIndex: 10, // Ensure it's on top of other elements
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    successBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e8f7ee",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#1e7f3c",
    },
    successText: {
        marginLeft: 8,
        color: "#1e7f3c",
        fontSize: 13,
    },
    passwordBox: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        marginBottom: 20,
    },
    loginButton: {
        backgroundColor: "#0a1fa8",
        height: 44,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    loginButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    domainLogsBtn: {
        marginTop: 14,
        alignSelf: "center",
    },
    domainLogsText: {
        color: "#0a1fa8",
        fontWeight: "600",
    },
    footerText: {
        textAlign: "center",
        color: "#999",
        marginTop: 10,
    },
});

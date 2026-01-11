import SessionModal from "@/components/SessionModal";
import { useFCMRegistration } from "@/hooks/useFCMRegistration";
import { useSessionHandler } from "@/hooks/useSessionHandler";
import { useDomainStore } from "@/store/domainStore";
import { Session, useSessionStore } from "@/store/sessionStore";
import {
    AntDesign,
    Feather,
    FontAwesome5,
    MaterialIcons,
} from "@expo/vector-icons";
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

const Signin = async () => {
    const {
        domain,
        databases,
        selectedDb,
        setDomain,
        setDatabases,
        setSelectedDb,
        loadStoredData,
        saveToStorage,
        getWorkingDomain,
    } = useDomainStore();

    const [dbDropdownVisible, setDbDropdownVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [dbFetching, setDbFetching] = useState(false);
    const [showLoginPanel, setShowLoginPanel] = useState(false);

    const { addSession } = useSessionStore();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { registerFCM } = useFCMRegistration();
    const { handleSelectSession } = useSessionHandler({
        bottomSheetRef,
        setLoading,
    });

    // const localStorage = await SecureStore.getItemAsync("domain-data");
    // console.log("🚀 ~ Signin ~ localStorage:", localStorage);

    // useEffect(() => {
    //     const initializeAndGetToken = async () => {
    //         const fcmToken = await getToken(getMessaging());
    //         const deviceId = await getDeviceId();
    //         console.log("🚀 ~ initializeAndGetToken ~ deviceId:", deviceId);
    //         console.log("🚀 ~ initializeAndGetToken ~ fcmToken:", fcmToken);
    //     };
    //     initializeAndGetToken();
    // }, []);

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
        router.replace({
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
            // Get the working domain (with proper www handling)
            const workingDomain = await getWorkingDomain(domain);

            const res = await fetch(
                `https://${workingDomain}/web/database/list`,
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
            setDbDropdownVisible(true);
            await saveToStorage();
        } catch (err) {
            Alert.alert("Error", "Could not fetch database list");
        } finally {
            setDbFetching(false);
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
        <GestureHandlerRootView style={styles.container}>
            <StatusBar style="light" backgroundColor="#000783" />

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
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {!showLoginPanel ? (
                        <>
                            {/* Domain CARD */}
                            <View
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: "#EFF2FF",
                                    },
                                ]}
                            >
                                <View
                                    style={{
                                        padding: 16,
                                        gap: 16,
                                    }}
                                >
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
                                    <View
                                        style={[
                                            styles.inputContainer,
                                            { zIndex: 10 },
                                        ]}
                                    >
                                        <View>
                                            <Text style={styles.inputLabel}>
                                                Domain
                                            </Text>
                                            <TextInput
                                                style={styles.textInputStyle}
                                                placeholder="Domain"
                                                placeholderTextColor="#999"
                                                autoCapitalize="none"
                                                value={domain}
                                                onChangeText={(v) => {
                                                    setDomain(v);
                                                    setDatabases([]);
                                                    setSelectedDb(null);
                                                }}
                                            />
                                        </View>

                                        <View>
                                            <Text style={styles.inputLabel}>
                                                Database
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.input}
                                                onPress={fetchDatabaseList}
                                                activeOpacity={0.6}
                                                disabled={!domain}
                                            >
                                                <View
                                                    style={
                                                        styles.dbInputContainer
                                                    }
                                                >
                                                    {dbFetching ? (
                                                        <ActivityIndicator />
                                                    ) : (
                                                        <TextInput
                                                            editable={false}
                                                            placeholder="Select Database"
                                                            placeholderTextColor="#999"
                                                        >
                                                            {selectedDb}
                                                        </TextInput>
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
                                                            style={
                                                                styles.dropdownItem
                                                            }
                                                            onPress={() => {
                                                                setSelectedDb(
                                                                    db
                                                                );
                                                                setDbDropdownVisible(
                                                                    false
                                                                );
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

                                    {databases.length > 0 && selectedDb && (
                                        <View style={styles.successBox}>
                                            <Feather
                                                name="check-circle"
                                                size={18}
                                                color="#1e7f3c"
                                            />
                                            <Text style={styles.successText}>
                                                Domain is active and database
                                                selected
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ marginTop: 12 }}>
                                    <View
                                        style={{
                                            height: 1,
                                            width: "100%",
                                            backgroundColor: "#696969",
                                        }}
                                    />
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: "#696969",
                                            width: 140,
                                            alignSelf: "center",
                                            backgroundColor: "#EFF2FF",
                                            paddingHorizontal: 8,
                                            position: "absolute",
                                            top: -18,
                                        }}
                                    >
                                        Need log info for a different domain?
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.domainLogsBtn}
                                    onPress={() =>
                                        bottomSheetRef.current?.expand()
                                    }
                                    activeOpacity={0.6}
                                >
                                    <AntDesign
                                        name="unordered-list"
                                        size={20}
                                        color="#000783"
                                    />
                                    <Text style={styles.domainLogsText}>
                                        Domain Logs
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {databases.length > 0 && selectedDb && (
                                <Pressable
                                    onPress={() => setShowLoginPanel(true)}
                                    style={({ pressed }) => [
                                        styles.nextButton,
                                        pressed && styles.loginButtonPressed,
                                    ]}
                                >
                                    <Text style={styles.loginButtonText}>
                                        Next
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    ) : (
                        <>
                            {/* LOGIN CARD */}
                            <View
                                style={[
                                    styles.card,
                                    { backgroundColor: "#FFFF" },
                                ]}
                            >
                                <View
                                    style={{
                                        padding: 16,
                                        gap: 16,
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.cardTitle,
                                            { textAlign: "center" },
                                        ]}
                                    >
                                        Login Panel
                                    </Text>

                                    <TextInput
                                        style={styles.textInputStyle}
                                        placeholder="User ID"
                                        placeholderTextColor="#999"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        // keyboardType="email-address"
                                    />

                                    <View style={styles.passwordBox}>
                                        <TextInput
                                            style={{
                                                flex: 1,
                                                paddingVertical: 8,
                                            }}
                                            placeholder="Password"
                                            placeholderTextColor="#999"
                                            secureTextEntry={!isPasswordVisible}
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                        <TouchableOpacity
                                            onPress={() =>
                                                setIsPasswordVisible(
                                                    !isPasswordVisible
                                                )
                                            }
                                        >
                                            <Feather
                                                name={
                                                    isPasswordVisible
                                                        ? "eye-off"
                                                        : "eye"
                                                }
                                                size={18}
                                                color="#666"
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <Pressable
                                        onPress={handleLogin}
                                        disabled={
                                            loading || !email || !password
                                        }
                                        style={({ pressed }) => [
                                            styles.loginButton,
                                            pressed &&
                                                styles.loginButtonPressed,
                                            loading &&
                                                styles.loginButtonDisabled,
                                        ]}
                                    >
                                        <MaterialIcons
                                            name="login"
                                            size={24}
                                            color="#fff"
                                        />
                                        <Text style={styles.loginButtonText}>
                                            {loading
                                                ? "Logging in..."
                                                : "Login"}
                                        </Text>
                                    </Pressable>
                                </View>

                                <View style={{ marginTop: 12 }}>
                                    <View
                                        style={{
                                            height: 1,
                                            width: "100%",
                                            backgroundColor: "#696969",
                                        }}
                                    />
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: "#696969",
                                            width: 140,
                                            alignSelf: "center",
                                            backgroundColor: "#FFF",
                                            paddingHorizontal: 8,
                                            position: "absolute",
                                            top: -18,
                                        }}
                                    >
                                        Need log info for a different domain?
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.domainLogsBtn}
                                    onPress={() =>
                                        bottomSheetRef.current?.expand()
                                    }
                                    activeOpacity={0.6}
                                >
                                    <AntDesign
                                        name="unordered-list"
                                        size={20}
                                        color="#000783"
                                    />
                                    <Text style={styles.domainLogsText}>
                                        Domain Logs
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <Pressable
                                onPress={() => setShowLoginPanel(false)}
                                style={({ pressed }) => [
                                    styles.backButton,
                                    pressed && styles.loginButtonPressed,
                                ]}
                            >
                                <Feather
                                    name="arrow-left"
                                    size={20}
                                    color="white"
                                />
                                <Text style={styles.loginButtonText}>Back</Text>
                            </Pressable>
                        </>
                    )}
                </ScrollView>
                {/* <Text style={styles.footerText}>@Daffodil Group</Text> */}
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
    container: {
        flex: 1,
        backgroundColor: "#f0f2f5", // A light grey background
    },
    header: {
        height: Platform.OS === "ios" ? 180 : 160,
        paddingVertical: 40,
        alignItems: "center",
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
        backgroundColor: "#000783",
        position: "relative",
        paddingTop: Platform.OS === "ios" ? 70 : 40,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        borderWidth: 6,
        borderColor: "#000783",
        zIndex: 20,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingTop: 50,
        paddingBottom: 20,
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    inputContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
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
    nextButton: {
        backgroundColor: "#000783",
        height: 40,
        width: 140,
        alignSelf: "center",
        borderRadius: 6,
        flexDirection: "row",
        marginTop: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    loginButton: {
        backgroundColor: "#000783",
        height: 44,
        borderRadius: 8,
        flexDirection: "row",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    loginButtonPressed: {
        backgroundColor: "#00056a", // A slightly darker shade for the pressed state
    },
    loginButtonDisabled: {
        backgroundColor: "#a9b0e0", // Lighter, disabled version of the main color
    },
    loginButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    backButton: {
        backgroundColor: "#000783",
        height: 40,
        width: 140,
        alignSelf: "center",
        borderRadius: 6,
        flexDirection: "row",
        gap: 8,
        marginTop: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    domainLogsBtn: {
        margin: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#000783",
        paddingVertical: 8,
        borderRadius: 8,
        width: 150,
        alignSelf: "center",
    },
    domainLogsText: {
        color: "#000783",
        fontWeight: "600",
    },
    footerText: {
        textAlign: "center",
        color: "#696969",
        paddingVertical: 4,
    },
});

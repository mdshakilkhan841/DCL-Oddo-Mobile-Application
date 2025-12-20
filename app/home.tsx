import SessionModal from "@/components/SessionModal";
import { useSessionHandler } from "@/hooks/useSessionHandler";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const HomeScreen = () => {
    const { baseUrl } = useLocalSearchParams<{ baseUrl: string }>();
    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const { handleSelectSession } = useSessionHandler({
        bottomSheetRef,
    });

    // 🔙 Android hardware back handling
    useEffect(() => {
        const onBackPress = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };

        const sub = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
        );

        return () => sub.remove();
    }, [canGoBack]);

    if (!baseUrl) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar style="auto" />
                    <Stack.Screen
                        options={{
                            headerRight: () => (
                                <TouchableOpacity
                                    onPress={() =>
                                        setIsModalVisible(!isModalVisible)
                                    }
                                    style={{
                                        width: 40,
                                        height: 30,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                    activeOpacity={0.6}
                                >
                                    <AntDesign
                                        name="appstore"
                                        size={24}
                                        color="black"
                                    />
                                </TouchableOpacity>
                            ),
                        }}
                    />

                    {/* 🔝 Custom Header */}
                    {/* <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => {
                            if (canGoBack && webViewRef.current) {
                                webViewRef.current.goBack();
                            } else {
                                router.back();
                            }
                        }}
                    >
                        <Feather name="arrow-left" size={22} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Odoo</Text>
                </View> */}

                    {/* 🔄 Progress Bar */}
                    {progress < 1 && (
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${progress * 100}%` },
                                ]}
                            />
                        </View>
                    )}

                    <WebView
                        ref={webViewRef}
                        source={{ uri: baseUrl }}
                        startInLoadingState
                        renderLoading={() => (
                            <ActivityIndicator style={{ marginTop: 20 }} />
                        )}
                        sharedCookiesEnabled
                        thirdPartyCookiesEnabled
                        onNavigationStateChange={(navState) => {
                            setCanGoBack(navState.canGoBack);
                        }}
                        onLoadProgress={({ nativeEvent }) => {
                            setProgress(nativeEvent.progress);
                        }}
                    />

                    {/* Dropdown for App Options */}
                    {isModalVisible && (
                        <>
                            <TouchableOpacity
                                style={styles.dropdownOverlay}
                                onPress={() => setIsModalVisible(false)}
                                activeOpacity={1}
                            />
                            <View style={styles.dropdownContainer}>
                                <View style={styles.dropdownContent}>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            router.push("/sign-in");
                                        }}
                                        activeOpacity={0.6}
                                    >
                                        <MaterialIcons
                                            name="login"
                                            size={24}
                                            color="#000783"
                                        />
                                        <Text style={styles.dropdownButtonText}>
                                            Sign In
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() =>
                                            bottomSheetRef.current?.expand()
                                        }
                                        activeOpacity={0.6}
                                    >
                                        <Feather
                                            name="server"
                                            size={24}
                                            color="#000783"
                                        />

                                        <Text style={styles.dropdownButtonText}>
                                            Existing Logs
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}

                    <SessionModal
                        bottomSheetRef={bottomSheetRef}
                        onSelectSession={handleSelectSession}
                    />
                </SafeAreaView>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    absolute: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: "#fff",
    },
    backBtn: {
        padding: 6,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    progressBar: {
        height: 2,
        backgroundColor: "#e0e0e0",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#000783",
    },
    dropdownOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "transparent",
        zIndex: 999,
    },
    dropdownContainer: {
        position: "absolute",
        top: 0,
        right: 10,
        zIndex: 1000,
    },
    dropdownContent: {
        borderRadius: 8,
        padding: 12,
        minWidth: 220,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: "#ddddddff",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
    },
    dropdownButton: {
        alignItems: "center",
        gap: 6,
        padding: 6,
    },
    dropdownButtonText: {
        fontSize: 14,
        marginLeft: 10,
        color: "#000783",
        fontWeight: "600",
    },
});

export default HomeScreen;

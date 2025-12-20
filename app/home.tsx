import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const HomeScreen = () => {
    const { baseUrl } = useLocalSearchParams<{ baseUrl: string }>();

    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        const onBackPress = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true; // ⛔ stop router back
            }
            return false; // ✅ allow router back
        };

        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
        );

        return () => {
            subscription.remove();
        };
    }, [canGoBack]);

    if (!baseUrl) return null;

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar style="auto" />

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
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default HomeScreen;

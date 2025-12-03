import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const HomeScreen = () => {
    const { baseUrl } = useLocalSearchParams<{ baseUrl: string }>();

    if (!baseUrl) return null;

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar style="auto" />
                <WebView
                    source={{ uri: `${baseUrl}/web` }}
                    startInLoadingState
                    renderLoading={() => (
                        <ActivityIndicator style={{ marginTop: 20 }} />
                    )}
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
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

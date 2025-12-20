import { Session, useSessionStore } from "@/store/sessionStore";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

interface SessionModalProps {
    bottomSheetRef: React.Ref<BottomSheet>;
    onSelectSession: (session: Session) => void;
}

const SessionModal = ({
    bottomSheetRef,
    onSelectSession,
}: SessionModalProps) => {
    const sessions = useSessionStore((state) => state.sessions);
    const removeSession = useSessionStore((state) => state.removeSession);
    const snapPoints = useMemo(() => ["50%", "75%"], []);

    const handleLogout = (session: Session) => {
        Alert.alert(
            "Logout Session",
            `Are you sure you want to logout from ${session.domain}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: () => removeSession(session.domain),
                },
            ]
        );
    };

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1} // Start closed
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={styles.bottomSheetBackground}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Existing Sessions</Text>
            </View>
            <BottomSheetScrollView
                contentContainerStyle={styles.contentContainer}
            >
                {sessions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No saved sessions found.
                        </Text>
                    </View>
                ) : (
                    sessions.map((session) => (
                        <View key={session.domain} style={styles.sessionItem}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.sessionContent,
                                    pressed && styles.itemPressed,
                                ]}
                                onPress={() => onSelectSession(session)}
                            >
                                <Feather
                                    name="server"
                                    size={24}
                                    color="#2c3e50"
                                />
                                <View style={styles.sessionInfo}>
                                    <Text style={styles.sessionDomain}>
                                        {session.domain}
                                    </Text>
                                    <Text style={styles.sessionEmail}>
                                        {session.email}
                                    </Text>
                                </View>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.logoutButton,
                                    pressed && styles.logoutButtonPressed,
                                ]}
                                onPress={() => handleLogout(session)}
                            >
                                <MaterialIcons
                                    name="logout"
                                    size={20}
                                    color="#dc3545"
                                />
                            </Pressable>
                        </View>
                    ))
                )}
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: "#f8f9fa",
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#dee2e6",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#343a40",
    },
    contentContainer: {
        padding: 16,
    },
    sessionItem: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e9ecef",
        overflow: "hidden",
    },
    sessionContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        flex: 1,
    },
    itemPressed: {
        backgroundColor: "#f1f3f5",
    },
    logoutButton: {
        width: 50,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        borderLeftWidth: 1,
        borderLeftColor: "#e9ecef",
    },
    logoutButtonPressed: {
        backgroundColor: "#f8d7da",
    },
    sessionInfo: {
        marginLeft: 15,
    },
    sessionDomain: {
        fontSize: 16,
        fontWeight: "600",
        color: "#212529",
    },
    sessionEmail: {
        fontSize: 14,
        color: "#6c757d",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: "#6c757d",
    },
});

export default SessionModal;

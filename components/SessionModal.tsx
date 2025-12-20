import { Session, useSessionStore } from "@/store/sessionStore";
import { Feather } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SessionModalProps {
    bottomSheetRef: React.Ref<BottomSheet>;
    onSelectSession: (session: Session) => void;
}

const SessionModal = ({
    bottomSheetRef,
    onSelectSession,
}: SessionModalProps) => {
    const sessions = useSessionStore((state) => state.sessions);
    const snapPoints = useMemo(() => ["50%", "75%"], []);

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
                        <Pressable
                            key={session.domain}
                            style={({ pressed }) => [
                                styles.sessionItem,
                                pressed && styles.itemPressed,
                            ]}
                            onPress={() => onSelectSession(session)}
                        >
                            <Feather name="server" size={24} color="#2c3e50" />
                            <View style={styles.sessionInfo}>
                                <Text style={styles.sessionDomain}>
                                    {session.domain}
                                </Text>
                                <Text style={styles.sessionEmail}>
                                    {session.email}
                                </Text>
                            </View>
                        </Pressable>
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
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e9ecef",
    },
    itemPressed: {
        backgroundColor: "#f1f3f5",
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

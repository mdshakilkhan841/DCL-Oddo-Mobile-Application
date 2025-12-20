import { useDomainStore } from "@/store/domainStore";
import { Session } from "@/store/sessionStore";
import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { Alert } from "react-native";

interface UseSessionHandlerProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    setLoading?: (loading: boolean) => void;
}

export const useSessionHandler = ({
    bottomSheetRef,
    setLoading,
}: UseSessionHandlerProps) => {
    const { setDomain, setDatabases, setSelectedDb, saveToStorage } =
        useDomainStore();
    const navigateToHome = (baseUrl: string) => {
        router.replace({
            pathname: "/home",
            params: { baseUrl },
        });
    };

    const handleSelectSession = async (session: Session) => {
        try {
            setLoading?.(true);
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
            setLoading?.(false);
        }
    };

    return {
        handleSelectSession,
    };
};

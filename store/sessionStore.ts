import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

export interface Session {
    domain: string;
    email: string;
    user_id: string;
    sessionId: string;
    baseUrl: string;
}

interface SessionState {
    sessions: Session[];
    addSession: (session: Session) => void;
}

const secureStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await SecureStore.deleteItemAsync(name);
    },
};

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            sessions: [],
            addSession: (session) =>
                set((state) => ({
                    sessions: [
                        ...state.sessions.filter(
                            (s) => s.domain !== session.domain
                        ),
                        session,
                    ],
                })),
        }),
        {
            name: "session-storage",
            storage: createJSONStorage(() => secureStorage),
        }
    )
);

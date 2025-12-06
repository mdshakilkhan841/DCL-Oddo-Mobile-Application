import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

interface DomainState {
    domain: string;
    databases: string[];
    selectedDb: string | null;

    setDomain: (d: string) => void;
    setDatabases: (list: string[]) => void;
    setSelectedDb: (db: string | null) => void;

    loadStoredData: () => Promise<void>;
    saveToStorage: () => Promise<void>;
}

export const useDomainStore = create<DomainState>((set, get) => ({
    domain: "",
    databases: [],
    selectedDb: null,

    setDomain: (d) => set({ domain: d }),
    setDatabases: (list) => set({ databases: list }),
    setSelectedDb: (db) => set({ selectedDb: db }),

    loadStoredData: async () => {
        try {
            const raw = await SecureStore.getItemAsync("domain-data");
            if (!raw) return;

            const parsed = JSON.parse(raw);

            set({
                domain: parsed.domain || "",
                databases: parsed.databases || [],
                selectedDb: parsed.selectedDb || null,
            });
        } catch (e) {
            console.log("SecureStore Load Error:", e);
        }
    },

    saveToStorage: async () => {
        try {
            const { domain, databases, selectedDb } = get();
            await SecureStore.setItemAsync(
                "domain-data",
                JSON.stringify({ domain, databases, selectedDb })
            );
        } catch (e) {
            console.log("SecureStore Save Error:", e);
        }
    },
}));

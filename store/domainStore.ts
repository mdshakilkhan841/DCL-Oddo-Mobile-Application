import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

interface DomainState {
    domain: string;
    databases: string[];
    selectedDb: string | null;
    domainMappings: Record<string, string>;

    setDomain: (d: string) => void;
    setDatabases: (list: string[]) => void;
    setSelectedDb: (db: string | null) => void;
    setDomainMapping: (original: string, working: string) => void;

    loadStoredData: () => Promise<void>;
    saveToStorage: () => Promise<void>;
    getWorkingDomain: (inputDomain: string) => Promise<string>;
}

export const useDomainStore = create<DomainState>((set, get) => ({
    domain: "",
    databases: [],
    selectedDb: null,
    domainMappings: {},

    setDomain: (d) => set({ domain: d }),
    setDatabases: (list) => set({ databases: list }),
    setSelectedDb: (db) => set({ selectedDb: db }),
    setDomainMapping: (original, working) => {
        const current = get().domainMappings;
        set({ domainMappings: { ...current, [original]: working } });
    },

    loadStoredData: async () => {
        try {
            const raw = await SecureStore.getItemAsync("domain-data");
            if (!raw) return;

            const parsed = JSON.parse(raw);

            // Handle both old and new storage formats for backward compatibility
            set({
                domain: parsed.domain || "",
                databases: parsed.databases || [],
                selectedDb: parsed.selectedDb || null,
                domainMappings:
                    parsed.domainMappings || parsed.successfulDomains || {},
            });
        } catch (e) {
            console.log("SecureStore Load Error:", e);
        }
    },

    saveToStorage: async () => {
        try {
            const { domain, databases, selectedDb, domainMappings } = get();
            await SecureStore.setItemAsync(
                "domain-data",
                JSON.stringify({
                    domain,
                    databases,
                    selectedDb,
                    domainMappings,
                })
            );
        } catch (e) {
            console.log("SecureStore Save Error:", e);
        }
    },

    getWorkingDomain: async (inputDomain) => {
        const { domainMappings } = get();

        // Check if we already know the working version of this domain
        if (domainMappings[inputDomain]) {
            return domainMappings[inputDomain];
        }

        // Try the domain as-is first
        try {
            const testUrl = `https://${inputDomain}/web/database/list`;
            const response = await fetch(testUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {},
                }),
            });

            if (response.ok) {
                // If successful, save this mapping
                get().setDomainMapping(inputDomain, inputDomain);
                await get().saveToStorage();
                return inputDomain;
            }
        } catch (error) {
            console.log(`Domain test failed for ${inputDomain}:`, error);
        }

        // If the original domain failed, try with www. prefix
        if (!inputDomain.startsWith("www.")) {
            const wwwDomain = `www.${inputDomain}`;
            try {
                const testUrl = `https://${wwwDomain}/web/database/list`;
                const response = await fetch(testUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "call",
                        params: {},
                    }),
                });

                if (response.ok) {
                    // If successful with www, save this mapping
                    get().setDomainMapping(inputDomain, wwwDomain);
                    await get().saveToStorage();
                    return wwwDomain;
                }
            } catch (error) {
                console.log(
                    `Domain test failed for www.${inputDomain}:`,
                    error
                );
            }
        }

        // If the original domain had www. and failed, try without www.
        if (inputDomain.startsWith("www.")) {
            const noWwwDomain = inputDomain.substring(4);
            try {
                const testUrl = `https://${noWwwDomain}/web/database/list`;
                const response = await fetch(testUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "call",
                        params: {},
                    }),
                });

                if (response.ok) {
                    // If successful without www, save this mapping
                    get().setDomainMapping(inputDomain, noWwwDomain);
                    await get().saveToStorage();
                    return noWwwDomain;
                }
            } catch (error) {
                console.log(`Domain test failed for ${noWwwDomain}:`, error);
            }
        }

        // If all attempts failed, return the original domain
        // This will let the calling function handle the error
        return inputDomain;
    },
}));

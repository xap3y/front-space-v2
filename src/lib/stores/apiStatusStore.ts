import { create } from "zustand";

type ApiStatusStore = {
    isApiUp: boolean;
    backendVersion: string | null;
    setApiStatus: (isApiUp: boolean, backendVersion?: string | null) => void;
};

const useStore = create<ApiStatusStore>((set) => ({
    isApiUp: true,
    backendVersion: null,
    setApiStatus: (isApiUp, backendVersion = null) => set({ isApiUp, backendVersion }),
}));

export const useApiStatusStore = useStore;

import { create } from "zustand";

type ApiStatusStore = {
    isApiUp: boolean;
    setIsApiUp: (status: boolean) => void;
};

const useStore = create<ApiStatusStore>((set) => ({
    isApiUp: false,
    setIsApiUp: (status) => set({ isApiUp: status }),
}));

export const useApiStatusStore = () => useStore();
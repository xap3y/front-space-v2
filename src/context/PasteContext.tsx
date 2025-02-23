'use client';
import { createContext, useContext, useState } from 'react';
import {PasteDto} from "@/types/paste";

const PasteContext = createContext<{
    paste: PasteDto | null;
    setPaste: (paste: PasteDto | null) => void;
}>({
    paste: null,
    setPaste: () => {},
});

export const PasteProvider = ({ children }: { children: React.ReactNode }) => {
    const [paste, setPaste] = useState<PasteDto | null>(null);

    return (
        <PasteContext.Provider value={{ paste, setPaste }}>
            {children}
        </PasteContext.Provider>
    );
};

export const usePaste = () => useContext(PasteContext);
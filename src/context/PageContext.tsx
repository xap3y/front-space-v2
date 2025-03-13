'use client';
import { createContext, useContext, useState } from 'react';
import {PasteDto} from "@/types/paste";

const PageContext = createContext<{
    pageName: string | null;
    setPage: (page: string | null) => void;
}>({
    pageName: null,
    setPage: () => {},
});

export const PageProvider = ({ children }: { children: React.ReactNode }) => {
    const [pageName, setPage] = useState<string | null>(null);

    return (
        <PageContext.Provider value={{ pageName, setPage }}>
            {children}
        </PageContext.Provider>
    );
};

export const usePage = () => useContext(PageContext);
'use client';
import { createContext, useContext, useState } from 'react';
import {UserObj} from "@/types/user";

const UserContext = createContext<{
    user: UserObj | null;
    setUser: (user: UserObj | null) => void;
}>({
    user: null,
    setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserObj | null>(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
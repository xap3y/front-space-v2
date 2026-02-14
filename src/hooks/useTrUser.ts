import { useState, useEffect } from "react";
import {getTrUser} from "@/lib/auth";
import {TrUserObj} from "@/types/user";

export function useTrUser() {
    const [user, setUser] = useState<TrUserObj | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user: TrUserObj | null = await getTrUser();
                if (!user) {
                    setError("TrUser not found.");
                    setUser(null);
                    return;
                }
                setUser(user);
            } catch (err) {
                console.error("Failed to fetch tr user:", err);
                setError("Failed to fetch user data.");
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUser();
    }, []);

    return { user, loadingUser, error };
}
import { useState, useEffect } from "react";
import {getTrUser} from "@/lib/auth";
import {TrUserObj} from "@/types/user";

export function useTrUser() {
    const [user, setUser] = useState<TrUserObj | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchUser = async () => {
            setLoadingUser(true); // Ensure it starts in loading state
            try {
                const userData = await getTrUser();
                if (!isMounted) return;

                if (!userData) {
                    setError("TrUser not found.");
                    setUser(null);
                } else {
                    setUser(userData);
                }
            } catch (err) {
                if (!isMounted) return;
                console.error("Failed to fetch tr user:", err);
                setError("Failed to fetch user data.");
            } finally {
                if (isMounted) setLoadingUser(false);
            }
        };

        fetchUser();
        return () => { isMounted = false; };
    }, []); // Empty array is fine, but ensure it's not being unmounted by the parent

    return { user, loadingUser, error };
}
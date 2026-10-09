import { useState, useEffect } from "react";
import {getUser} from "@/lib/auth";
import {UserObj} from "@/types/user";

export function useUser() {
    const [user, setUser] = useState<UserObj | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const fetchUser = async () => {
            try {
                const user: UserObj | null = await getUser();
                if (!active) {
                    return;
                }
                if (!user) {
                    setError("User not found.");
                    setUser(null);
                    return;
                }
                setUser(user);
            } catch (err) {
                if (!active) {
                    return;
                }
                console.error("Failed to fetch user:", err);
                setError("Failed to fetch user data.");
            } finally {
                if (active) {
                    setLoadingUser(false);
                }
            }
        };

        fetchUser();
        return () => {
            active = false;
        };
    }, []);

    return { user, loadingUser, error };
}

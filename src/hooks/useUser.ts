import { useState, useEffect } from "react";
import {getUser} from "@/lib/auth";
import {UserObj} from "@/types/user";

export function useUser() {
    const [user, setUser] = useState<UserObj | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user: UserObj | null = await getUser();
                setUser(user);
            } catch (err) {
                console.error("Failed to fetch user:", err);
                setError("Failed to fetch user data.");
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUser();
    }, []);

    return { user, loadingUser, error };
}
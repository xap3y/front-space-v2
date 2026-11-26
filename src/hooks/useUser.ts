import { useState, useEffect } from "react";
import {getUser} from "@/lib/auth";
import type {UserObj} from "@/types/user";

const avatarUpdatedEvent = "space:avatar-updated";

type AvatarUpdate = {uid: UserObj["uid"]; avatar: string};

export function publishAvatarUpdate(update: AvatarUpdate) {
    window.dispatchEvent(new CustomEvent<AvatarUpdate>(avatarUpdatedEvent, {detail: update}));
}

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

        const applyAvatarUpdate = (event: Event) => {
            const {uid, avatar} = (event as CustomEvent<AvatarUpdate>).detail;
            setUser(current => current && current.uid === uid ? {...current, avatar} : current);
        };

        window.addEventListener(avatarUpdatedEvent, applyAvatarUpdate);
        fetchUser();
        return () => {
            active = false;
            window.removeEventListener(avatarUpdatedEvent, applyAvatarUpdate);
        };
    }, []);

    return { user, loadingUser, error };
}

'use client';

import {getUserApi} from "@/lib/apiGetters";
import {notFound, useParams} from "next/navigation";
import {UserProfile} from "@/components/UserProfile";
import { useUser } from '@/context/UserContext';
import {useEffect, useState} from "react";
import NotFound from "next/dist/client/components/not-found-error";
import LoadingPage from "@/components/LoadingPage";
import {UserObj} from "@/types/user";

export default function Page() {

    const { username } = useParams();
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const user2: UserObj | null = await getUserApi(username + "");
            setUser(user2);
            setLoading(false)
        };

        if (!user) {
            fetchUser();
        } else {
            setLoading(false)
        }
    }, [username, user, setUser]);

    return (
        <>
            {loading && (
                <LoadingPage/>
            )}

            {(!user && !loading) && (
                <NotFound/>
            )}

            {user && (
                <div className="min-h-screen flex items-center justify-center bg-dark-grey2">
                    <UserProfile user={user} />
                </div>
            )}
        </>
    )
}
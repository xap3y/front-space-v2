'use client';

import {getUserApi} from "@/lib/apiGetters";
import {notFound, useParams} from "next/navigation";
import {UserProfile} from "@/components/UserProfile";
import { useUser } from '@/context/UserContext';
import {useEffect, useState} from "react";
import LoadingPage from "@/components/LoadingPage";
import {UserObj} from "@/types/user";
import {DefaultResponse} from "@/types/core";
import {useIsMobile} from "@/hooks/utils";
import {useHoverCard} from "@/hooks/useHoverCard";
import "@/app/debug.css"

export default function Page() {

    const { username } = useParams();
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const user2: DefaultResponse = await getUserApi(username + "");
            setUser(user2.data as UserObj);
            setLoading(false)
        };

        console.log(username)
        //console.log(user)

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
                notFound()
            )}

            {user && (
                <div className="min-h-screen overflow-y-hidden flex items-center justify-center bg-dark-grey2">
                    <UserProfile user={user} />
                </div>
            )}
        </>
    )
}
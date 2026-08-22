"use client";

import {useUser} from "@/hooks/useUser";
import AuthenticatedPageNav from "@/components/AuthenticatedPageNav";

export default function AuthenticatedPageNavClient() {
    const {user, loadingUser} = useUser();
    if (loadingUser || !user) return null;
    return <AuthenticatedPageNav />;
}

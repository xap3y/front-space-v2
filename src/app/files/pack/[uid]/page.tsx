import {PackPageClient} from "@/app/files/pack/[uid]/client";
import {getUserServer} from "@/app/_server/getUser";
import AuthenticatedPageNav from "@/components/AuthenticatedPageNav";


export default async function PackPage() {
    const user = await getUserServer();
    return (
        <>
            {user && <AuthenticatedPageNav />}
            <PackPageClient />
        </>
    )
}

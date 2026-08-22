import {FilesPageClient} from "@/app/files/client";
import {getUserServer} from "@/app/_server/getUser";
import AuthenticatedPageNav from "@/components/AuthenticatedPageNav";


export default async function FilesPage() {
    const user = await getUserServer();
    return (
        <>
            {user && <AuthenticatedPageNav />}
            <FilesPageClient />
        </>
    )
}

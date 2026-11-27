import type {Metadata} from "next";
import {PreviewLayout} from "../preview-layout";
import ProfilePreviews from "./previews";

export const metadata: Metadata = {title: "Profilové menu / Space", robots: {index: false, follow: false}};

export default function ProfileDesignPage() {
    return (
        <PreviewLayout section="/design/profile" description="Tři varianty menu účtu. Profil je vždy nejblíž spouštěči a odhlášení má vlastní oddělené místo.">
            <ProfilePreviews />
        </PreviewLayout>
    );
}

import type {Metadata} from "next";
import AlbumsPageClient from "@/app/home/albums/client";

export const metadata: Metadata = {
    title: "Space - Home (albums)",
};

export default function Page() {
    return <AlbumsPageClient/>;
}

import type {Metadata} from "next";
import AlbumManageClient from "@/app/home/albums/[uid]/client";

export const metadata: Metadata = {
    title: "Space - Home (album)",
};

export default function Page() {
    return <AlbumManageClient/>;
}

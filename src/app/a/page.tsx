import UrlShortener from "@/app/a/url/client";
import {NestedLinktree} from "@/components/NestedLinktree";

export default async function Page() {
    return (
        <>

            <h1>Portable</h1>
            <NestedLinktree links={
                [
                    {
                        label: "Url",
                        href: "/a/url"
                    },
                    {
                        label: "Paste",
                        href: "/a/paste"
                    },
                    {
                        label: "Image",
                        href: "/a/image"
                    },
                    {
                        label: "Mail",
                        href: "/a/mail"
                    }
                ]
            } />
        </>
    )
}
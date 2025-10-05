import {NestedLinktree} from "@/components/NestedLinktree";

export default async function Page() {
    return (
        <>

            <h1>Legal</h1>
            <NestedLinktree links={
                [
                    {
                        label: "privacy",
                        href: "/legal/privacy"
                    },
                    {
                        label: "Terms of Service",
                        href: "/legal/terms"
                    }
                ]
            } />
        </>
    )
}
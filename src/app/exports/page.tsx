import {NestedLinktree} from "@/components/NestedLinktree";

export default async function Page() {
    return (
        <>
            <h1>Exports</h1>
            <NestedLinktree links={
                [
                    {
                        label: "Languages",
                        href: "/exports/languages"
                    },
                    {
                        label: "Quotes",
                        href: "/exports/quotes"
                    },
                    {
                        label: "User",
                        href: "/exports/user"
                    }
                ]
            } />
        </>
    )
}
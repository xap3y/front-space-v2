import {LinkItem, LinkTreeProps} from "@/types/core";


export const dashLinkTree: LinkItem[] = [
    {
        label: "User card",
        href: "/my-profile"
    },
    {
        label: "Create URL",
        href: "/a/url"
    },
    {
        label: "API-Docs",
        href: "/docs"
    },
    {
        label: "Finders",
        href: "",
        links: [
            {
                label: "Find Image",
                href: "/i"
            },
            {
                label: "Find Paste",
                href: "/p"
            },
            {
                label: "Find User",
                href: "/user"
            }
        ]
    },
    {
        label: "Logout",
        href: "/logout"
    },
] as LinkItem[];
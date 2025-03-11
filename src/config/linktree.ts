import {LinkItem, LinkTreeProps} from "@/types/core";

export const linktree: LinkItem[] = [
    {
        label: "This site",
        href: "/",
        links: [
            {
                label: "Login",
                href: "/login"
            },
            {
                label: "Register",
                href: "/register"
            },
            {
                label: "Home",
                href: "/home",
                links: [
                    {
                        label: "Dashboard",
                        href: "/home/dashboard"
                    },
                    {
                        label: "Gallery",
                        href: "/home/gallery"
                    },
                    {
                        label: "Pastes",
                        href: "/home/pastes"
                    },
                    {
                        label: "Short URLs",
                        href: "/home/short-urls"
                    }
                ]
            },
            {
                label: "Invalidate cookies",
                href: "/logout"
            },
            {
                label: "Status",
                href: "/status"
            },
            {
                label: "Profile",
                href: "/profile"
            },
            {
                label: "Loading page (for testing)",
                href: "/loading-page"
            },
            {
                label: "Portable",
                href: "/a",
                links: [
                    {
                        label: "Paste",
                        href: "/a/paste"
                    },
                    {
                        label: "Shortener",
                        href: "/a/url"
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
            },
            {
                label: "User",
                href: "/user",
                links: [
                    {
                        label: "null",
                        href: "/user/-1"
                    }
                ]
            },
            {
                label: "Display",
                href: "",
                links: [
                    {
                        label: "Paste",
                        href: "/paste"
                    },
                    {
                        label: "Image",
                        href: "/i"
                    }
                ]
            },
        ]
    },
    {
        label: "API DOCS",
        href: "/docs"
    },
    {
        label: "API #1",
        href: "https://call.xap3y.tech",
        links: [
            {
                label: "Image-upload (WEB)",
                href: "https://call.xap3y.tech/web/image-upload",
            },
            {
                label: "Image-render (WEB)",
                href: "https://call.xap3y.tech/web/image-render"
            },
            {
                label: "Paste-create (WEB)",
                href: "https://call.xap3y.tech/web/paste-create",
            },
            {
                label: "Short URL (WEB)",
                href: "https://call.xap3y.tech/web/url-create",
            },
            {
                label: "Metrics (JSON)",
                href: "https://call.xap3y.tech/metrics"
            },
            {
                label: "Redirect-image",
                href: "https://i.xap3y.tech/"
            },
            {
                label: "Redirect-paste",
                href: "https://p.xap3y.tech/"
            },
            {
                label: "Redirect-url",
                href: "https://r.xap3y.tech/"
            }
        ]
    },
    {
        label: "API #2 (OFFLINE)",
        href: "https://api.xap3y.tech",
        links: [
            {
                label: "Redirect-image",
                href: "https://i0.xap3y.tech/"
            },
            {
                label: "Redirect-paste",
                href: "https://p0.xap3y.tech/"
            },
            {
                label: "Redirect-url",
                href: "https://r0.xap3y.tech/"
            }
        ]
    },
    {
        label: "API #3 (OFFLINE)",
        href: "https://ext.space.xap3y.tech",
        links: [
            {
                label: "Redirect-image",
                href: "https://i1.xap3y.tech/"
            },
            {
                label: "Redirect-paste",
                href: "https://p1.xap3y.tech/"
            },
            {
                label: "Redirect-url",
                href: "https://r1.xap3y.tech/"
            }
        ]
    },
    {
        label: "XAP3Y's space v1",
        href: "https://s.xap3y.tech/login"
    },
    {
        label: "XAP3Y's space v2",
        href: "https://ext.space-front.xap3y.tech"
    },
] as LinkItem[];
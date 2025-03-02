export interface LinkItem {
    label: string;
    href: string;
    links?: LinkItem[];
}

export interface LinkTreeProps {
    links: LinkItem[];
    depth?: number;
}

export interface UrlSet {
    webUrl: string;
    portalUrl: string;
    rawUrl: string;
    shortUrl?: string | null;
    customUrl?: string | null;
    custom?: Map<string, string> | null;
}

export interface Quote {
    text: string;
    author?: string | null;
}
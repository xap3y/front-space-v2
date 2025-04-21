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

export interface FunFact {
    text: string;
}

export interface Sidebar {
    title: string;
    href: string;
    icon: React.ReactNode;
    permission?: string;
    page: string;
}

export interface PairType {
    first: string;
    second: number
}

export interface DefaultResponse {
    error: boolean;
    message: any;
    timestamp: string;
    data?: any;
}
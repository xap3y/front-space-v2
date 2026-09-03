import type {Metadata} from "next";
import DnsLookupClient from "./client";

export const metadata: Metadata = {title: "Space - DNS Lookup"};

export default function DnsLookupPage() {
    return <DnsLookupClient/>;
}

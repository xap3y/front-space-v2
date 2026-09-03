import type {Metadata} from "next";
import EmailHealthClient from "./client";
export const metadata: Metadata = {title: "Space - Email Health"};
export default function EmailHealthPage() { return <EmailHealthClient/>; }

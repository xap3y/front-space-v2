import type {Metadata} from "next";
import QrToolkitClient from "./client";
export const metadata: Metadata = {title: "Space - QR Toolkit"};
export default function Page() { return <QrToolkitClient/>; }

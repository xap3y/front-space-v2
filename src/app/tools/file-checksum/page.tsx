import type {Metadata} from "next";
import FileChecksumClient from "./client";
export const metadata: Metadata = {title:"Space - File Checksum"};
export default function Page(){return <FileChecksumClient/>}

import type {Metadata} from "next";
import TimestampLabClient from "./client";
export const metadata: Metadata = {title:"Space - Timestamp Laboratory"};
export default function Page(){return <TimestampLabClient/>}

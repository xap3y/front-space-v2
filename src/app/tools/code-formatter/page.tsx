import type {Metadata} from "next";
import CodeFormatterClient from "./client";
export const metadata: Metadata = {title: "Space - Code Formatter"};
export default function Page(){return <CodeFormatterClient/>}

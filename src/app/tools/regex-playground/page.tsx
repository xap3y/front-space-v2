import type {Metadata} from "next";
import RegexPlaygroundClient from "./client";
export const metadata: Metadata = {title:"Space - Regex Playground"};
export default function Page(){return <RegexPlaygroundClient/>}

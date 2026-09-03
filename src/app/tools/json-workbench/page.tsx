import type {Metadata} from "next";
import JsonWorkbenchClient from "./client";
export const metadata: Metadata = {title: "Space - JSON Workbench"};
export default function Page() { return <JsonWorkbenchClient/>; }

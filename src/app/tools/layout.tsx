import type {ReactNode} from "react";
import ToolsShell from "@/app/tools/ToolsShell";

export default function ToolsLayour({ children }: { children: ReactNode }) {
    return <ToolsShell>{children}</ToolsShell>;
}
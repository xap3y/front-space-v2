import type { Metadata } from "next";
import DashboardLauncherClient from "./clientDash";

export const metadata: Metadata = {
    title: "Space - Launcher",
};

export default function Page() {
    return <DashboardLauncherClient />;
}
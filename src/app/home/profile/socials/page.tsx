import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserServer } from "@/app/_server/getUser";
import SocialsClient from "./SocialsClient";

export const metadata: Metadata = { title: "Space - Social profiles" };

export default async function SocialProfilesPage() {
    const user = await getUserServer();
    if (!user) redirect("/login");
    return <SocialsClient user={user} />;
}

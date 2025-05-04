import {UserProvider} from "@/context/UserContext";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - User finder",
};

export default function UserLayour({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return <UserProvider>{children}</UserProvider>
}
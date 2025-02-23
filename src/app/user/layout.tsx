import {UserProvider} from "@/context/UserContext";

export default function UserLayour({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return <UserProvider>{children}</UserProvider>
}
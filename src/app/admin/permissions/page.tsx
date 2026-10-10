import {redirect} from "next/navigation";
import {getUserServer} from "@/app/_server/getUser";
import PermissionsClient from "./client";

export default async function PermissionsPage() {
    const user = await getUserServer();
    if (user?.role !== "OWNER") {
        redirect("/home/dashboard");
    }
    return <PermissionsClient />;
}

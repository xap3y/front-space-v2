import type {Metadata} from "next";
import PcvDashboard from "./client";

export const metadata: Metadata = {
    title: "PlaycoreVIP · Space",
    robots: {index: false, follow: false},
};

export default function Page() {
    return <PcvDashboard/>;
}

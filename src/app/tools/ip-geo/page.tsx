import type {Metadata} from "next";
import IpGeoClient from "./client";

export const metadata: Metadata = {title: "Space - IP Geolocation"};

export default function IpGeoPage() {
    return <IpGeoClient/>;
}

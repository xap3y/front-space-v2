import { CallServer } from "@/types/core";

// CALL_server enum
export enum CallServerEnum {
    API,
    S3,
    UNKNOWN,
}

export const callServers: CallServer[] = [
    {
        name: "Automatic",
        url: "auto",
        location: "auto",
        flag: "",
        type: CallServerEnum.UNKNOWN
    },
    {
        name: "(eeur) R2",
        url: "https://r3.xap3y.space/status.txt",
        location: "Eastern Europe",
        flag: "/flags/eu.svg",
        type: CallServerEnum.S3
    },
    {
        name: "(FR) Paris",
        url: "https://call.xap3y.tech",
        location: "Europe",
        flag: "/flags/fr.svg"
    },
    {
        name: "(CZ) Prague",
        url: "https://api.xap3y.tech",
        location: "Europe",
        flag: "/flags/cs.svg"
    },
    {
        name: "(US) Oregon",
        url: "https://call.xap3y.fun",
        location: "US",
        flag: "/flags/en.svg"
    },
    {
        name: "(-) 127.0.0.1",
        url: "http://localhost:8012",
        location: "Europe",
        flag: "/flags/unknown.svg"
    }

]
import { CallServer } from "@/types/core";

export const callServers: CallServer[] = [
    {
        name: "Automatic",
        url: "auto",
        location: "auto",
        flag: "",
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
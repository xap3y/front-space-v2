import {useCallback, useEffect, useState} from "react";
import {CallServer} from "@/types/core";
import {CallServerEnum} from "@/config/global";
//import {pingServer} from "@/lib/client";

export const useServerPings = (servers: CallServer[]) => {
    const [pings, setPings] = useState<Record<string, number | null>>({});

    const resetPings = () => {
        const initialPings: Record<string, number | null> = {};
        servers.forEach((server) => {
            if (server.type==CallServerEnum.UNKNOWN || server.type==CallServerEnum.ALLOWED) initialPings[server.url] = 0;
            else if (server.type==CallServerEnum.S3) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const start = performance.now();
                fetch(server.url, {
                    method: "HEAD",
                    mode: "no-cors",
                    cache: "no-store",
                    signal: controller.signal,
                })
                    .then(() => {
                        const end = performance.now();
                        const duration = end - start;
                        if (controller.signal.aborted || duration > 5000) {
                            setPings((prev) => ({ ...prev, [server.url]: null }));
                        } else {
                            setPings((prev) => ({
                                ...prev,
                                [server.url]: Math.round(duration),
                            }));
                        }
                    })
                    .catch(() => {
                        setPings((prev) => ({ ...prev, [server.url]: null }));
                    })
                    .finally(() => clearTimeout(timeoutId));
            }
            else initialPings[server.url] = null;
        });
        setPings(initialPings);
    }

    const getServerPing = useCallback(() => {
        resetPings()
        /*servers.forEach((server) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const start = performance.now();

            fetch(server.url, {
                method: "HEAD",
                mode: "no-cors",
                cache: "no-store",
                signal: controller.signal,
            })
                .then(() => {
                    const end = performance.now();
                    const duration = end - start;
                    if (controller.signal.aborted || duration > 5000) {
                        setPings((prev) => ({ ...prev, [server.url]: null }));
                    } else {
                        setPings((prev) => ({
                            ...prev,
                            [server.url]: Math.round(duration),
                        }));
                    }
                })
                .catch(() => {
                    setPings((prev) => ({ ...prev, [server.url]: null }));
                })
                .finally(() => clearTimeout(timeoutId));
        });*/
        // TODO
    }, [servers]);

    useEffect(() => {
        getServerPing();
    }, [getServerPing]);

    return { pings, getServerPing };
};

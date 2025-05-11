import {useCallback, useEffect, useState} from "react";
import {CallServer} from "@/types/core";
//import {pingServer} from "@/lib/client";

export const useServerPings = (servers: CallServer[]) => {
    const [pings, setPings] = useState<Record<string, number | null>>({});

    const resetPings = () => {
        const initialPings: Record<string, number | null> = {};
        servers.forEach((server) => {
            initialPings[server.url] = null;
        });
        setPings(initialPings);
    }

    const getServerPing = useCallback(() => {
        resetPings()
        servers.forEach((server) => {
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
        });
    }, [servers]);

    useEffect(() => {
        getServerPing();
    }, [getServerPing]);

    return { pings, getServerPing };
};

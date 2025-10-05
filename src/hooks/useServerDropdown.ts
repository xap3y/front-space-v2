import {useEffect, useState} from "react";
import {CallServer} from "@/types/core";
import {CallServerEnum, callServers} from "@/config/global";
import {errorToast} from "@/lib/client";

export function useServerDropdown() {
    const [selected, setSelected] = useState<CallServer>(callServers[0]);
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        /*callServers.forEach(server => {

            fetch(`${server.url}/status`)
                .then(res => setStatus(prev => ({ ...prev, [server.url]: res.ok })))
                .catch(() => setStatus(prev => ({ ...prev, [server.url]: false })));
        });*/
        callServers.forEach(server => {
            if (server.type == CallServerEnum.UNKNOWN || server.type == CallServerEnum.S3) {
                setStatus(prev => ({ ...prev, [server.url]: true }));
            } else if (server.type == CallServerEnum.ALLOWED) {
                fetch(`${server.url}/status`)
                    .then(res => setStatus(prev => ({ ...prev, [server.url]: res.ok })))
                    .catch(() => setStatus(prev => ({ ...prev, [server.url]: false })));
            }
        });
    }, []);

    const toggle = () => setIsOpen(prev => !prev);
    const select = (server: CallServer) => {
        if(status[server.url] || server.name == "Automatic" || server.name.includes("R2") || server.type == CallServerEnum.ALLOWED) setSelected(server);
        else errorToast("Server is offline!")
        setIsOpen(false);
    };

    return {
        callServers,
        selected,
        select,
        isOpen,
        toggle,
        status
    };
}

import { useEffect, useState } from "react";

export function useCountdown(initialSeconds: number) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (!active) return;
        if (seconds <= 0) return;
        const t = setInterval(() => setSeconds(s => s - 1), 1000);
        return () => clearInterval(t);
    }, [seconds, active]);

    return {
        seconds,
        active,
        pause: () => setActive(false),
        resume: () => setActive(true),
        reset: (s = initialSeconds) => {
            setSeconds(s);
            setActive(true);
        }
    };
}
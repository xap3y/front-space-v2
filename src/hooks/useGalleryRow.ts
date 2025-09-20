import { useEffect, useState } from "react";

// Returns "mobile" or "desktop"
export function useGalleryRows() {
    const [mode, setMode] = useState<"mobile" | "desktop">("desktop");

    useEffect(() => {
        function updateMode() {
            if (window.innerWidth < 640) setMode("mobile");
            else setMode("desktop");
        }
        updateMode();
        window.addEventListener("resize", updateMode);
        return () => window.removeEventListener("resize", updateMode);
    }, []);

    return mode;
}
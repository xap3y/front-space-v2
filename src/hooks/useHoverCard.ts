import { useCallback, useState } from 'react';
import {useIsMobile} from "@/hooks/utils";

interface Position {
    x: number;
    y: number;
}

export function useHoverCard(isMobile: boolean = useIsMobile()) {
    const [showCard, setShowCard] = useState(false);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    const handleMouseEnter = useCallback(() => {
        if (isMobile) return;
        setShowCard(true);
    }, [isMobile]);

    const handleMouseLeave = useCallback(() => {
        if (isMobile) return;
        setShowCard(false);
    }, [isMobile]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isMobile) {
            setPosition({ x: e.clientX, y: e.clientY });
        }
    }, [isMobile]);

    return {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    };
}

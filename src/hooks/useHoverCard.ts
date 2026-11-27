import { useCallback, useState } from 'react';
import {useIsMobile} from "@/hooks/utils";

interface Position {
    x: number;
    y: number;
}

export function useHoverCard(isMobile: boolean = useIsMobile()) {
    const [showCard, setShowCard] = useState(false);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    const handleMouseEnter = useCallback((event?: React.MouseEvent) => {
        if (isMobile) return;
        if (event) setPosition({x: event.clientX, y: event.clientY});
        setShowCard(true);
    }, [isMobile]);

    const handleMouseLeave = useCallback(() => {
        if (isMobile) return;
        setShowCard(false);
    }, [isMobile]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isMobile && showCard) {
            setPosition({ x: e.clientX, y: e.clientY });
        }
    }, [isMobile, showCard]);

    return {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    };
}

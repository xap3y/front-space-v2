'use client';

import { useState } from 'react';
import { FaTrash } from 'react-icons/fa6';

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

export default function SwipeableListItem({
                                              children,
                                              onDelete,
                                              onClick,
                                              active,
                                              disabled
                                          }: Props) {
    if (disabled) {
        return (
            <li
                onClick={onClick}
                className={`
          group cursor-pointer px-4 py-3 text-xs relative transition-colors
          ${active ? 'bg-zinc-950/50' : 'bg-primary hover:bg-zinc-950/50'}
          border-b border-white/20 last:border-b-0
        `}
            >
                {children}
            </li>
        );
    }

    const ACTION_W = 72;
    const MAX_SWIPE = ACTION_W * 1.3;
    const DELETE_THRESHOLD = 56;

    const [tx, setTx] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [sx, setSx] = useState(0);
    const [sy, setSy] = useState(0);
    const [lockedAxis, setLockedAxis] = useState<null | 'x' | 'y'>(null);
    const [thresholdBuzzed, setThresholdBuzzed] = useState(false);

    const rubber = (x: number) => {
        const beyond = Math.abs(x) - ACTION_W;
        if (beyond <= 0) return x;
        const eased = ACTION_W + beyond * 0.35;
        return x < 0 ? -eased : eased;
    };

    const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setDragging(true);
        setAnimating(false);
        setLockedAxis(null);
        setSx(e.clientX);
        setSy(e.clientY);
        (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;

        if (!lockedAxis) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) setLockedAxis('x');
            else if (Math.abs(dy) > 8) setLockedAxis('y');
        }
        if (lockedAxis === 'y') return;

        let nx = Math.min(0, dx);
        nx = Math.max(nx, -MAX_SWIPE);
        const eased = nx < -ACTION_W ? rubber(nx) : nx;
        setTx(eased);

        // Haptic feedback when crossing delete threshold
        const crossed = nx <= -DELETE_THRESHOLD;
        if (crossed && !thresholdBuzzed && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try { (navigator as any).vibrate?.(10); } catch {}
            setThresholdBuzzed(true);
        }
        if (!crossed && thresholdBuzzed) setThresholdBuzzed(false);
    };

    const snapTo = (x: number, cb?: () => void) => {
        setAnimating(true);
        setTx(x);
        // Let CSS transition run; no explicit timer needed for normal snaps
        if (cb) setTimeout(cb, 160);
    };

    const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        (e.currentTarget as any).releasePointerCapture?.(e.pointerId);

        const dx = e.clientX - sx;
        setDragging(false);
        setLockedAxis(null);
        setThresholdBuzzed(false);

        // Treat as tap if small movement
        if (Math.abs(dx) < 8) {
            snapTo(0);
            onClick();
            return;
        }

        // If swiped past threshold, animate slightly beyond then delete
        if (dx <= -DELETE_THRESHOLD) {
            // snap to just past the action width for a satisfying finish, then delete
            snapTo(-ACTION_W * 1.1, () => {
                onDelete();
            });
            return;
        }

        // Otherwise snap back closed
        snapTo(0);
    };

    const progress = Math.min(Math.max(-tx / ACTION_W, 0), 1.25); // 0 to ~1.25
    const actionOpacity = Math.min(progress, 1);
    const actionScale = 0.85 + Math.min(progress, 1) * 0.15; // 0.85 -> 1

    return (
        <li className="relative select-none border-b border-white/20 last:border-b-0">
            {/* Right-side delete action layer */}
            <div className="absolute inset-0 flex items-stretch justify-end bg-transparent pointer-events-none">
                <div
                    className="w-[72px] bg-red-600 flex items-center justify-center text-white"
                    style={{
                        opacity: actionOpacity,
                        transform: `scale(${actionScale})`,
                        transition: dragging ? 'none' : 'opacity 160ms ease, transform 160ms ease'
                    }}
                >
                    <FaTrash className="h-4 w-4" />
                </div>
            </div>

            {/* Swipeable content */}
            <div
                className={`
          relative cursor-pointer px-4 py-3 text-xs
          ${active ? 'bg-[#272b33]' : 'bg-[#1d2025]'}
          group
        `}
                style={{
                    transform: `translateX(${tx}px)`,
                    touchAction: 'pan-y',
                    transition: dragging ? 'none' : (animating ? 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'transform 140ms ease-out')
                }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={() => {
                    setDragging(false);
                    setLockedAxis(null);
                    setThresholdBuzzed(false);
                    snapTo(0);
                }}
            >
                {/* Optional: subtle shadow when pulled */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        boxShadow: tx !== 0 ? 'inset -6px 0 12px rgba(0,0,0,0.25)' : 'none',
                        transition: 'box-shadow 150ms ease'
                    }}
                />
                {children}
            </div>
        </li>
    );
}
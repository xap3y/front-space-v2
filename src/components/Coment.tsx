"use client";
import { useState, useEffect } from "react";

// Helper: convert vw/vh/px to px
function parseUnit(val: string, vw: number, vh: number) {
    if (val.endsWith("vw")) return (parseFloat(val) / 100) * vw;
    if (val.endsWith("vh")) return (parseFloat(val) / 100) * vh;
    if (val.endsWith("px")) return parseFloat(val);
    return parseFloat(val);
}

export default function Comet() {
    const [visible, setVisible] = useState(false);
    const [cometProps, setCometProps] = useState({
        startLeft: "10vw",
        startTop: "-100px",
        endLeft: "90vw",
        endTop: "110vh",
        duration: 0.5,
        tailColor: "#60a5fa",
        headColor: "#fff",
        tailLength: 180,
    });

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        let cometTimeout: NodeJS.Timeout;

        function launchComet() {
            const startLeft = `${5 + Math.random() * 30}vw`;
            const endLeft = `${65 + Math.random() * 30}vw`;
            const startTop = "-100px";
            const endTop = "110vh";
            const duration = 0.5 + Math.random() * 0.1; // 0.5s to 0.6s

            const tailColors = [
                ["#60a5fa", "#0ea5e9"],
                ["#f472b6", "#e0e7ff"],
                ["#fbbf24", "#fef3c7"],
                ["#a3e635", "#d1fae5"],
            ];
            const picked = tailColors[Math.floor(Math.random() * tailColors.length)];
            const tailColor = picked[0];
            const headColor = picked[1];
            const tailLength = 160 + Math.random() * 100;

            setCometProps({
                startLeft,
                endLeft,
                startTop,
                endTop,
                duration,
                tailColor,
                headColor,
                tailLength,
            });
            setVisible(true);

            cometTimeout = setTimeout(() => {
                setVisible(false);
                const next = 2000 + Math.random() * 6000;
                timeout = setTimeout(launchComet, next);
            }, duration * 1000);
        }

        timeout = setTimeout(launchComet, 800 + Math.random() * 1200);

        return () => {
            clearTimeout(timeout);
            clearTimeout(cometTimeout);
        };
    }, []);

    // Animate position from start to end (diagonal), keep the comet vertical!
    return (
        <div className="pointer-events-none fixed left-0 top-0 w-full h-full z-30">
            {visible && (
                <div
                    className="absolute comet-anim"
                    style={{
                        left: cometProps.startLeft,
                        top: cometProps.startTop,
                        animation: `comet-move-diag ${cometProps.duration}s linear forwards`,
                        // Pass the end position as CSS vars for the keyframes
                        "--comet-end-left": cometProps.endLeft,
                        "--comet-end-top": cometProps.endTop,
                    } as React.CSSProperties}
                >
                    {/* Tail, always vertical */}
                    <div
                        style={{
                            width: "8px",
                            height: cometProps.tailLength + "px",
                            background: `linear-gradient(to top, ${cometProps.tailColor}, transparent 80%)`,
                            filter: "blur(3px)",
                            opacity: 0.8,
                            borderRadius: "6px",
                            position: "absolute",
                            left: "50%",
                            bottom: "15px",
                            transform: "translateX(-50%)",
                            zIndex: 1,
                            transition: "none",
                        }}
                    />
                    {/* Glow around head */}
                    <div
                        style={{
                            width: "45px",
                            height: "45px",
                            background: `radial-gradient(circle at 55% 70%, ${cometProps.headColor}, transparent 70%)`,
                            filter: "blur(9px)",
                            opacity: 1,
                            position: "absolute",
                            left: "50%",
                            bottom: "0px",
                            transform: "translateX(-50%)",
                            zIndex: 2,
                            pointerEvents: "none",
                            transition: "none",
                        }}
                    />
                    {/* Head */}
                    <div
                        style={{
                            width: "18px",
                            height: "18px",
                            background: `radial-gradient(circle, #fff 70%, ${cometProps.headColor})`,
                            boxShadow: `0 0 24px 8px ${cometProps.headColor}, 0 0 12px 4px ${cometProps.tailColor}`,
                            borderRadius: "50%",
                            position: "absolute",
                            left: "50%",
                            bottom: "10px",
                            transform: "translateX(-50%)",
                            zIndex: 3,
                            pointerEvents: "none",
                            opacity: 1,
                            transition: "none",
                        }}
                    />
                </div>
            )}
            <style jsx global>{`
                @keyframes comet-move-diag {
                    from {
                        left: inherit;
                        top: inherit;
                    }
                    to {
                        left: var(--comet-end-left, 90vw);
                        top: var(--comet-end-top, 110vh);
                    }
                }
            `}</style>
        </div>
    );
}
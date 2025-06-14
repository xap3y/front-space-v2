"use client";
import { useRef, useEffect } from "react";

const STAR_COLORS = ['#fff', '#c7dfff', '#ffe0c7', '#c7ffd8'];
const STAR_COUNT = 150;

export default function StarsBg() {
    const starsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const starsEl = starsRef.current;
        if (!starsEl) return;
        starsEl.innerHTML = "";
        for (let i = 0; i < STAR_COUNT; i++) {
            const star = document.createElement("div");
            const size = Math.random() * 2 + 1;
            const top = Math.random() * 100 - 10;
            const left = Math.random() * 100 - 1;
            const animDuration = 30 + Math.random() * 50; // 30s to 80s
            const animX = (Math.random() - 0.5) * 20; // -10vw to +10vw
            const animY = (Math.random() - 0.5) * 20; // -10vh to +10vh
            const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

            star.className = "star-move";
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.top = `${top}vh`;
            star.style.left = `${left}vw`;
            star.style.opacity = (0.3 + Math.random() * 0.7).toString();
            star.style.background = color;
            star.style.position = "absolute";
            star.style.borderRadius = "9999px";
            star.style.pointerEvents = "none";
            star.style.filter = Math.random() < 0.1 ? "blur(1px)" : "";
            star.style.animation = `star-move ${animDuration}s ease-in-out infinite alternate`;
            star.style.setProperty("--x", `${animX}vw`);
            star.style.setProperty("--y", `${animY}vh`);
            starsEl.appendChild(star);
        }
    }, []);

    return (
        <div
            ref={starsRef}
            className="pointer-events-none absolute inset-0 z-20"
            aria-hidden="true"
        />
    );
}
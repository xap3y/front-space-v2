'use client';

import { useState, useEffect } from 'react';

export function getTheme(): string {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const theme = localStorage.getItem("theme");
        if (theme) {
            setTheme(theme);
        } else {
            localStorage.setItem("theme", "dark");
            setTheme("dark");
        }
    }, []);

    return theme;
}

export function setTheme(newTheme: string) {
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("storage"));
}
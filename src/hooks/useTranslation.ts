'use client';

import { useState, useEffect } from 'react';
import LanguageModel from "@/types/LanguageModel";
import en from '@/locales/en';
import ru from '@/locales/ru';
import cs from '@/locales/cs';
import {getCookie, setCookie} from "cookies-next/client";
import {getDefaultLocale} from "@/lib/core";

const translations: Record<string, LanguageModel> = { en, ru, cs };

export function useTranslation(): LanguageModel {
    const [locale, setLocale] = useState(() => {
        return getCookie("locale") || getDefaultLocale();
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const newLocale = getCookie("locale") || getDefaultLocale();
            setLocale(newLocale);
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return translations[locale] || translations.ru;
}

/**
 * Function to change the language and update UI
 */
export function setLanguage(newLang: string) {
    setCookie("locale", newLang, { path: "/", expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });
    window.dispatchEvent(new Event("storage"));
}

export function getLanguageCode() {
    return getCookie("locale") || getDefaultLocale();
}
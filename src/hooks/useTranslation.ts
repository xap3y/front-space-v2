'use client';

import { useState, useEffect } from 'react';
import LanguageModel from "@/types/LanguageModel";
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import cs from '@/locales/cs.json';
import sk from '@/locales/sk.json';
import de from '@/locales/de.json';
import ua from '@/locales/ua.json';
import pl from '@/locales/pl.json';
import {getCookie, setCookie} from "cookies-next/client";
import {getDefaultLocale} from "@/lib/core";

const translations: Record<string, LanguageModel> = {
    cs: cs as LanguageModel,
    en: en as LanguageModel,
    ru: ru as LanguageModel,
    sk: sk as LanguageModel,
    ua: ua as LanguageModel,
    pl: pl as LanguageModel,
    de: de as LanguageModel,
};

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

    return translations[locale] || translations.en;
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

export default translations;
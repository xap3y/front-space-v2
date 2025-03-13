"use client";

import {useState, useEffect} from "react";
import Image from "next/image";
import {getCookie, setCookie} from "cookies-next/client";
import {getDefaultLocale} from "@/lib/core";
import { FaArrowUp, FaSun, FaMoon } from "react-icons/fa6";
import translations, {setLanguage, useTranslation} from "@/hooks/useTranslation";
import {toast} from "react-toastify";

const languages = [
    { code: "en", label: "English", flag: "/flags/en.svg" },
    { code: "ru", label: "Русский", flag: "/flags/ru.svg" },
    { code: "cs", label: "Čeština", flag: "/flags/cs.svg" },
];

export default function LanguageSwitcher() {

    const lang = useTranslation();

    const [locale, setLocale] = useState("ru");
    const [isOpen, setIsOpen] = useState(false);
    const [isChanging, setIsChanging] = useState(false);
    const [isLightMode, setIsLightMode] = useState(false);
    const [displayedLocale, setDisplayedLocale] = useState(locale);
    const [spinning, setSpinning] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const cookieLocale = getCookie("locale");
        const localeToUse = cookieLocale || getDefaultLocale();
        setLocale(localeToUse);
        setDisplayedLocale(localeToUse)
        setLoading(false);
    }, []);

    const changeLanguage = (newLang: string) => {
        setCookie("locale", newLang, { path: "/", expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });
        setLocale(newLang);
        setLanguage(newLang);
        setIsOpen(false);
        if (newLang === displayedLocale) return;
        setIsChanging(true);

        setTimeout(() => {
            setDisplayedLocale(newLang);
            setIsChanging(false);
            toast.success(translations[newLang].toasts.success.language_changed + newLang.toLocaleUpperCase(), {
                autoClose: 1000,
                pauseOnHover: false,
                closeOnClick: true
            })
        }, 150);
    };

    const changeTheme = () => {

        if (spinning) return;
        //toast.error("Something went wrong!")
        const toast2 = toast.info(lang.toasts.error.changing_theme, {
            isLoading: true
        })

        setTimeout(() => {
            toast.update(toast2, {isLoading: false, render: lang.toasts.error.change_theme, type: "error", closeOnClick: true, autoClose: 600})
        }, 400);
        if (spinning) return;
        setSpinning(true);

        setTimeout(() => {
            setSpinning(false);
            setIsLightMode(!isLightMode);
        }, 250);
    };

    if (loading) {
        return (
            <></>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex">
            <div className={`${spinning ? "cursor-auto" : "cursor-pointer"} flex items-center justify-center w-10 h-10 bg-primary_light rounded-md mr-2`} onClick={changeTheme}>
                {isLightMode ? (
                    <FaSun className={`transition-transform ${spinning ? "rotate-180" : "rotate-0"}`} size={16} color="yellow" />
                ) : (
                    <FaMoon className={`transition-transform ${spinning ? "-rotate-180" : "rotate-0"}`} size={16} color="gray" />
                )}
            </div>
            <div
                className="relative bg-primary_light p-2 rounded-lg shadow-lg cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Selected Language */}
                <div className="flex items-center justify-between">
                    <div className={`transition-opacity duration-300 ${isChanging ? "opacity-0" : "opacity-100"}`}>
                        <div className={"w-[24px] h-[16px] pt-[1px]"}>
                            <Image
                                src={languages.find((l) => l.code === displayedLocale)?.flag || "/flags/en.png"}
                                alt="Flag"
                                width={24}
                                height={16}
                            />
                        </div>

                    </div>

                    {/* Language Name */}
                    <div className={`transition-opacity duration-300 ${isChanging ? "opacity-0" : "opacity-100"}`}>
                        <span className="ml-2">{languages.find((l) => l.code === displayedLocale)?.label}</span>
                    </div>

                    {/* Space */}
                    <span className={"mx-2"}></span>

                    {/* Arrow Icon */}
                    <FaArrowUp
                        className={`ml-auto transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                        size={18}
                        color={"white"}
                        style={{ strokeWidth: 1.5 }}
                    />
                </div>

                {/* Dropdown - Opens Upwards */}
                {isOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-full border border-primary_light rounded shadow-lg">
                        {languages.map(({ code, label, flag }) => (
                            <div
                                key={code}
                                className="flex items-center p-2 hover:bg-primary bg-primary_light transition-all duration-200 cursor-pointer"
                                onClick={() => changeLanguage(code)}
                            >
                                <Image src={flag} alt={`${label} flag`} width={24} height={16} />
                                <span className="ml-2">{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

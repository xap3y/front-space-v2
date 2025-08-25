"use client";

import {useState, useEffect} from "react";
import Image from "next/image";
import {getCookie, setCookie} from "cookies-next/client";
import {getDefaultLocale} from "@/lib/core";
import { FaArrowUp, FaSun, FaMoon } from "react-icons/fa6";
import translations, {setLanguage, useTranslation} from "@/hooks/useTranslation";
import {toast} from "react-toastify";
import {useRouter} from "next/navigation";
import {FaHome} from "react-icons/fa";
import {okToast} from "@/lib/client";

const languages = [
    { code: "en", label: "English", flag: "/flags/en.svg" },
    { code: "cs", label: "Čeština", flag: "/flags/cs.svg" },
    /*{ code: "sk", label: "Slovenština", flag: "/flags/sk.svg" },*/
    { code: "pl", label: "Polski", flag: "/flags/pl.svg" },
    { code: "ru", label: "Русский", flag: "/flags/ru.svg" },
    /*{ code: "ua", label: "українська", flag: "/flags/ua.svg" },*/
    { code: "de", label: "Deutsch", flag: "/flags/de.svg" },
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

    const router = useRouter();

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
            okToast(translations[newLang].toasts.success.language_changed + newLang.toLocaleUpperCase(), 1000)
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

    const goHome = () => {
        router.push("/");
    }

    if (loading) {
        return (
            <></>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex">
            <div className={`border-2 border-dotted border-zinc-600 cursor-pointer flex items-center justify-center lg:w-10 w-8 lg:h-10 h-8 bg-primary_light rounded-md mr-2`} onClick={goHome}>
                <FaHome className={"rounded-md"} size={16} color="white" />
            </div>
            <div className={`${spinning ? "cursor-auto" : "cursor-pointer"} border-2 border-dotted border-zinc-600 flex items-center justify-center lg:w-10 w-8 lg:h-10 h-8 bg-primary_light rounded-md mr-2`} onClick={changeTheme}>
                {isLightMode ? (
                    <FaSun className={`transition-transform ${spinning ? "rotate-180" : "rotate-0"}`} size={16} color="yellow" />
                ) : (
                    <FaMoon className={`transition-transform ${spinning ? "-rotate-180" : "rotate-0"}`} size={16} color="gray" />
                )}
            </div>
            <div
                className="border-2 border-dotted border-zinc-600 lg:h-10 h-8 flex items-center relative bg-primary_light p-2 rounded-lg shadow-lg cursor-pointer select-none"
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
                    <div className={`${isOpen ? "" : "hidden"} lg:block transition-opacity duration-300 ${isChanging ? "opacity-0" : "opacity-100"}`}>
                        <span className="ml-2 font-medium">{languages.find((l) => l.code === displayedLocale)?.label}</span>
                    </div>

                    {/* Space */}
                    <span className={"lg:mx-2 mx-1"}></span>

                    {/* Arrow Icon */}
                    <FaArrowUp
                        className={`ml-auto transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                        size={16}
                        color={"white"}
                        style={{ strokeWidth: 1.5 }}
                    />
                </div>

                {/* Dropdown - Opens Upwards */}
                {isOpen && (
                    <div className="border-2 border-dotted border-zinc-600 absolute left-0 bottom-full mb-2 w-full rounded shadow-lg">
                        {languages.map(({ code, label, flag }) => (
                            <div
                                key={code}
                                className={`${(code == displayedLocale) ? "bg-secondary font-semibold" : "bg-primary_light"} flex items-center p-2 hover:bg-primary transition-all duration-200 cursor-pointer`}
                                onClick={() => changeLanguage(code)}
                            >
                                <Image src={flag} alt={`${code}`} width={24} height={16} />
                                <span className="ml-2">{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

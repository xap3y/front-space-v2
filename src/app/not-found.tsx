import Link from 'next/link';
import LanguageSwitcher from "@/components/LanguageSwitcher";

import "./globals.css";
import {FaHome} from "react-icons/fa";

export default function NotFound() {
    return (
        <>
            <div className={"w-screen h-[80vh] flex flex-col items-center justify-center font-source-code gap-28 "}>
                <h2 className={"xl:text-7xl text-3xl font-bold text-center"}>404 | Not Found!</h2>
                <Link className={"p-2 rounded-xl bg-blue-500 hover:-translate-y-1 duration-200 xltext-3xl text-xl flex items-center gap-2"} href={"/"}>
                    <FaHome />
                    Return Home
                </Link>
            </div>
        </>
    )
}
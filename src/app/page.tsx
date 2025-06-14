"use client";
import StarsBg from "@/components/StarsBg";
import './space.css';
import Comet from "@/components/Coment";
import Link from "next/link";
import {useEffect} from "react";

export default function Home() {

    return (
        <>
            <div className={"overflow-y-hidden custom-cursor flex flex-col justify-center items-center min-h-[90vh] bg-gradient-to-b from-[#0f1123] via-[#10121a] to-black"}>

                <StarsBg />

                {/*<Comet />*/}

                {/*<div className={"mt-10 font-bold text-4xl text-center"}>
                    <h1>Xap3y's space v0.4</h1>
                </div>

                <div className={"flex flex-row gap-4 mt-20 text-telegram"}>

                    <a href={"/login"}>login</a>
                    <a href={"/home/dashboard"}> | dashboard</a>
                    <a href={"/i"}> | img finder</a>

                </div>

                <div className={"flex flex-row gap-4 mt-2 text-telegram"}>

                    <a href={"/a"}>portable</a>
                    <a href={"/user"}> | user finder</a>
                    <a href={"/docs"}> | docs</a>

                </div>*/}

                <div className="flex flex-col items-center justify-center w-full px-4 ">
                    <h1
                        className="text-white text-4xl sm:text-5xl font-source-code md:text-6xl font-extrabold text-center mb-10"
                        style={{
                            textShadow: "0 2px 16px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.2)"
                        }}
                    >
                        XAP3Y&apos;s SPACE
                    </h1>
                    <div className="flex flex-row gap-2 sm:gap-4 w-full max-w-lg justify-center items-center">
                        <Link href="/login" passHref>
                            <button
                                className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-md border border-gray-700 bg-neutral-800 text-gray-200 font-medium shadow-sm hover:bg-neutral-700 hover:border-gray-500 hover:text-white active:bg-neutral-900 transition-colors duration-150 focus:outline-none text-sm sm:text-base"
                                type="button"
                            >
                                Login
                            </button>
                        </Link>
                        <Link href="/docs" passHref>
                            <button
                                className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-md border border-gray-700 bg-neutral-800 text-gray-200 font-medium shadow-sm hover:bg-neutral-700 hover:border-gray-500 hover:text-white active:bg-neutral-900 transition-colors duration-150 focus:outline-none text-sm sm:text-base"
                                type="button"
                            >
                                Docs
                            </button>
                        </Link>
                        <Link href="/i" passHref className={"outline-none"}>
                            <button
                                className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-md border border-gray-700 bg-neutral-800 text-gray-200 font-medium shadow-sm hover:bg-neutral-700 hover:border-gray-500 hover:text-white active:bg-neutral-900 transition-colors duration-150 focus:outline-none text-sm sm:text-base"
                                type="button"
                            >
                                Img Finder
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}

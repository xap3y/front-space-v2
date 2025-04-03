"use client";

import {usePage} from "@/context/PageContext";
import {useEffect, useState} from "react";
import {useUser} from "@/hooks/useUser";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {okToast} from "@/lib/client";
import {DateChart} from "@/components/DateChart";
/*import "@/app/debug.css";*/

export default function HomeProfilePage() {

    const { pageName, setPage } = usePage();
    const [ apiKey, setApiKey ] = useState<string>("********");

    const { user, loadingUser, error } = useUser();
    
    const apiKeyToggle = () => {

        if (user?.apiKey == null) return;

        if (!apiKey.includes("***")) {
            setApiKey("*".repeat(user.apiKey.length))
        } else {
            setApiKey(user.apiKey)
        }
    }

    const copyKey = () => {
        if (apiKey.includes("***")) return;
        navigator.clipboard.writeText(user?.apiKey || "")
        okToast("API Key copied to clipboard!", 300)
    }

    useEffect(() => {
        setPage("profile")
    }, [])

    if (loadingUser || error || !user) return <></>

    return (
        <>
            <main className={"flex flex-col w-full"}>
                <div className={"w-full flex flex-col items-center gap-2 text-4xl"}>
                    <div className={"flex flex-row gap-4 mt-10"}>
                        <h1>Welcome, </h1>
                        <p className={"text-yellow-500 font-bold"}>{user.username}</p>
                    </div>
                </div>

                <div className={"w-auto flex items-start ml-20 pt-20"}>
                    <div className={"flex flex-col rounded-xl bg-primary_light p-2 text-xl"}>

                        <div className={"flex flex-row p-2 gap-4 items-center"}>
                            <img className={"rounded-full w-10 h-10"} src={user.avatar || ""} alt={"PFP"} />

                            <p className={"font-bold text-2xl text-yellow-500 pb-1"}>{user.username}</p>
                            <p>{"(UID: " + user.uid + ")"}</p>
                        </div>

                        <hr className={"rounded-full border-opacity-50 border-[1px] border-primary-brighter my-0.5"} />
                        <div className={"flex flex-row p-2 gap-2 items-center"}>
                            <p>Storage used: </p>
                            <b>{(user.stats.storageUsed / 1024 / 1024).toFixed(2)} MB</b>
                        </div>

                        <hr className={"rounded-full border-opacity-50 border-[1px] border-primary-brighter my-0.5"} />
                        <div className={"flex flex-row p-2 gap-2 items-center"}>
                            <p>Images uploaded: </p>
                            <b>{user.stats.totalUploads}</b>
                        </div>

                        <hr className={"rounded-full border-opacity-50 border-[1px] border-primary-brighter my-0.5"} />

                        <div className={"flex flex-row p-2 gap-2 items-center"}>
                            <p>Invited by: </p>
                            <a className={"text-telegram font-bold"} href={"/user/" + user.invitor?.username}>{user.invitor?.username}</a>
                        </div>

                        <hr className={"rounded-full border-opacity-50 border-[1px] border-primary-brighter my-0.5"} />

                        <div className={"flex flex-row p-2 gap-2 items-center"}>
                            <p>API Key: </p>
                            <b data-tooltip-id="my-tooltip" data-tooltip-content={apiKey.includes("***") ? "" : "Click to copy"} data-tooltip-place="top" onClick={copyKey} className={`${apiKey.includes("***") ? "select-none" : "cursor-pointer"} text-telegram mr-2`}>{apiKey}</b>
                            <button className={"transition-all duration-200 hover:-translate-y-0.5"} onClick={apiKeyToggle} data-tooltip-id="my-tooltip" data-tooltip-content={apiKey.includes("***") ? "Click to show" : "Click to hide"}>
                                {
                                    apiKey.includes("***") ? <FaEyeSlash className={"w-6 h-6"} /> : <FaEye className={"w-6 h-6"} />
                                }
                            </button>
                        </div>
                    </div>

                    <div className={"ml-20 w-[80%] pr-20 flex items-center justify-center"}>
                        <div className={"flex flex-col justify-center items-center"}>

                            <div>
                                <p className={"text-3xl font-bold"}>Chart</p>
                            </div>

                            <div className={"w-full rounded-xl bg-primary_light p-2"}>
                                <DateChart data={{
                                    labels: ['2024-03-10', '2024-03-11', '2024-03-12', '2024-03-13'],
                                    datasets: [
                                        {
                                            label: 'Images Uploaded',
                                            data: [2, 12, 0],
                                            borderColor: 'red',
                                            fill: true,
                                        },
                                        {
                                            label: 'Pastes Created',
                                            data: [0, 0, 20],
                                            borderColor: 'orange',
                                            fill: false,
                                        },
                                        {
                                            label: 'URL Shortened',
                                            data: [8, 1, 8],
                                            borderColor: 'yellow',
                                            fill: false,
                                        },
                                    ],
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
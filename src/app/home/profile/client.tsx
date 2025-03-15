"use client";

import {usePage} from "@/context/PageContext";
import {useEffect} from "react";
import {useUser} from "@/hooks/useUser";

export default function HomeProfilePage() {

    const { pageName, setPage } = usePage();

    const { user, loadingUser, error } = useUser();

    console.log(user)

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

                <div className={"w-auto flex items-start ml-20"}>
                    <div className={"flex flex-col rounded-xl bg-primary_light p-2 mt-20 text-xl"}>
                        <div className={"flex flex-row p-2 gap-4 items-center"}>
                            <img className={"rounded-full w-10 h-10"} src={user.avatar || ""} alt={"PFP"} />

                            <p className={"font-bold text-2xl text-yellow-500 pb-1"}>{user.username}</p>
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
                    </div>
                </div>
            </main>
        </>
    )
}
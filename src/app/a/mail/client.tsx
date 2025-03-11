"use client";


import {useEffect, useState} from "react";
import LoadingPage from "@/components/LoadingPage";
import {toast} from "react-toastify";
import LanguageModel from "@/types/LanguageModel";
import {useTranslation} from "@/hooks/useTranslation";
import { IoMdRefresh } from "react-icons/io";
import {useRouter} from "next/navigation";

export default function TempMailo() {

    const emailDomain = "t.xap3y.tech";

    const [mailAddr, setMailAddr] = useState<string>("");
    const [mails, setMails] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [rotating, setRotating] = useState<boolean>(false);

    const router = useRouter();
    const lang: LanguageModel = useTranslation();

    useEffect(() => {
        setLoading(false)
        generateNewEmail()
    }, []);

    const generateNewEmail = () => {
        const randomString = Math.random().toString(36).substring(2, 10);
        setMailAddr(randomString);
        setMails([]); // Clear inbox when generating a new email
    };

    const refreshInbox = () => {
        setMails([]);
        setTimeout(() => {
            toast.error("Failed to get emails, check console.");
            setRotating(false);
        }, 500);
    };

    const refreshEmail = () => {

        if (rotating) return;

        router.refresh();
        refreshInbox();
        generateNewEmail();
        setRotating(true);
    }

    const copyEmail = () => {
        navigator.clipboard.writeText(mailAddr);
        toast.success(lang.toasts.success.copied_to_clipboard, {
            autoClose: 500,
            closeOnClick: true
        });
    };


    if (loading) {
        return <LoadingPage />
    }

    return (
        <>
            <div className="flex bg-secondary flex-col items-center p-6 text-white min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Temporary Email</h1>
                <div className="p-4 rounded-lg flex items-center space-x-3">
                    <div className={"flex text-lg gap-1"}>
                        <span className={"bg-primary_light rounded-lg p-1"}>{mailAddr}</span>
                        <span className={"bg-primary rounded-lg p-1"}>{"@" + emailDomain}</span>
                    </div>

                    <button className={rotating ? "cursor-auto spin-full" : ""} onClick={refreshEmail}>
                        <IoMdRefresh className={"w-6 h-6"} />
                    </button>
                    <button onClick={copyEmail} className="bg-blue-500 px-3 py-1 rounded">Copy</button>
                </div>
                <div className="mt-4 space-x-2">
                    <button onClick={refreshEmail} className="bg-green-500 px-4 py-2 rounded">New Email</button>
                    <button onClick={refreshInbox} className="bg-yellow-500 px-4 py-2 rounded">Refresh Inbox</button>
                </div>
                <div className="mt-6 w-full max-w-lg">
                    <h2 className="text-lg font-semibold mb-2">Inbox</h2>
                    <div className="p-4 rounded-lg min-h-[200px]">
                        {mails.length > 0 ? (
                            mails.map((msg, index) => (
                                <div key={index} className="border-b border-gray-700 p-2">
                                    <p className="font-bold">From: {msg.from}</p>
                                    <p>{msg.subject}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400">{}</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
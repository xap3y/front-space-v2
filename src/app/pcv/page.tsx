"use client";

import {useState} from "react";
import {toast} from "react-toastify";
import {useRouter} from 'next/navigation'
import MainStringInput from "@/components/MainStringInput";

export default function PlaycoreVipEditor() {
    const router = useRouter()
    const [uid, setUid] = useState("");
    const [loading, setLoading] = useState(false);

    const findPasteCv = async () => {
        if (uid == "") {
            return toast.error("Please enter a uniqueId");
        }
        setLoading(true)
        router.push(`/pcv/${uid}`);
    }

    const handleSubmit = async (e: unknown) => {
        // @ts-ignore
        e.preventDefault();
        findPasteCv();
    }

    if (loading) {
        return (
            <main className="flex items-center justify-center min-h-screen">
                <div className="text-white text-xl">Loading...</div>
            </main>
        )
    }

    return (
        <>
            <main className="flex items-center justify-center min-h-screen">
                <div className="max-w-lg w-full mx-3">
                    <div
                        className="box-primary overflow-hidden"
                    >
                        <div className="p-4">
                            <h1 className="text-3xl font-bold text-center text-white">PlaycoreVIP editor</h1>
                            <p className="text-center">Connect to a editor</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4" >
                            <div className="mb-4">
                                <MainStringInput
                                    placeholder= "UID"
                                    value={uid}
                                    onChange={(e) => setUid(e)}
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-telegram hover:bg-telegram_dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-telegram"
                                >
                                    Connect
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    )
}
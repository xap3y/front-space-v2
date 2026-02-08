"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";
import LoadingPage from "@/components/LoadingPage";
import MainStringInput from "@/components/MainStringInput";
import {errorToast} from "@/lib/client";
import {toAsciiAlnumName} from "@/lib/clientFuncs";

export default function ReportFinder() {

    const router = useRouter()
    const [uid, setUid] = useState("");
    const [loading, setLoading] = useState(false);

    const findReport = async () => {
        if (uid == "") {
            errorToast("Please enter a report ID");
            return;
        }

        setLoading(true);
        router.push("/mc/report/" + uid)
        setTimeout(() => {
            setLoading(false);
        }, 200)
    }

    const handleSubmit = async (e: unknown) => {
        // @ts-ignore
        e.preventDefault();
    }

    return (
        <>

            {loading && (
                <LoadingPage/>
            )}

            {!loading && (
                <main className="flex items-center justify-center min-h-screen">
                    <div className="max-w-lg w-full mx-3">
                        <div
                            className="box-primary overflow-hidden"
                        >
                            <div className="p-4">
                                <h1 className="text-3xl font-bold text-center text-white">Report Transcript Finder</h1>
                                <p className="text-center">Enter transcript ID below</p>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4" >
                                <div className="mb-4">
                                    <MainStringInput
                                        placeholder= "Transcript ID"
                                        required={true}
                                        autoComplete="new-password"
                                        type="text"
                                        name="uid"
                                        id="uid"
                                        value={uid}
                                        onChange={(e) => setUid(toAsciiAlnumName(e))}
                                    />
                                </div>
                                <div className="mb-4">
                                    <button
                                        type={"submit"}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-telegram hover:bg-telegram-brightest hover:text-primary focus:outline-none transition-all duration-200 transform"
                                        onClick={findReport}
                                    >
                                        Lookup Report
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            )}
        </>
    )
}
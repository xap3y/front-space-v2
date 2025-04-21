import LanguageModel from "@/types/LanguageModel";

import { IoMdRefresh } from "react-icons/io";
import {FaArrowLeft} from "react-icons/fa";

interface Props {
    message: string;
    lang: LanguageModel;
    callBack?: () => void;
}

export function ErrorPage({message, lang, callBack}: Props) {
    return (
        <>
            <div className={"flex flex-col items-center justify-center h-screen w-screen"}>
                <h1 className={"text-5xl font-bold mb-4"}>Oh no!</h1>
                <p className={"text-xl text-gray-200 mb-4"}>{message}</p>

                {
                    callBack && (
                        <button onClick={callBack} className={"items-center gap-3 flex p-4 rounded-lg bg-secondary hover:-translate-y-1 duration-200"} >
                            <span className={"text-blue-600 font-extrabold"}>GO BACK</span>
                            <FaArrowLeft className={"w-6 h-6"} />
                        </button>
                    )
                }
            </div>
        </>
    )
}
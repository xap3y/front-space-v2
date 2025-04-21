'use client';

import {useEffect, useState, useTransition} from "react";
import {getUserApi} from "@/lib/apiGetters";
import {toast} from "react-toastify";
import {useRouter} from 'next/navigation'
import { useUser } from '@/context/UserContext';
import LoadingPage from "@/components/LoadingPage";
import {UserObj} from "@/types/user";
import {useTranslation} from "@/hooks/useTranslation";
import {DefaultResponse} from "@/types/core";

export default function UserFinder() {

    const router = useRouter()
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);
    const { user, setUser } = useUser();

    const lang = useTranslation();

    const findUser = async () => {

        if (username == "") {
            return toast.error(lang.pages.user_finder.empty_field_error);
        }
        setLoading(true)
        const res: DefaultResponse = await getUserApi(username + "");
        const user = res.data as UserObj

        if (user == null) {
            setLoading(false)
            return toast.error(lang.pages.user_finder.no_user_found_error);
        }

        setUser(user);
        router.push(`/user/${user.username}`)
    }

    const handleSubmit = async (e: unknown) => {
        // @ts-ignore
        e.preventDefault();
    }

    useEffect(() => {
        //toast.error("Поставщик пользователя вернул NULL")
        setLoading(false)
    }, []);

    return (
        <>

            {loading && (
                <LoadingPage/>
            )}

            {!loading && (
                <main className="flex items-center justify-center min-h-screen">
                    <div className="max-w-lg w-full mx-3">
                        <form onSubmit={handleSubmit}
                            className="bg-primary_light rounded-lg shadow-xl overflow-hidden"
                        >
                            <div className="p-4">
                                <h1 className="text-3xl font-bold text-center text-white">{lang.pages.user_finder.title}</h1>
                                <p className="text-center">{lang.pages.user_finder.subtitle}</p>
                            </div>
                            <div className="p-4">
                                <div className="mb-4">
                                    <input
                                        placeholder={lang.pages.user_finder.input_placeholder}
                                        className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm"
                                        required
                                        autoComplete="new-password"
                                        type="text"
                                        name="username"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className="mb-4">
                                    <button
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-telegram hover:bg-telegram-brightest hover:text-primary focus:outline-none transition-all duration-200 transform"
                                        type={"submit"}
                                        onClick={findUser}
                                    >
                                        {lang.pages.user_finder.button_text}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            )}
        </>
    )
}
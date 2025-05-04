"use client";

import {JSX, useEffect, useState} from "react";
/*import "@/app/debug.css";*/
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {usePage} from "@/context/PageContext";
import {errorToast, getUserRoleBadge, okToast} from "@/lib/client";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import {useTranslation} from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";
import { MdOutlineEmail, MdEdit, MdOutlineStorage, MdFilterList } from "react-icons/md";
import { FaDiscord, FaShieldAlt, FaSave, FaCalendarAlt } from "react-icons/fa";
import {FaPhone, FaFilter, FaLink, FaXmark} from "react-icons/fa6";
import {DateChart} from "@/components/DateChart";
import {UserPopupCard} from "@/components/UserPopupCard";
import {UserObj} from "@/types/user";
import {getImageCountStatsOnDate, getUserDiscordConnection, revokeUserDiscordConnection} from "@/lib/apiGetters";
import {PairType} from "@/types/core";
import {DatePickerComp} from "@/components/DatePickerComp";
import {ErrorPage} from "@/components/ErrorPage";
import {useRouter} from "next/navigation";
import {DiscordConnection} from "@/types/discord";

export default function HomeProfilePage(): JSX.Element {

    const { user, loadingUser, error } = useUser();
    const { pageName, setPage } = usePage();
    const [ loading, setLoading ] = useState<boolean>(true)
    const [ apiKey, setApiKey ] = useState<string>("********");
    const lang: LanguageModel = useTranslation();

    const [fetchError, setFetchError] = useState(false);
    const [fetchErrorMessage, setFetchErrorMessage] = useState<string>("Error fetching data");

    const [showCard, setShowCard] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const [isEditing, setIsEditing] = useState(false);
    const [editedEmail, setEditedEmail] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [currentEmail, setCurrentEmail] = useState<string>("");

    const [discordConnection, setDiscordConnection] = useState<DiscordConnection | null>();

    const [graphDataLabels, setGraphDataLabels] = useState<string[]>([]);
    const [graphDataValuesImages, setGraphDataValuesImages] = useState<number[]>([]);
    const [graphDataValuesPastes, setGraphDataValuesPastes] = useState<number[]>([]);
    const [graphDataValuesUrls, setGraphDataValuesUrls] = useState<number[]>([]);

    const router = useRouter()

    const [graphDateFrom, setGraphDateFrom] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 9);
        return d;
    })
    const [graphDateTo, setGraphDateTo] = useState<Date>(new Date());

    const handleMouseEnter = () => setShowCard(true);
    const handleMouseLeave = () => setShowCard(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        //console.log(e.clientX, e.clientY)
        setPosition({ x: e.clientX, y: e.clientY });
    };

    const revokeDiscordConnection = async () => {
        if (!discordConnection || !user) return;
        const res = await revokeUserDiscordConnection(user.apiKey);
        if (res) {
            setDiscordConnection(null);
            okToast("Discord connection revoked", 1000)
        } else {
            errorToast("Cannot revoke discord connection", 1000)
        }
    }

    const handleEmailSave = async () => {
        setEditedEmail(currentEmail);
        errorToast(lang.toasts.error.email_change, 1000)
        setIsEditing(false);
    };

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
        okToast(lang.toasts.success.copied_to_clipboard, 300)
    }

    const updateGraphData = async (from: Date, to: Date) => {
        if (user == null) return;
        const data = await getImageCountStatsOnDate(from.toISOString().split("T")[0], to.toISOString().split("T")[0], user.apiKey);
        console.log(JSON.stringify(data) + "<<")

        const arrImages = data["message"]["imagesPerDay"] as PairType[]
        const arrPastes = data["message"]["pastesPerDay"] as PairType[]
        const arrUrls = data["message"]["urlsPerDay"] as PairType[]

        console.log("Graph data: " + data["message"])
        console.log("arrImages: " + arrImages)

        // set labels
        const labelArr: string[] = arrImages.map(p => p.first)
        setGraphDataLabels(labelArr)

        // set values
        const valuesArrImages: number[] = arrImages.map(p => p.second)
        const valuesArrIPastes: number[] = arrPastes.map(p => p.second)
        const valuesArrIUrls: number[] = arrUrls.map(p => p.second)
        setGraphDataValuesImages(valuesArrImages)
        setGraphDataValuesPastes(valuesArrIPastes)
        setGraphDataValuesUrls(valuesArrIUrls)
    }

    useEffect(() => {
        setPage("profile")

        if (error == 'User not found.') {
            return router.push("/login");
        }

        if (error) {
            setFetchErrorMessage(error)
            setFetchError(true);
            setLoading(false)
            console.log("ERROR IS " + error)
            return;
        }
        if (loadingUser || !user) {
            return;
        }

        setEditedEmail(user.email)
        setCurrentEmail(user.email)
        setLoading(false);
        updateGraphData(graphDateFrom, graphDateTo)
        const getDiscordStatus = async () => {
            const discordConnection = await getUserDiscordConnection(user.apiKey)
            setDiscordConnection(discordConnection)
        }
        getDiscordStatus();
    }, [user, loadingUser, error])

    const handleGraphDataChange = (from: Date, to: Date) => {
        setGraphDateFrom(from)
        setGraphDateTo(to)
        updateGraphData(from, to)
    };

    if (loading || !user) return <LoadingPage/>

    if (fetchError) {
        return <ErrorPage message={fetchErrorMessage} lang={lang} callBack={()=> {
            router.replace("/")
        }} />
    }

    return (
        <>
            <main className={"flex flex-col xl:ml-[70px] ml-0 w-full xl:pt-12 xl:px-12 lg:px-32 px-2 pt-10"}>

                <div>
                    <h1 className={"text-4xl text-center"}>{lang.pages.profile.title}</h1>
                </div>

                <div className={"flex xl:flex-row flex-col gap-4 mt-20 w-full xl:items-start items-center justify-center"}>
                    <div className={"flex flex-col xl:w-[30%] w-full"}>
                        {/*Profile card*/}
                        <div onMouseMove={handleMouseMove} className={"flex flex-col p-4 items-center border-white rounded-sm border-2"}>

                            {/*Profile card avatar*/}
                            <div className={"lg:w-32 lg:h-32 w-16 h-16"}>
                                <img src={user.avatar ? user.avatar : "/images/default-avatar.svg"} className={"rounded-full lg:w-32 lg:h-32 w-16 h-16 border-gray-400 border-4"} />
                            </div>

                            {/*Profile card username*/}
                            <p className={"lg:text-3xl text-xl font-bold text-yellow-500 mb-2"}>{user.username}</p>

                            {getUserRoleBadge(user.role)}

                            <div className={"flex my-4 gap-4"}>
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                            </div>

                            <div className={"px-1 w-full"}>

                                {/*Profile card API key*/}
                                <div className={"flex flex-row justify-between"}>
                                    <p className={"lg:text-lg text-md font-bold mr-5"}>{lang.global.api_key_input_placeholder}</p>

                                    <div className={"flex gap-5 justify-center items-center"}>
                                        {/*<p className={"text-lg"}>{apiKey}</p>*/}
                                        <b data-tooltip-id="my-tooltip" data-tooltip-content={apiKey.includes("***") ? "" : lang.global.click_to_copy} data-tooltip-place="top" onClick={copyKey} className={`${apiKey.includes("***") ? "select-none" : "cursor-pointer text-telegram"} mr-2`}>{apiKey}</b>
                                        <button className={"transition-all duration-200 hover:-translate-y-0.5"} onClick={apiKeyToggle} data-tooltip-id="my-tooltip" data-tooltip-content={apiKey.includes("***") ? lang.global.click_to_show : lang.global.click_to_hide}>
                                            {
                                                apiKey.includes("***") ? <FaEyeSlash className={"w-6 h-6"} /> : <FaEye className={"w-6 h-6"} />
                                            }
                                        </button>
                                    </div>
                                </div>

                                <hr className={"w-full rounded-full border-opacity-50 border-[1px] border-gray-100 opacity-80 my-2"} />

                                {/*Profile card creation date*/}
                                <div className={"flex flex-row justify-between"}>
                                    <p className={"lg:text-lg text-md font-bold lg:mr-5 mr-2"}>{lang.global.joined_date_text}</p>

                                    <p className={"lg:text-lg text-md"}>{new Date(user.createdAt).toLocaleString()}</p>
                                </div>

                                <hr className={"w-full rounded-full border-opacity-50 border-[1px] border-gray-100 opacity-80 my-2"} />

                                {/*Profile card invited by*/}
                                <div className={"flex flex-row justify-between"}>
                                    <p className={"lg:text-lg text-md font-bold mr-5"}>{lang.global.invited_by_text}</p>

                                    {
                                        user.invitor ? (
                                            <a
                                                onMouseEnter={handleMouseEnter}
                                                onMouseLeave={handleMouseLeave}
                                                className={"text-telegram font-bold"} href={"/user/" + user.invitor.username}
                                            >
                                                {user.invitor.username}
                                            </a>
                                        ) : (
                                            <p className={"lg:text-lg text-md"}>N/A</p>
                                        )
                                    }
                                </div>

                                <hr className={"w-full rounded-full border-opacity-50 border-[1px] border-gray-100 opacity-80 my-2"} />

                                {/*Profile card storage used*/}
                                <div className={"flex flex-row justify-between"}>
                                    <p className={"lg:text-lg text-md font-bold mr-5"}>{lang.global.storage_used_text}</p>

                                    <p className={"lg:text-lg text-md"}>{Math.round(user.stats.storageUsed / 1024 / 1024) + " MB"}</p>
                                </div>
                            </div>


                            {/*Profile card buttons*/}
                            <div className={"flex flex-row mt-3 gap-4"}>


                            </div>

                        </div>
                    </div>

                    {/*right-side*/}
                    <div className={"flex flex-col xl:w-[59%] w-full gap-4"}>

                        {/*Profile settings*/}
                        <div className={"flex flex-col p-6 items-center border-white rounded-sm border-2 w-full"}>

                            {/*Email field*/}
                            <div className={"flex flex-row justify-between w-full"}>
                                <div className={"flex flex-row gap-4 items-center"}>
                                    <MdOutlineEmail className={"lg:text-2xl text-lg"} />
                                    <p className={"lg:text-3xl text-lg font-bold mr-5"}>Email</p>
                                </div>

                                <div className={"flex flex-row lg:gap-6 gap-3"}>
                                    {isEditing ? (
                                        <>
                                            <input
                                                className="text-2xl border-b-2 border-gray-300 focus:outline-none focus:border-yellow-500 transition-all duration-200 bg-transparent"
                                                value={editedEmail}
                                                onChange={(e) => setEditedEmail(e.target.value)}
                                                disabled={isSaving}
                                            />
                                            <button
                                                onClick={handleEmailSave}
                                                disabled={isSaving}
                                                data-tooltip-id="my-tooltip"
                                                data-tooltip-content={lang.global.click_to_save}
                                                data-tooltip-place="top"
                                                className={`transition-all duration-200 hover:-translate-y-0.5 ${
                                                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                                                }`}
                                            >
                                                <FaSave className="w-6 h-6 text-green-500" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="lg:text-3xl text-lg">{currentEmail}</p>
                                            <button
                                                className="transition-all duration-200 hover:-translate-y-0.5"
                                                data-tooltip-id="my-tooltip"
                                                data-tooltip-content={lang.global.click_to_edit}
                                                data-tooltip-place="top"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <MdEdit className="w-6 h-6" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <hr className={"w-full rounded-full border-opacity-10 border-[1px] border-gray-100 my-6"} />

                            {/*Phone field*/}
                            <div className={"flex flex-row justify-between w-full"}>

                                <div className={"flex flex-row gap-4 items-center"}>
                                    <FaPhone className={"lg:text-2xl text-lg"} />
                                    <p className={"lg:text-3xl text-lg font-bold mr-5"}>Phone</p>
                                </div>


                                <div className={"flex flex-row gap-6"}>
                                    <p className={"lg:text-3xl text-lg"}>{lang.global.disabled_text}</p>
                                    <button className={"transition-all duration-200 hover:-translate-y-0.5"} data-tooltip-id="my-tooltip" data-tooltip-content={lang.global.click_to_edit} data-tooltip-place="top">

                                    </button>
                                </div>
                            </div>

                            <hr className={"w-full rounded-full border-opacity-10 border-[1px] border-gray-100 my-6"} />

                            {/*Discord field*/}
                            <div className={"flex flex-row justify-between w-full"}>

                                <div className={"flex flex-row gap-4 items-center"}>
                                    <FaDiscord className={"lg:text-2xl text-lg"} />
                                    <p className={"lg:text-3xl text-lg font-bold mr-5"}>Discord</p>
                                </div>

                                {
                                    discordConnection ? (
                                        <>
                                            <div className={"flex flex-row lg:gap-4 gap-3 items-center mr-2"}>
                                                <img src={"https://cdn.discordapp.com/avatars/" + discordConnection.discordId + "/" + discordConnection.avatar + ".png"} className={"rounded-full lg:w-10 lg:h-10 w-8 h-8 border-gray-400 border-2"} />
                                                <span className={"text-3xl font-bold mb-1"}>{discordConnection.username}</span>
                                                <FaXmark onClick={revokeDiscordConnection} className={"text-red-500 w-8 h-8 cursor-pointer duration-200 hover:-translate-y-0.5"} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={"flex flex-row lg:gap-6 gap-3 items-center"}>
                                                <p className={"lg:text-3xl text-lg"}>{user.socials?.discord ? user.socials.discord : lang.global.not_connected_text}</p>
                                                <a
                                                    className={"transition-all duration-200 hover:-translate-y-0.5"}
                                                    data-tooltip-id="my-tooltip"
                                                    data-tooltip-content={lang.global.click_to_connect}
                                                    data-tooltip-place="top"
                                                    href={process.env.NEXT_PUBLIC_DISCORD_LOGIN_URL}
                                                >
                                                    <FaLink className={"lg:text-2xl text-xl"} />
                                                </a>

                                            </div>
                                        </>
                                    )
                                }
                            </div>

                            <hr className={"w-full rounded-full border-opacity-10 border-[1px] border-gray-100 my-6"} />

                            {/*2FA field*/}
                            <div className={"flex flex-row justify-between w-full"}>

                                <div className={"flex flex-row gap-4 items-center"}>
                                    <FaShieldAlt className={"lg:text-2xl text-lg"} />
                                    <p className={"lg:text-3xl text-lg font-bold mr-5"}>2FA</p>
                                </div>


                                <div className={"flex flex-row gap-6"}>
                                    <p className={"lg:text-3xl text-lg"}>{lang.global.disabled_text}</p>
                                    <button className={"transition-all duration-200 hover:-translate-y-0.5"} data-tooltip-id="my-tooltip" data-tooltip-content={lang.global.click_to_edit} data-tooltip-place="top">

                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={"flex flex-col p-6 border-white rounded-sm border-2 w-full"}>
                            <div className={"flex lg:flex-row flex-col lg:gap-6 gap-2 justify-between items-center"}>

                                <p className={"text-3xl ml-2 font-bold"}>Stats</p>

                                <div className={"flex flex-row items-center lg:gap-10 gap-4 py-3 lg:px-10 px-4 bg-secondary rounded-full"}>
                                    <div className={"flex flex-row items-center lg:text-xl text-lg"}>
                                        <FaFilter />
                                        <span className={"ml-2"}>Filter by</span>
                                    </div>
                                    <DatePickerComp onDateChangeAction={handleGraphDataChange} />
                                    {/*<button className={"text-xl p-2 border-2 border-gray-400 rounded-lg flex items-center gap-2 font-bold"}>
                                        <FaCalendarAlt /> Date
                                    </button>*/}
                                    {/*<button className={"text-xl p-2 border-2 border-gray-400 rounded-lg flex items-center gap-2 font-bold"}>
                                        <MdOutlineStorage /> Size
                                    </button>
                                    <button className={"text-xl p-2 border-2 border-gray-400 rounded-lg flex items-center gap-2 font-bold"}>
                                        <MdFilterList /> Type
                                    </button>*/}
                                </div>
                            </div>

                            <div className={"p-2 bg-secondary rounded-xl w-full mt-4 lg:h-80 h-[200px]"}>
                                {/* Chart component */}
                                <DateChart data={{
                                    labels: graphDataLabels,
                                    datasets: [
                                        {
                                            label: 'Images Uploaded',
                                            data: graphDataValuesImages,
                                            borderColor: 'red',
                                            fill: true,
                                        },
                                        {
                                            label: 'Pastes Created',
                                            data: graphDataValuesPastes,
                                            borderColor: 'orange',
                                            fill: false,
                                        },
                                        {
                                            label: 'URL Shortened',
                                            data: graphDataValuesUrls,
                                            borderColor: 'cyan',
                                            fill: false,
                                        },
                                    ],
                                }}/>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {
                user.invitor && (
                    <div
                        className={`pointer-events-none transition-all duration-200 ease-out transform ${
                            showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        } absolute bg-secondary shadow-lg border rounded-xl p-4 z-50 flex flex-row gap-4`}
                        style={{ top: position.y + 10, left: position.x + 20 }}
                    >
                        <UserPopupCard user={user.invitor as UserObj} lang={lang} />
                    </div>
                )
            }
        </>
    )
}
"use client";

import { JSX, useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import { usePage } from "@/context/PageContext";
import { errorToast, getUserRoleBadge, okToast } from "@/lib/client";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";
import { MdOutlineEmail, MdEdit, MdOutlineStorage } from "react-icons/md";
import { FaDiscord, FaShieldAlt } from "react-icons/fa";
import { FaPhone, FaLink, FaXmark, FaFilter } from "react-icons/fa6";
import { UserPopupCard } from "@/components/UserPopupCard";
import { UserObj } from "@/types/user";
import { getImageCountStatsOnDate, getUserDiscordConnection, revokeUserDiscordConnection } from "@/lib/apiGetters";
import { PairType } from "@/types/core";
import { DatePickerComp } from "@/components/DatePickerComp";
import { ErrorPage } from "@/components/ErrorPage";
import { useRouter } from "next/navigation";
import { DiscordConnection } from "@/types/discord";
import { useIsMobile } from "@/hooks/utils";
import { useHoverCard } from "@/hooks/useHoverCard";
import { ImEmbed2 } from "react-icons/im";
import DateChartECharts from "@/components/DateChartECharts";
import '@/app/drag.css';

export default function HomeProfilePage(): JSX.Element {
    const { user, loadingUser, error } = useUser();
    const { setPage } = usePage();
    const [loading, setLoading] = useState<boolean>(true);
    const [apiKey, setApiKey] = useState<string>("********");
    const lang: LanguageModel = useTranslation();

    const [fetchError, setFetchError] = useState(false);
    const [fetchErrorMessage, setFetchErrorMessage] = useState<string>("Error fetching data");

    const [isEditing, setIsEditing] = useState(false);
    const [editedEmail, setEditedEmail] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [currentEmail, setCurrentEmail] = useState<string>("");

    const [discordConnection, setDiscordConnection] = useState<DiscordConnection | null>();

    const [graphDataLabels, setGraphDataLabels] = useState<string[]>([]);
    const [graphDataValuesImages, setGraphDataValuesImages] = useState<number[]>([]);
    const [graphDataValuesPastes, setGraphDataValuesPastes] = useState<number[]>([]);
    const [graphDataValuesUrls, setGraphDataValuesUrls] = useState<number[]>([]);

    const router = useRouter();

    const [graphDateFrom, setGraphDateFrom] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 9);
        return d;
    });
    const [graphDateTo, setGraphDateTo] = useState<Date>(new Date());

    const isMobile = useIsMobile();

    const {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    } = useHoverCard(isMobile);

    const revokeDiscordConnectionHandler = async () => {
        if (!discordConnection || !user) return;
        const res = await revokeUserDiscordConnection(user.apiKey);
        if (res) {
            setDiscordConnection(null);
            okToast("Discord connection revoked", 1000);
        } else {
            errorToast("Cannot revoke discord connection", 1000);
        }
    };

    const handleEmailSave = async () => {
        setEditedEmail(currentEmail);
        errorToast(lang.toasts.error.email_change, 1000);
        setIsEditing(false);
    };

    const apiKeyToggle = () => {
        if (user?.apiKey == null) return;
        if (!apiKey.includes("***")) {
            setApiKey("*".repeat(user.apiKey.length));
        } else {
            setApiKey(user.apiKey);
        }
    };

    const copyKey = () => {
        if (apiKey.includes("***")) return;
        navigator.clipboard.writeText(user?.apiKey || "");
        okToast(lang.toasts.success.copied_to_clipboard, 300);
    };

    const updateGraphData = async (from: Date, to: Date) => {
        if (user == null) return;
        const data = await getImageCountStatsOnDate(
            from.toISOString().split("T")[0],
            to.toISOString().split("T")[0],
            user.apiKey
        );

        const arrImages = data["message"]["imagesPerDay"] as PairType[];
        const arrPastes = data["message"]["pastesPerDay"] as PairType[];
        const arrUrls = data["message"]["urlsPerDay"] as PairType[];

        const labelArr: string[] = arrImages.map((p) => p.first);
        setGraphDataLabels(labelArr);
        setGraphDataValuesImages(arrImages.map((p) => p.second));
        setGraphDataValuesPastes(arrPastes.map((p) => p.second));
        setGraphDataValuesUrls(arrUrls.map((p) => p.second));
    };

    useEffect(() => {
        setPage("profile");

        if (error == "User not found.") {
            return router.push("/login");
        }

        if (error) {
            setFetchErrorMessage(error);
            setFetchError(true);
            setLoading(false);
            return;
        }
        if (loadingUser || !user) return;

        setEditedEmail(user.email);
        setCurrentEmail(user.email);
        setLoading(false);
        updateGraphData(graphDateFrom, graphDateTo);
        const getDiscordStatus = async () => {
            const dc = await getUserDiscordConnection(user.apiKey);
            setDiscordConnection(dc);
        };
        getDiscordStatus();
    }, [user, loadingUser, error]);

    const handleGraphDataChange = (from: Date, to: Date) => {
        setGraphDateFrom(from);
        setGraphDateTo(to);
        updateGraphData(from, to);
    };

    if (loading || !user) return <LoadingPage />;

    if (fetchError) {
        return (
            <ErrorPage
                message={fetchErrorMessage}
                lang={lang}
                callBack={() => {
                    router.replace("/");
                }}
            />
        );
    }

    return (
        <>
            {/* Solid background and safe content area; no w-full on the top-level to avoid overflow with sidebar */}
            <section className="flex-1 min-w-0">
                {/* Centered container in a Vercel-like style */}
                <div className="mx-auto max-w-6xl px-3 md:px-6 py-10 md:py-12">
                    <header className="text-center">
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                            {lang.pages.profile.title}
                        </h1>
                    </header>

                    {/* Responsive two-column layout on xl, stacked on mobile */}
                    <div className="mt-8 grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4 md:gap-6">
                        {/* Left column: profile summary */}
                        <div className="space-y-4">
                            {/* Profile Card */}
                            <div
                                onMouseMove={handleMouseMove}
                                className="rounded-2xl box-primary p-5"
                            >
                                {/* Avatar */}
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
                                        <img
                                            src={user.avatar ? user.avatar : "/images/default-avatar.svg"}
                                            className="rounded-full w-full h-full border border-white/20 object-cover"
                                        />
                                    </div>

                                    {/* Username + role */}
                                    <p className="text-2xl sm:text-3xl font-bold text-yellow-400 mt-3">
                                        {user.username}
                                    </p>
                                    <div className="mt-2">{getUserRoleBadge(user.role)}</div>
                                </div>

                                <div className="my-5 h-px bg-white/10" />

                                {/* API key */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm md:text-base font-semibold">
                                            {lang.global.api_key_input_placeholder}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <b
                                                data-tooltip-id="my-tooltip"
                                                data-tooltip-content={
                                                    apiKey.includes("***") ? "" : lang.global.click_to_copy
                                                }
                                                data-tooltip-place="top"
                                                onClick={copyKey}
                                                className={`${
                                                    apiKey.includes("***")
                                                        ? "select-none"
                                                        : "cursor-pointer text-sky-400"
                                                } truncate max-w-[160px] sm:max-w-[240px]`}
                                                title={apiKey}
                                            >
                                                {apiKey}
                                            </b>
                                            <button
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 transition"
                                                onClick={apiKeyToggle}
                                                data-tooltip-id="my-tooltip"
                                                data-tooltip-content={
                                                    apiKey.includes("***")
                                                        ? lang.global.click_to_show
                                                        : lang.global.click_to_hide
                                                }
                                            >
                                                {apiKey.includes("***") ? (
                                                    <FaEyeSlash className="h-5 w-5" />
                                                ) : (
                                                    <FaEye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Joined */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm md:text-base font-semibold">
                                            {lang.global.joined_date_text}
                                        </p>
                                        <p className="text-sm md:text-base">
                                            {new Date(user.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Invited by */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm md:text-base font-semibold">
                                            {lang.global.invited_by_text}
                                        </p>
                                        {user.invitor ? (
                                            <a
                                                onMouseEnter={handleMouseEnter}
                                                onMouseLeave={handleMouseLeave}
                                                className="text-sky-400 font-semibold hover:underline"
                                                href={"/user/" + user.invitor.username}
                                            >
                                                {user.invitor.username}
                                            </a>
                                        ) : (
                                            <p className="text-sm md:text-base">N/A</p>
                                        )}
                                    </div>

                                    {/* Storage used */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm md:text-base font-semibold">Storage used</p>
                                        <p className="text-sm md:text-base">
                                            {Math.round(user.stats.storageUsed / 1024 / 1024) + " MB"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription (placeholder) */}
                            <div className="box-primary p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MdOutlineStorage className="text-xl" />
                                        <p className="text-lg font-semibold">Subscription</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-white/20" />
                                        <span className="h-2 w-2 rounded-full bg-white/20" />
                                        <span className="h-2 w-2 rounded-full bg-white/20" />
                                    </div>
                                </div>
                            </div>

                            {/* ShareX config download */}
                            <div className="box-primary p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <ImEmbed2 className="text-xl" />
                                    <p className="text-lg font-semibold">Download ShareX config file</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <a
                                        href={"/static/space-img.sxcu"}
                                        className="rounded-xl bg-black/60 hover:bg-black/70 text-center font-semibold p-2 transition"
                                    >
                                        Image
                                    </a>
                                    <a
                                        href={"/static/space-text.sxcu"}
                                        className="rounded-xl bg-black/60 hover:bg-black/70 text-center font-semibold p-2 transition"
                                    >
                                        Text
                                    </a>
                                    <a
                                        href={"/static/space-url.sxcu"}
                                        className="rounded-xl bg-black/60 hover:bg-black/70 text-center font-semibold p-2 transition"
                                    >
                                        URL
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Right column: settings + stats */}
                        <div className="space-y-4 min-w-0">
                            {/* Settings card */}
                            <div className="box-primary p-5 md:p-6 space-y-6">
                                {/* Email */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <MdOutlineEmail className="text-xl" />
                                        <p className="text-xl md:text-2xl font-bold">Email</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isEditing ? (
                                            <>
                                                <input
                                                    className="text-lg md:text-xl border-b border-white/20 focus:outline-none focus:border-yellow-400 bg-transparent"
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
                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 transition ${
                                                        isSaving ? "opacity-50 cursor-not-allowed" : ""
                                                    }`}
                                                >
                                                    <svg
                                                        className="w-5 h-5 text-green-500"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.4-1.4z" />
                                                    </svg>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-lg md:text-2xl break-all">{currentEmail}</p>
                                                <button
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 transition"
                                                    data-tooltip-id="my-tooltip"
                                                    data-tooltip-content={lang.global.click_to_edit}
                                                    data-tooltip-place="top"
                                                    onClick={() => setIsEditing(true)}
                                                >
                                                    <MdEdit className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* Phone */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <FaPhone className="text-xl" />
                                        <p className="text-xl md:text-2xl font-bold">Phone</p>
                                    </div>
                                    <div className="text-lg">{lang.global.disabled_text}</div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* Discord */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <FaDiscord className="text-xl" />
                                        <p className="text-xl md:text-2xl font-bold">Discord</p>
                                    </div>

                                    {discordConnection ? (
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    "https://cdn.discordapp.com/avatars/" +
                                                    discordConnection.discordId +
                                                    "/" +
                                                    discordConnection.avatar +
                                                    ".png"
                                                }
                                                className="rounded-full w-8 h-8 sm:w-10 sm:h-10 border border-white/20"
                                            />
                                            <div className="flex flex-col">
                        <span className="text-lg md:text-xl font-bold">
                          {discordConnection.username}
                        </span>
                                                <span className="text-[10px] text-gray-400">
                          {"(" + discordConnection.discordId + ")"}
                        </span>
                                            </div>
                                            <FaXmark
                                                onClick={revokeDiscordConnectionHandler}
                                                className="text-red-500 w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:scale-105 transition"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <p className="text-lg md:text-xl">
                                                {user.socials?.discord
                                                    ? user.socials.discord
                                                    : lang.global.not_connected_text}
                                            </p>
                                            <a
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 transition"
                                                data-tooltip-id="my-tooltip"
                                                data-tooltip-content={lang.global.click_to_connect}
                                                data-tooltip-place="top"
                                                href={process.env.NEXT_PUBLIC_DISCORD_REGISTER_URL}
                                            >
                                                <FaLink className="text-xl" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* 2FA */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <FaShieldAlt className="text-xl" />
                                        <p className="text-xl md:text-2xl font-bold">2FA</p>
                                    </div>
                                    <div className="text-lg">{lang.global.disabled_text}</div>
                                </div>
                            </div>

                            {/* Stats + ECharts */}
                            <div className="box-primary p-5 md:p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <p className="text-2xl md:text-3xl font-bold">Stats</p>
                                    <div className="flex items-center gap-3 sm:gap-5 py-2 px-3 sm:px-5 bg-black/40 rounded-full border border-white/10">
                                        <div className="flex items-center text-base">
                                            <FaFilter />
                                            <span className="ml-2">Filter by</span>
                                        </div>
                                        <DatePickerComp onDateChangeAction={handleGraphDataChange} />
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl" style={{ height: "320px" }}>
                                    <DateChartECharts
                                        data={{
                                            labels: graphDataLabels,
                                            datasets: [
                                                {
                                                    label: "Images Uploaded",
                                                    data: graphDataValuesImages,
                                                    borderColor: "#ef4444",
                                                    fill: true,
                                                },
                                                {
                                                    label: "Pastes Created",
                                                    data: graphDataValuesPastes,
                                                    borderColor: "#f59e0b",
                                                    fill: false,
                                                },
                                                {
                                                    label: "URL Shortened",
                                                    data: graphDataValuesUrls,
                                                    borderColor: "#22d3ee",
                                                    fill: false,
                                                },
                                            ],
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {user.invitor && (
                <div
                    className={`pointer-events-none transition-all duration-200 ease-out transform ${
                        showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    } absolute bg-neutral-900/90 border border-white/10 rounded-xl p-4 z-50`}
                    style={{ top: position.y + 10, left: position.x + 20 }}
                >
                    <UserPopupCard user={user.invitor as UserObj} lang={lang} />
                </div>
            )}
        </>
    );
}
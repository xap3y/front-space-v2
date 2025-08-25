"use client";


import {usePage} from "@/context/PageContext";
import {useEffect, useState} from "react";
import {useUser} from "@/hooks/useUser";
import {useRouter} from "next/navigation";
import defaultPeriodStats, {PeriodStats} from "@/types/stats";
import {getPeriodStats} from "@/lib/apiPoster";
import {UserPopupCard} from "@/components/UserPopupCard";
import {UserObj} from "@/types/user";
import {useTranslation} from "@/hooks/useTranslation";
import {DashboardCard, SplitterLine, StatisticBoxLine} from "@/components/sets/DashboardsComponents";
import LoadingPage from "@/components/LoadingPage";

export default function HomeDashboardPage() {

    const { pageName, setPage } = usePage();
    const { user, loadingUser, error } = useUser();
    const router = useRouter();
    //const [ periodStats, setPeriodStats ] = useState<PeriodStats>(defaultPeriodStats)

    const [ todayPeriodStats, setTodayPeriodStats ] = useState<PeriodStats>(defaultPeriodStats)
    const [ weekPeriodStats, setWeekPeriodStats ] = useState<PeriodStats>(defaultPeriodStats)
    const [ monthPeriodStats, setMonthPeriodStats ] = useState<PeriodStats>(defaultPeriodStats)
    const [ yesterdayPeriodStats, setYesterdayPeriodStats ] = useState<PeriodStats>(defaultPeriodStats)

    const lang = useTranslation();

    const [showCard, setShowCard] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const handleMouseEnter = () => setShowCard(true);
    const handleMouseLeave = () => setShowCard(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
    };


    useEffect(() => {
        if (loadingUser) {
            return;
        }
        else if (error == 'User not found.') {
            //console.log("USER NOT FOUND")
            return router.push("/login");
        }
    }, [user, loadingUser, error])

    useEffect(() => {

        const fetch = async () => {
            setTodayPeriodStats(await getPeriodStats("TODAY"));
            setMonthPeriodStats(await getPeriodStats("LAST_30_DAYS"));
            setWeekPeriodStats(await getPeriodStats("LAST_7_DAYS"));
            setYesterdayPeriodStats(await getPeriodStats("YESTERDAY"));
        }

        fetch()
        setPage("home")
    }, [])

    if (loadingUser || !user) return <LoadingPage/>

    return (
        <>
            <div className={"w-full max-h-screen overflow-y-scroll"}>
                <h1 className={"text-center font-bold text-4xl mt-4"}>Dashboard</h1>

                <div className={"mt-12 items-center p-2 w-full flex justify-center"}>

                    <div className={"flex flex-col justify-center rounded-xl items-center gap-1 py-5"}>
                        <h1 className={"text-4xl font-bold"}>Statistics</h1>
                        <div className={"flex lg:flex-row flex-col justify-center items-center gap-6 py-5 flex-wrap"}>


                            <DashboardCard title={"Uploaded Images"}>
                                <StatisticBoxLine title={"Today"} value={todayPeriodStats.image.total} />

                                <SplitterLine />

                                <StatisticBoxLine title={"Yesterday"} value={yesterdayPeriodStats.image.total} />

                                <SplitterLine />

                                <StatisticBoxLine title={"Last 7 days"} value={weekPeriodStats.image.total} />

                                <SplitterLine />

                                <StatisticBoxLine title={"Last 30 days"} value={monthPeriodStats.image.total} />
                            </DashboardCard>
                            
                            <DashboardCard title={"Created pastes"}>
                                <>
                                    <StatisticBoxLine title={"Today"} value={todayPeriodStats.paste.total} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Yesterday"} value={yesterdayPeriodStats.paste.total} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Last 7 days"} value={weekPeriodStats.paste.total} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Last 30 days"} value={monthPeriodStats.paste.total} />
                                </>
                            </DashboardCard>

                            <DashboardCard title={"URLs Shortened"}>
                                <>
                                    <StatisticBoxLine title={"Today"} value={todayPeriodStats.url.total} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Yesterday"} value={yesterdayPeriodStats.url.total} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Last 7 days"} value={weekPeriodStats.url.total} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Last 30 days"} value={monthPeriodStats.url.total} />
                                </>
                            </DashboardCard>

                            {/*<div className={"flex gap-10 flex-col p-4 rounded-xl bg-primary_light items-end justify-end"} onMouseMove={handleMouseMove}>
                                <p className={"text-2xl"}>Most active user</p>
                                <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className={"text-4xl font-bold"}>
                                    {monthPeriodStats.image.bestUploader ? (
                                        <>
                                            <a href={"/user/" + monthPeriodStats.image.bestUploader.user.username} className={"text-telegram hover:underline"}>
                                                {monthPeriodStats.image.bestUploader.user.username}
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <span>N/A</span>
                                        </>
                                    )}
                                </span>
                            </div>*/}

                            <DashboardCard title={"Storage used"}>
                                <>
                                    <StatisticBoxLine title={"Today"} value={((todayPeriodStats.storageUsed ? monthPeriodStats.storageUsed : 0) / 1024 / 1024).toFixed(2) + " MB"} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Yesterday"} value={((yesterdayPeriodStats.storageUsed ? monthPeriodStats.storageUsed : 0) / 1024 / 1024).toFixed(2) + " MB"} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Last 7 days"} value={((weekPeriodStats.storageUsed ? monthPeriodStats.storageUsed : 0) / 1024 / 1024).toFixed(2) + " MB"} />

                                    <SplitterLine />

                                    <StatisticBoxLine title={"Last 30 days"} value={((monthPeriodStats.storageUsed ? monthPeriodStats.storageUsed : 0) / 1024 / 1024).toFixed(2) + " MB"} />
                                </>
                            </DashboardCard>



                            {/*<div className={"flex gap-10 flex-col p-4 rounded-xl bg-primary_light items-end justify-end"}>
                                <p className={"text-2xl"}>Storage used (MB)</p>
                                <span className={"text-4xl font-bold"}>{((monthPeriodStats.storageUsed ? monthPeriodStats.storageUsed : 0) / 1024 / 1024).toFixed(2)}</span>
                            </div>*/}
                        </div>
                    </div>
                </div>
            </div>

            {
                monthPeriodStats.image.bestUploader && (
                    <div
                        className={`pointer-events-none transition-all duration-200 ease-out transform ${
                            showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        } absolute bg-secondary shadow-lg border rounded-xl p-4 z-50 flex flex-row gap-4`}
                        style={{ top: position.y + 10, left: position.x + 20 }}
                    >
                        <UserPopupCard user={monthPeriodStats.image.bestUploader.user as UserObj} lang={lang} />
                    </div>
                )
            }
        </>
    )
}
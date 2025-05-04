import LanguageModel from "@/types/LanguageModel";
import {FaArrowLeft} from "react-icons/fa";
import {JSX} from "react";


interface StatisticBoxLineProps {
    title: string;
    value: any;
}

export function StatisticBoxLine({title, value}: StatisticBoxLineProps) {
    return (
        <>
            <div className={"flex justify-between items-center"}>
                <span className={"text-lg"}>{title}</span>
                <span className={"text-xl font-bold"}>{value}</span>
            </div>
        </>
    )
}

interface DashboardCardProps {
    title: string;
    children: React.ReactNode;
}

export function DashboardCard({title, children}: DashboardCardProps) {
    return (
        <>
            <div className={"flex gap-10 flex-col p-4 rounded-xl bg-primary_light justify-end lg:min-w-[400px] min-w-[300px] items-center"}>
                <p className={"text-2xl text-center font-bold"}>{title}</p>

                <div className={"flex flex-col w-full px-2 gap-1"}>
                    {children}
                </div>

            </div>
        </>
    )
}

export function SplitterLine() {
    return <hr className={"w-full rounded-full border-opacity-10 border-[1px] border-gray-100 my-1"} />
}
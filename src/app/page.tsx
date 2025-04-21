import {NestedLinktree} from "@/components/NestedLinktree";
import {linktree} from "@/config/linktree";

export default function Home() {
    return (
        <>
            <div className={"flex flex-col justify-center items-center"}>

                <div className={"mt-10 font-bold text-4xl"}>
                    <h1>Xap3y's space v0.4</h1>
                </div>

                <div className={"flex flex-row gap-4 mt-20 text-telegram"}>

                    <a href={"/login"}>login</a>
                    <a href={"/home/dashboard"}> | dashboard</a>
                    <a href={"/i"}> | img finder</a>
                </div>
            </div>
        </>
    )
}

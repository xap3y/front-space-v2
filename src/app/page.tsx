import {NestedLinktree} from "@/components/NestedLinktree";
import {linktree} from "@/config/linktree";

export default function Home() {
    return (
        <>
            <div>
                <p className={"text-xl mt-10"}>NODE_ENV: {process.env.NODE_ENV}</p>
                <p className={"text-xl"}>NEXT_PUBLIC_DEPLOY_URL: {process.env.NEXT_PUBLIC_DEPLOY_URL}</p>
                <p className={"text-xl"}>API_URL: {process.env.API_URL}</p>
                <p className={"text-xl"}>GIT_REMOTE: {process.env.GIT_REMOTE}</p>

                <div className={"flex flex-col mt-20 ml-6 gap-2"}>
                    <p>NestedLinktree: </p>
                    <div className={"flex flex-col ml-2"}>
                        {/*<ListedLink label={"API DOCS"} href={"https://space-docs.xap3y.tech"}/>
                        <ListedLink label={"API #1"} href={"https://call.xap3y.tech"}/>
                        <ListedLink label={"API #2"} href={"https://api.xap3y.tech"}/>*/}

                        <NestedLinktree links={linktree} />
                    </div>
                </div>
            </div>

        </>
    )
}

import EmailPage from "@/app/email/client";

export default async function Page() {
    return (
        <>
            <div className={"flex items-center justify-center md:p-4 p-0 overflow-x-hidden"}>
                <EmailPage />
            </div>

        </>
    )
}
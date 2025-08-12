import EmailPage from "@/app/email/client";

export default async function Page() {
    return (
        <>
            <div className={"min-h-screen flex items-center justify-center p-4"}>
                <EmailPage />
            </div>

        </>
    )
}
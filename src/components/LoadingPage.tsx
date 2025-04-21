import Loading from "@/components/Loading";

export default function LoadingPage() {
    return (
        <div className={"flex h-screen w-screen"}>
            <div className={"m-auto"}>
                <Loading/>
            </div>
        </div>
    );
}
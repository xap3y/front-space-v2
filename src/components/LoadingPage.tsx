import Loading from "@/components/Loading";

export default function LoadingPage() {
    return (
        <div className={"flex absolute z-50 h-screen w-screen"}>
            <div className={"m-auto"}>
                <Loading/>
            </div>
        </div>
    );
}
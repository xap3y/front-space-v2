import CustomVideoPlayer from "@/components/CustomVideoPlayer";

const TEST_VIDEO_URL = "https://r2.xap3y.eu/files/1788131139480-zpdied5lf.mp4";

export default function TestPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-primaryDotted bg-primaryDottedSize p-4 md:p-8">
            <div className="w-full max-w-5xl">
                <CustomVideoPlayer src={TEST_VIDEO_URL} />
            </div>
        </main>
    );
}

import Link from "next/link";
import {FaArrowLeft, FaHouse} from "react-icons/fa6";

export default function AuthenticatedPageNav() {
    return (
        <nav className="fixed left-3 top-3 z-40 flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-950/90 p-1.5 shadow-2xl backdrop-blur-md md:left-5 md:top-5" aria-label="Account navigation">
            <Link
                href="/home/dashboard"
                className="group flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                title="Back to dashboard"
            >
                <FaArrowLeft className="h-3.5 w-3.5 text-zinc-500 transition group-hover:-translate-x-0.5 group-hover:text-blue-400" />
                <FaHouse className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
            </Link>
        </nav>
    );
}

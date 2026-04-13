import './space.css';
import Link from "next/link";
import "./debug.css"

export default function Home() {

    return (
        <>
            <div className={"overflow-y-hidden custom-cursor flex flex-col justify-center items-center min-h-[90vh] lg:min-h-screen {/*bg-gradient-to-b from-[#0f1123] via-[#10121a] to-black*/}"}>
                <div className="flex flex-col items-center justify-center w-full px-4 ">
                    <h1
                        className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold text-center mb-10"
                        style={{
                            textShadow: "0 2px 16px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.2)"
                        }}
                    >
                        XAP3Y&apos;s SPACE
                    </h1>
                    <div className="flex flex-row gap-2 sm:gap-4 w-full max-w-lg justify-center items-center">
                        <Link href="/login" passHref>
                            <button
                                className="box-primary p-3"
                                type="button"
                            >
                                Login
                            </button>
                        </Link>
                        <Link href="/home/profile" passHref>
                            <button
                                className="box-primary p-3"
                                type="button"
                            >
                                Portal
                            </button>
                        </Link>
                        <Link href="/tempmail" passHref>
                            <button
                                className="box-primary p-3"
                                type="button"
                            >
                                Temp Mail
                            </button>
                        </Link>
                        {/*<Link href="/tempmail" passHref>
                            <button
                                className="box-primary p-3"
                                type="button"
                            >
                                Temp Mail
                            </button>
                        </Link>*/}
                        {/*<Link href="/i" passHref className={"outline-none"}>
                            <button
                                className="box-primary p-3"
                                type="button"
                            >
                                Img Finder
                            </button>
                        </Link>*/}
                    </div>
                </div>
            </div>
        </>
    )
}

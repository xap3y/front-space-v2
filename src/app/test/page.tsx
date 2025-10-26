"use client";

import {useState} from "react";

export default function TestPage() {

    const [isFocused, setIsFocused] = useState<boolean>(false);

    return (
        <>
            <main className={"flex p-20 gap-6"}>
                <div className={"box-primary p-5"}>
                    <h1>box-primary</h1>
                </div>

                <div className={"box-primary p-5 flex flex-col gap-6"}>
                    <div className={"space-y-2"}>
                        <p>default</p>
                        <input
                            className={"in-primary"}
                            placeholder={"in-primary"}
                        />
                    </div>

                    <div className={"space-y-2"}>
                        <p>value</p>
                        <input
                            className={"in-primary"}
                            placeholder={"in-primary"}
                            value={"text"}
                            disabled={true}
                        />
                    </div>

                    <div className={"space-y-2"}>
                        <p>animated</p>
                        <div className={`${isFocused ? "in-shadow" : "hover:border-zinc-700"} ${isFocused ? "border-zinc-500" : "border-primary0"} border duration-200 transition-all rounded`}>
                            <input
                                className={"p-3 bg-transparent rounded outline-none"}
                                placeholder={"in-primary"}
                                onFocus={(e) => setIsFocused(true)}
                                onBlur={(e) => setIsFocused(false)}
                            />
                        </div>
                    </div>
                </div>

                <div className={"box-primary p-5 flex flex-col gap-6 items-center"}>
                    <p>input states</p>
                    <div className={"space-y-2"}>
                        <p>normal</p>
                        <div className={`border-primary0 border duration-200 transition-all rounded`}>
                            <input
                                className={"p-3 bg-transparent rounded outline-none"}
                                placeholder={"in-primary"}
                            />
                        </div>
                    </div>

                    <div className={"space-y-2"}>
                        <p>hover</p>
                        <div className={`border-zinc-700 border duration-200 transition-all rounded`}>
                            <input
                                className={"p-3 bg-transparent rounded outline-none"}
                                placeholder={"in-primary"}
                            />
                        </div>
                    </div>

                    <div className={"space-y-2"}>
                        <p>focus</p>
                        <div className={`border-zinc-500 border in-shadow duration-200 transition-all rounded`}>
                            <input
                                className={"p-3 bg-transparent rounded outline-none"}
                                placeholder={"in-primary"}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
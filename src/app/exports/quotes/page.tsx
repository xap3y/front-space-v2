'use client';

import quotes from '@/config/quotes';

export default function QuotesExport() {

    return (
        <>
            <p>arr_length: {quotes.length}</p>

            <div className={"mt-44 w-1 h-1 border-2"}> </div>

            <div className={"flex w-full justify-center items-center flex-col gap-4"}>

                {quotes.map((quote, index) => {
                    return (
                        <>
                            <div className={"rounded-full border-2 border-white w-1 h-1"}>

                            </div>

                            <div className={"bg-primary flex gap-3"} key={index}>
                                <p className={"italic"}>{"\"" + quote.text + "\""}</p>
                                <p> - </p>
                                <p>{quote.author ? quote.author : "NULL"}</p>
                            </div>
                        </>
                    )
                })}
            </div>
        </>
    )
}
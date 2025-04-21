
import LanguageModel from "@/types/LanguageModel";
import {ShortUrlDto} from "@/types/url";

interface Props {
    url: ShortUrlDto;
    lang: LanguageModel
}

export function ShortUrlPopupCard({ lang, url }: Props) {

    if (!url || !url.urlSet) {
        return (
            <></>
        )
    }

    return (
        <>
            <div>
                <div className={"flex flex-row gap-2 items-center"}>
                    <p className="text-lg font-semibold">{url.uniqueId}</p>
                </div>

                <p className="text-xs text-gray-400 mt-1">
                    {"Created on " + new Date(url.createdAt || "").toLocaleDateString()} {/*TODO: LANGUAGE*/}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                    {"Points to " + url.originalUrl}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                    {"URL_set " + url.urlSet.customUrl}
                </p>
            </div>
        </>
    )
}
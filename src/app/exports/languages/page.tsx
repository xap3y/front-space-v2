import cs from "@/locales/cs"
import en from "@/locales/en"
import ru from "@/locales/ru"

export default async function Page() {
    return (
        <>
            <div>
                <p>ENG_en</p>
                <hr className="my-2 border-gray-300" />
                <p>
                    {JSON.stringify(en)}
                </p>
            </div>

            <hr className="my-2 border-gray-300" />

            <div>
                <p>CZ_cs</p>
                <hr className="my-2 border-gray-300" />
                <p>
                    {JSON.stringify(cs)}
                </p>
            </div>

            <hr className="my-2 border-gray-300" />

            <div>
                <p>RUS_ru</p>
                <hr className="my-2 border-gray-300" />
                <p>
                    {JSON.stringify(ru)}
                </p>
            </div>
        </>
    )
}
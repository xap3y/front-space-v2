import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

export default async function Page({
                                       params,
                                   }: {
    params: Promise<{ uniqueId: string }>;
}) {
    let uniqueId = (await params).uniqueId
    return (
        <>
            <div className={"h-full m-auto w-full"}>
                <h1>{uniqueId}</h1>
                <Zoom>
                    <img alt='Test Image' src={'http://192.168.100.101:8012/v1/image/get/' + uniqueId} />
                </Zoom>
            </div>
        </>
    )
}
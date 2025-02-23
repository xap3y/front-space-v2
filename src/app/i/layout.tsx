import {ImageProvider} from "@/context/ImageContext";

export default function ImageLayour({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return <ImageProvider>{children}</ImageProvider>
}
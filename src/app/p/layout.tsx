import {PasteProvider} from "@/context/PasteContext";

export default function PasteLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return <PasteProvider>{children}</PasteProvider>
}
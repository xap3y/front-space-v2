interface Props {
    label: string;
    href?: string;
}

export function ListedLink({label, href}: Props) {

    return (
        <>
            <div className={"text-blue-600"}>
                <a className={"no-underline hover:underline"} href={href}>{'>  ' + label}</a>
            </div>
        </>
    )
}
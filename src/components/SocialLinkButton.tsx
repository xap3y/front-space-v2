interface Props {
    href: string;
    children: React.ReactNode;
}

export function SocialLinkButton({ children, href }: Props) {

    return (
        <>
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={"text-gray-200 hover:text-gray-400 transition-all hover:-translate-y-1 transform-gpu duration-300"}
            >
                {children}
            </a>
        </>
    )
}
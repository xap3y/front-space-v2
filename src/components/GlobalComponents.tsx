
export function BetaBadge() {
    return (
        <>
            <span className="inline-flex items-center rounded-md border-2 border-yellow-500 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                Beta
            </span>
        </>
    )
}

interface LoadingDotProps {
    size?: string;
    className?: string;
}

export function LoadingDot({ size = 'w-4 h-4', className = '' }: LoadingDotProps) {
    return (
        <>
            <svg
                className={`animate-spin ml-2 inline text-telegram ${size} ${className}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </svg>
        </>
    )
}
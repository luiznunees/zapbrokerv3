export function DoodleArrowDown({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <path
                d="M15 12C15 12 22 55 45 68C68 81 85 60 85 60"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
            />
            <path
                d="M62 55L85 60L82 36"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    )
}

export function DoodleArrowCurl({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 60" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <path
                d="M5 45C25 15 55 10 78 28"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
            />
            <path
                d="M55 22L78 28L74 50"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    )
}

export function DoodleSquiggle({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 30" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <path
                d="M4 22C14 6 24 6 34 22C44 38 54 38 64 22C74 6 84 6 94 22C100 30 110 28 116 18"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
            />
        </svg>
    )
}

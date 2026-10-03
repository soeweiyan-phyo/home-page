/** Hexagonal shell around a live core: chip geometry, since it labels a
 * machine rather than a star field. Also public/favicon.svg. */
export default function SystemMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path
                d="M12 2.6 20.4 7.3v9.4L12 21.4 3.6 16.7V7.3z"
                opacity="0.85"
            />
            <path
                d="M12 6.4 17.1 9.2v5.6L12 17.6 6.9 14.8V9.2z"
                opacity="0.35"
            />
            <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
        </svg>
    )
}

import React from "react"

type Props = { className?: string }

export function AhrefsIcon({ className = "w-4 h-4" }: Props) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
			<path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7z" fill="#1e3a8a"/>
			<path d="M8.8 15.5v-7h1.8v2.4h2.8V8.5h1.8v7h-1.8v-2.9h-2.8v2.9H8.8z" fill="#ffffff"/>
		</svg>
	)
}

export function SemrushIcon({ className = "w-4 h-4" }: Props) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<circle cx="12" cy="12" r="10" fill="#f97316" />
			<path d="M6 12c3-3 9-3 12 0-3 3-9 3-12 0z" fill="#fff" />
		</svg>
	)
}

export function MozIcon({ className = "w-4 h-4" }: Props) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<rect x="3" y="4" width="18" height="16" rx="3" fill="#0ea5e9" />
			<path d="M6 15l2.5-6H10l2 4 2-4h1.5l2.5 6h-2l-1-2-1 2h-2l-1-2-1 2H6z" fill="#fff" />
		</svg>
	)
}

export default { AhrefsIcon, SemrushIcon, MozIcon }

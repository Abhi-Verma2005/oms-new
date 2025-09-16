import React from "react"
import Image from 'next/image'

type Props = { className?: string }

export function AhrefsIcon({ className = "h-4" }: Props) {
	return (
		<span className={`inline-block ${className}`} style={{ lineHeight: 0 }}>
			<Image src="/images/logo_ahrefs.svg" alt="Ahrefs" className="h-full w-auto" width={18} height={18} />
		</span>
	)
}

export function SemrushIcon({ className = "h-4" }: Props) {
	return (
		<span className={`inline-block ${className}`} style={{ lineHeight: 0 }}>
			<Image src="/images/logo-semrush.svg" alt="Semrush" className="h-full w-auto" width={25} height={25} />
		</span>
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

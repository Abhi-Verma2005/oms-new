import React from "react"
import Image from 'next/image'
import AhrefPng from '@/public/images/ahref.png'
import SemrushPng from '@/public/images/semrush.png'

type Props = { className?: string }

export function AhrefsIcon({ className = "w-4 h-4" }: Props) {
	return <Image src={AhrefPng} alt="Ahrefs" className={className} width={16} height={16} />
}

export function SemrushIcon({ className = "w-4 h-4" }: Props) {
	return <Image src={SemrushPng} alt="Semrush" className={className} width={16} height={16} />
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

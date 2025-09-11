import React from "react"

function countryToFlagEmoji(input: string): string | null {
	if (!input) return null
	const v = input.trim()
	// If already an emoji flag (simple check for common flag emojis)
	if (v.length <= 4 && /[\uD83C-\uD83E]/u.test(v)) return v
	// Common name to ISO code map (minimal set; extend as needed)
	const nameToIso: Record<string, string> = {
		"united states": "US",
		"united kingdom": "GB",
		"uk": "GB",
		"great britain": "GB",
		"india": "IN",
		"germany": "DE",
		"france": "FR",
		"spain": "ES",
		"australia": "AU",
		"netherlands": "NL",
		"brazil": "BR",
		"italy": "IT",
		"japan": "JP",
		"china": "CN",
		"singapore": "SG",
		"united arab emirates": "AE",
		"mexico": "MX",
		"south africa": "ZA",
		"new zealand": "NZ",
		"ireland": "IE",
		"sweden": "SE",
	}
	const iso = (() => {
		if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase()
		const key = v.toLowerCase()
		return nameToIso[key] || null
	})()
	if (!iso) return null
	const codePoints = [...iso].map(c => 0x1f1e6 - 65 + c.charCodeAt(0))
	return String.fromCodePoint(...codePoints)
}

export function Flag({ country, className = "", withBg = false }: { country: string; className?: string; withBg?: boolean }) {
	const emoji = countryToFlagEmoji(country) || "🏳️"
	return (
		<span
			className={
				`${withBg ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-[11px]" : ""} ${className}`.trim()
			}
			aria-label={`${country} flag`}
			title={country}
		>
			{withBg ? <span>{emoji}</span> : emoji}
		</span>
	)
}

export default Flag

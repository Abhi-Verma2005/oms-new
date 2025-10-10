"use client"

import React, { useEffect, useState } from 'react'
import ChatActionButton, { ChatActionButtonVariant } from './ChatActionButton'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActionCardType = 'cart' | 'checkout' | 'orders' | 'filter' | 'payment'

export interface ChatActionCardAction {
  label: string
  variant: ChatActionButtonVariant
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

export interface ChatActionCardModel {
  id: string
  type: ActionCardType
  title: string
  message?: string
  icon?: React.ReactNode
  actions: ChatActionCardAction[]
  dismissible?: boolean
  timestamp: Date
}

interface ChatActionCardProps {
  card: ChatActionCardModel
  onDismiss?: () => void
  className?: string
}

export function ChatActionCard({ card, onDismiss, className }: ChatActionCardProps) {
  const [visible, setVisible] = useState(false)
  const [showRefine, setShowRefine] = useState(false)
  const [priceMin, setPriceMin] = useState<number>(0)
  const [priceMax, setPriceMax] = useState<number>(1000)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 0)
    return () => clearTimeout(id)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    // Give fade-out a bit of time before removing from DOM
    setTimeout(() => onDismiss?.(), 120)
  }

  const isFilterCard = card.type === 'filter'

  return (
    <div
      className={cn(
        'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white/90 transition-all duration-150 ease-out shadow-[0_0_0_1px_rgba(255,255,255,0.06)]',
        visible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {card.icon ? (
          <div className="mt-0.5 h-5 w-5 text-[#cfcfcf]">{card.icon}</div>
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[13px] font-semibold leading-5 truncate">{card.title}</div>
            {card.dismissible !== false && (
              <button
                aria-label="Dismiss"
                onClick={handleDismiss}
                className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md text-white/60 hover:text-white/80 hover:bg-white/10 transition-all duration-150"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {card.message ? (
            <div className="text-[12px] text-white/70 mt-1 leading-5">{card.message}</div>
          ) : null}

          {card.actions?.length ? (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {card.actions.map((a, idx) => (
                <ChatActionButton
                  key={`${card.id}-action-${idx}`}
                  label={a.label}
                  variant={a.variant}
                  icon={a.icon}
                  disabled={a.disabled}
                  onClick={() => {
                    if (isFilterCard && a.label.toLowerCase().includes('refine')) {
                      setShowRefine(true)
                      return
                    }
                    a.onClick()
                    // Auto-dismiss the card after any action is clicked
                    handleDismiss()
                  }}
                />
              ))}
            </div>
          ) : null}

          {isFilterCard && showRefine && (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-[12px] text-white/80 mb-2">Set price range</div>
              <RangeSelector
                min={0}
                max={5000}
                value={[priceMin, priceMax]}
                onChange={(a,b)=>{ setPriceMin(a); setPriceMax(b); }}
              />
              <div className="flex items-center justify-between mt-2 text-[12px] text-white/70">
                <span>${priceMin}</span>
                <span>${priceMax}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <ChatActionButton
                  label="Apply"
                  variant="primary"
                  onClick={() => {
                    try {
                      const params = new URLSearchParams()
                      params.set('priceMin', String(priceMin))
                      params.set('priceMax', String(priceMax))
                      const query = params.toString()
                      if (typeof window !== 'undefined') {
                        const event = new CustomEvent('AI_CHAT_REFINE_FILTERS', { detail: query })
                        window.dispatchEvent(event)
                      }
                    } catch {}
                    setShowRefine(false)
                    // Auto-dismiss the card after applying filters
                    handleDismiss()
                  }}
                />
                <ChatActionButton label="Cancel" variant="tertiary" onClick={() => setShowRefine(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatActionCard

// Local range selector built on the app's Slider component
import { Slider } from '@/components/ui/slider'

function RangeSelector({
  min,
  max,
  value,
  onChange
}: { min: number; max: number; value: [number, number]; onChange: (a:number, b:number)=>void }) {
  return (
    <div className="px-1">
      <Slider
        min={min}
        max={max}
        value={value}
        onValueChange={(vals:any) => {
          const [a,b] = Array.isArray(vals) ? vals : value
          onChange(a,b)
        }}
      />
    </div>
  )
}



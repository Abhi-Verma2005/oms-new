'use client'

import { useCallback } from 'react'
import { useParticles } from '../hooks/use-particles'

interface ParticlesProps {
  className?: string
  quantity?: number
  ease?: number
  color?: string
  size?: number
  speed?: number
  staticity?: number
}

export default function Particles({
  className = '',
  quantity = 30,
  ease = 50,
  color = '#ffffff',
  size = 0.4,
  speed = 2,
  staticity = 50,
}: ParticlesProps) {
  const config = useParticles({
    quantity,
    ease,
    color,
    size,
    speed,
    staticity,
  })

  return (
    <div className={className}>
      <canvas
        ref={config.canvasRef}
        width={config.canvasSize.width}
        height={config.canvasSize.height}
        className="w-full h-full"
      />
    </div>
  )
}

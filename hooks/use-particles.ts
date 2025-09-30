'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
}

interface UseParticlesProps {
  quantity: number
  ease: number
  color: string
  size: number
  speed: number
  staticity: number
}

export function useParticles({
  quantity,
  ease,
  color,
  size,
  speed,
  staticity,
}: UseParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const initParticles = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    setCanvasSize({ width: rect.width, height: rect.height })

    particlesRef.current = Array.from({ length: quantity }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: Math.random() * size + 0.5,
      color,
      opacity: Math.random() * 0.5 + 0.5,
    }))
  }, [quantity, speed, size, color])

  const animate = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)

    particlesRef.current.forEach((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x < 0 || particle.x > rect.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > rect.height) particle.vy *= -1

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`
      ctx.fill()
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    initParticles()
    animate()

    const handleResize = () => {
      initParticles()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initParticles, animate])

  return {
    canvasRef,
    canvasSize,
  }
}

"use client"

import { useEffect, useRef } from "react"

interface MatrixBackgroundProps {
  intensity?: number // 0.0 to 1.0, controls animation intensity
}

const MatrixBackground = ({ intensity = 0.5 }: MatrixBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intensityRef = useRef(intensity)

  // Update the ref when the prop changes
  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Matrix characters - expanded character set for more variety
    const characters = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)

    // Array to track the y position of each column
    const drops: number[] = []
    const speeds: number[] = [] // Different speeds for each column
    const sizes: number[] = [] // Different sizes for each column
    const glitchTimers: number[] = [] // Timers for glitch effects

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100)
      speeds[i] = Math.random() * 0.5 + 0.5 // Speed multiplier between 0.5 and 1.0
      sizes[i] = Math.random() * 0.4 + 0.8 // Size multiplier between 0.8 and 1.2
      glitchTimers[i] = Math.floor(Math.random() * 500) // Random timer for glitch effect
    }

    // Occasional glitch effect
    let glitchActive = false
    let glitchTimeout: NodeJS.Timeout | null = null

    const triggerGlitch = () => {
      if (Math.random() < 0.05 * intensityRef.current) {
        // More likely with higher intensity
        glitchActive = true

        // Reset glitch after a short time
        if (glitchTimeout) clearTimeout(glitchTimeout)
        glitchTimeout = setTimeout(
          () => {
            glitchActive = false

            // Schedule next potential glitch
            setTimeout(triggerGlitch, Math.random() * 5000 + 2000)
          },
          Math.random() * 200 + 100,
        )
      } else {
        // Try again later
        setTimeout(triggerGlitch, Math.random() * 5000 + 2000)
      }
    }

    // Start the glitch cycle
    triggerGlitch()

    // Drawing the characters
    const draw = () => {
      // Dynamic fade based on intensity
      const fadeOpacity = 0.05 + (1 - intensityRef.current) * 0.05

      // Add semi-transparent black rectangle on top of previous frame
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Base green color with intensity-based brightness
      const greenValue = Math.floor(100 + intensityRef.current * 155)
      const baseColor = `rgb(0, ${greenValue}, 0)`

      // Loop over each column
      for (let i = 0; i < drops.length; i++) {
        // Choose a random character
        const charIndex = Math.floor(Math.random() * characters.length)
        const text = characters.charAt(charIndex)

        // Determine if this column should have a glitch effect
        const hasGlitch = glitchActive && glitchTimers[i] % 20 === 0

        // Adjust color based on position and glitch
        if (hasGlitch) {
          // Glitch colors
          const r = Math.floor(Math.random() * 100)
          const g = Math.floor(Math.random() * 155 + 100)
          const b = Math.floor(Math.random() * 100)
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
          ctx.font = `bold ${fontSize * (sizes[i] + 0.3)}px monospace`
        } else {
          // Normal color with slight variation based on position
          const brightness = Math.floor(150 + Math.sin(i * 0.1) * 50 + Math.sin(drops[i] * 0.1) * 50)
          const adjustedGreen = Math.min(255, Math.floor(greenValue + brightness * intensityRef.current * 0.5))
          ctx.fillStyle = `rgb(0, ${adjustedGreen}, 0)`
          ctx.font = `${fontSize * sizes[i]}px monospace`
        }

        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        // Move the drop down at varying speeds
        drops[i] += speeds[i] * (0.8 + intensityRef.current * 0.4)

        // Reset drop when it reaches bottom or randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
          // Occasionally change speed and size
          if (Math.random() < 0.1) {
            speeds[i] = Math.random() * 0.5 + 0.5
            sizes[i] = Math.random() * 0.4 + 0.8
          }
        }

        // Update glitch timers
        glitchTimers[i]++
      }
    }

    // Animation loop with dynamic frame rate based on intensity
    let animationFrameId: number
    let lastTime = 0
    const targetFps = 30 + Math.floor(intensityRef.current * 30) // 30-60 FPS based on intensity
    const frameInterval = 1000 / targetFps

    const animate = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(animate)

      const elapsed = timestamp - lastTime
      if (elapsed > frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval)
        draw()
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (glitchTimeout) clearTimeout(glitchTimeout)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
}

export default MatrixBackground


"use client"

import { useEffect, useState, useRef } from "react"

interface StatsCounterProps {
  label: string
  value: number
  suffix?: string
  glowIntensity?: number
  highlight?: boolean
  className?: string
}

const StatsCounter = ({
  label,
  value,
  suffix = "",
  glowIntensity = 0.5,
  highlight = false,
  className = "",
}: StatsCounterProps) => {
  const [prevValue, setPrevValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isIncreasing, setIsIncreasing] = useState(true)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Detect value changes and trigger appropriate animations
  useEffect(() => {
    // Only animate if the value has changed and it's not the initial render
    if (prevValue !== value && prevValue !== 0) {
      // Determine if value is increasing or decreasing
      setIsIncreasing(value > prevValue)

      // Trigger animation
      setIsAnimating(true)

      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }

      // Reset animation state after animation completes
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
      }, 1000) // Match animation duration
    }

    // Update previous value
    setPrevValue(value)

    // Cleanup timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [value, prevValue])

  // Format the value (handle decimals)
  const formattedValue = typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value.toString()

  return (
    <div className={`stats-counter ${className}`}>
      <div
        className={`
          bg-black/80 border border-green-500 rounded-xl p-4
          transition-all duration-300 h-full
          ${highlight ? "border-green-400" : ""}
          ${isAnimating ? "animate-panel-pulse" : ""}
        `}
        style={{
          boxShadow: highlight
            ? `0 0 ${10 + glowIntensity * 10}px rgba(0, 255, 0, ${glowIntensity * 0.7})`
            : `0 0 8px rgba(0, 255, 0, 0.3)`, // Added subtle glow to all counters
        }}
      >
        <div className="text-green-400 text-sm mb-2 font-medium">{label}</div>
        <div
          className={`
            text-green-500 text-2xl font-mono font-bold
            ${highlight ? "text-green-300" : ""}
            ${isAnimating ? (isIncreasing ? "animate-value-increase" : "animate-value-decrease") : ""}
          `}
          style={{
            textShadow: `0 0 ${highlight ? 10 : 5}px rgba(0, 255, 0, ${highlight ? glowIntensity : 0.3})`,
            transition: "text-shadow 0.3s ease",
          }}
        >
          {formattedValue}
          {suffix}
        </div>
      </div>
    </div>
  )
}

export default StatsCounter


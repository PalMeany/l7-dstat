"use client"

import { useEffect, useState } from "react"

interface StatsCounterProps {
  label: string
  value: number
  suffix?: string
  isAnimating?: boolean
  glowIntensity?: number
  highlight?: boolean
  className?: string
}

const StatsCounter = ({
  label,
  value,
  suffix = "",
  isAnimating = false,
  glowIntensity = 0.5,
  highlight = false,
  className = "",
}: StatsCounterProps) => {
  const [prevValue, setPrevValue] = useState(value)
  const [isIncreasing, setIsIncreasing] = useState(false)
  const [isDecreasing, setIsDecreasing] = useState(false)

  // Detect value changes to trigger animations
  useEffect(() => {
    if (value !== prevValue) {
      if (value > prevValue) {
        setIsIncreasing(true)
        setTimeout(() => setIsIncreasing(false), 1000)
      } else if (value < prevValue) {
        setIsDecreasing(true)
        setTimeout(() => setIsDecreasing(false), 1000)
      }
      setPrevValue(value)
    }
  }, [value, prevValue])

  // Format the value (handle decimals)
  const formattedValue = typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value.toString()

  return (
    <div className={`stats-counter ${className}`}>
      <div
        className={`
          bg-black/80 border border-green-500 rounded-lg p-3
          transition-all duration-300
          ${highlight ? "border-green-400" : ""}
        `}
        style={{
          boxShadow: highlight ? `0 0 ${10 + glowIntensity * 10}px rgba(0, 255, 0, ${glowIntensity * 0.7})` : "none",
        }}
      >
        <div className="text-green-400 text-sm mb-1">{label}</div>
        <div
          className={`
            text-green-500 text-2xl font-mono font-bold
            transition-all duration-300
            ${isAnimating || isIncreasing ? "animate-value-change" : ""}
            ${isDecreasing ? "animate-value-decrease" : ""}
            ${highlight ? "text-green-300" : ""}
          `}
          style={{
            textShadow:
              isAnimating || isIncreasing || highlight
                ? `0 0 ${5 + glowIntensity * 10}px rgba(0, 255, 0, ${glowIntensity})`
                : "none",
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


"use client"

import { useEffect, useRef, useState } from "react"

interface RpsGraphProps {
  data: number[]
}

const RpsGraph = ({ data }: RpsGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)
  const [prevData, setPrevData] = useState<number[]>([])

  // Detect changes in data to trigger animations
  useEffect(() => {
    if (data.length > 0 && prevData.length > 0) {
      // If we have a new data point
      if (data.length > prevData.length) {
        setAnimatingIndex(data.length - 1)
        // Reset animation state after animation completes
        const timer = setTimeout(() => {
          setAnimatingIndex(null)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
    setPrevData(data)
  }, [data, prevData])

  // Update dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    // Initial update
    updateDimensions()

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [])

  // Draw the graph on canvas
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0 || dimensions.height === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions (with higher resolution for retina displays)
    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // If no data, show waiting message
    if (data.length === 0) {
      ctx.fillStyle = "#00ff00"
      ctx.font = "14px monospace"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for Nginx data...", dimensions.width / 2, dimensions.height / 2)
      return
    }

    // Calculate graph dimensions
    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const graphWidth = dimensions.width - padding.left - padding.right
    const graphHeight = dimensions.height - padding.top - padding.bottom

    // Find max value for scaling (ensure at least 1 to avoid division by zero)
    const maxRps = Math.max(...data, 1) * 1.1 // Add 10% headroom

    // Draw background grid
    ctx.strokeStyle = "#0f3f0f"
    ctx.lineWidth = 1
    ctx.beginPath()

    // Horizontal grid lines
    const yStep = Math.ceil(maxRps / 5)
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + graphHeight - (i / 5) * graphHeight
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + graphWidth, y)

      // Draw y-axis labels
      ctx.fillStyle = "#33ff33"
      ctx.font = "12px monospace"
      ctx.textAlign = "right"
      ctx.fillText(`${i * yStep}`, padding.left - 5, y + 4)
    }

    // Vertical grid lines
    const xStep = Math.ceil(data.length / 10)
    for (let i = 0; i <= data.length; i += xStep) {
      const x = padding.left + (i / data.length) * graphWidth
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, padding.top + graphHeight)
    }
    ctx.stroke()

    // Draw x-axis labels
    ctx.fillStyle = "#33ff33"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"
    ctx.fillText("Time (seconds)", padding.left + graphWidth / 2, dimensions.height - 5)

    // Draw time markers
    for (let i = 0; i <= data.length; i += xStep) {
      const x = padding.left + (i / data.length) * graphWidth
      const label = i === 0 ? `-${data.length}s` : i === data.length ? "now" : `-${data.length - i}s`
      ctx.fillText(label, x, dimensions.height - 10)
    }

    // Draw data points and lines
    if (data.length > 1) {
      // Draw line connecting data points
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * graphWidth
        const y = padding.top + graphHeight - (data[i] / maxRps) * graphHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Draw data points
      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * graphWidth
        const y = padding.top + graphHeight - (data[i] / maxRps) * graphHeight

        // Determine if this point is being animated (newest point)
        const isAnimating = i === animatingIndex

        // Draw point
        ctx.beginPath()
        ctx.fillStyle = isAnimating ? "#ffffff" : "#00ff00"
        const radius = isAnimating ? 5 : 3
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Add glow effect for animated points
        if (isAnimating) {
          ctx.beginPath()
          ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
          const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius + 5)
          gradient.addColorStop(0, "rgba(0, 255, 0, 0.8)")
          gradient.addColorStop(1, "rgba(0, 255, 0, 0)")
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // Show value on hover (would need mouse event handling)
        if (isAnimating) {
          ctx.fillStyle = "#00ff00"
          ctx.font = "bold 12px monospace"
          ctx.textAlign = "center"
          ctx.fillText(`${data[i]}`, x, y - 10)
        }
      }
    }

    // Draw current value label
    if (data.length > 0) {
      const lastValue = data[data.length - 1]
      const x = padding.left + graphWidth
      const y = padding.top + graphHeight - (lastValue / maxRps) * graphHeight

      ctx.fillStyle = "#00ff00"
      ctx.font = "bold 12px monospace"
      ctx.textAlign = "right"
      ctx.fillText(`${lastValue}`, x + 15, y + 4)
    }
  }, [data, dimensions, animatingIndex])

  return (
    <div ref={containerRef} className="w-full h-[200px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

export default RpsGraph


"use client"

import { useEffect, useRef, useState } from "react"

interface RpsDataPoint {
  value: number
  timestamp: number
}

interface RpsGraphProps {
  data: RpsDataPoint[]
}

const EnhancedRpsGraph = ({ data }: RpsGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)
  const [prevData, setPrevData] = useState<RpsDataPoint[]>([])
  const [hoverPoint, setHoverPoint] = useState<{ index: number; x: number; y: number } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const glowIntensityRef = useRef(0)

  // Format timestamp to hh:mm:ss
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toTimeString().split(" ")[0]
  }

  // Format timestamp to hh:mm:ss without leading zeros for hours
  const formatTimeShort = (timestamp: number): string => {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
    return `${hours}:${minutes}:${seconds}`
  }

  // Detect changes in data to trigger animations
  useEffect(() => {
    if (data.length > 0 && prevData.length > 0) {
      // If we have a new data point
      if (data.length > prevData.length) {
        setAnimatingIndex(data.length - 1)
        glowIntensityRef.current = 1
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

  // Handle mouse movement for hover effects
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return

    const canvas = canvasRef.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Calculate graph dimensions
      const padding = { top: 20, right: 20, bottom: 30, left: 50 }
      const graphWidth = dimensions.width - padding.left - padding.right

      // Check if mouse is within graph area
      if (
        x >= padding.left &&
        x <= padding.left + graphWidth &&
        y >= padding.top &&
        y <= dimensions.height - padding.bottom
      ) {
        // Find closest data point
        const pointWidth = graphWidth / (data.length - 1 || 1)
        const index = Math.round((x - padding.left) / pointWidth)

        if (index >= 0 && index < data.length) {
          setHoverPoint({ index, x, y })
        }
      } else {
        setHoverPoint(null)
      }
    }

    const handleMouseLeave = () => {
      setHoverPoint(null)
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [data, dimensions])

  // Animation loop for glow effects
  useEffect(() => {
    const animate = () => {
      if (glowIntensityRef.current > 0) {
        glowIntensityRef.current -= 0.02
        if (glowIntensityRef.current < 0) glowIntensityRef.current = 0
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
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

    // Extract values for easier access
    const values = data.map((d) => d.value)

    // Find max value for scaling (ensure at least 1 to avoid division by zero)
    const maxRps = Math.max(...values, 1) * 1.1 // Add 10% headroom

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

    // Vertical grid lines - adjust for 60 seconds
    // For 60 data points, we'll show a line every 10 seconds
    const xStep = Math.max(1, Math.floor(data.length / 6))
    for (let i = 0; i <= data.length; i += xStep) {
      const x = padding.left + (i / (data.length || 1)) * graphWidth
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, padding.top + graphHeight)
    }
    ctx.stroke()

    // Draw x-axis labels
    ctx.fillStyle = "#33ff33"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"
    ctx.fillText("Time (hh:mm:ss)", padding.left + graphWidth / 2, dimensions.height - 5)

    // Draw time markers with actual timestamps
    // We'll show fewer time markers to avoid overcrowding
    const timeStep = Math.max(1, Math.floor(data.length / 4))
    for (let i = 0; i < data.length; i += timeStep) {
      const x = padding.left + (i / (data.length - 1 || 1)) * graphWidth
      // Format the timestamp
      const timestamp = data[i].timestamp
      const timeLabel = formatTimeShort(timestamp)
      ctx.fillText(timeLabel, x, dimensions.height - 10)
    }

    // Always show the most recent time
    if (data.length > 0) {
      const x = padding.left + graphWidth
      const timestamp = data[data.length - 1].timestamp
      const timeLabel = formatTimeShort(timestamp)
      ctx.fillText(timeLabel, x, dimensions.height - 10)
    }

    // Draw data points and lines
    if (data.length > 1) {
      // Draw line connecting data points
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * graphWidth
        const y = padding.top + graphHeight - (data[i].value / maxRps) * graphHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Draw area under the line with gradient
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top + graphHeight) // Bottom left

      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * graphWidth
        const y = padding.top + graphHeight - (data[i].value / maxRps) * graphHeight
        ctx.lineTo(x, y)
      }

      ctx.lineTo(padding.left + graphWidth, padding.top + graphHeight) // Bottom right
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphHeight)
      gradient.addColorStop(0, "rgba(0, 255, 0, 0.2)")
      gradient.addColorStop(1, "rgba(0, 255, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw data points - for 60 points, we'll make them smaller and only highlight important ones
      const pointRadius = data.length > 30 ? 2 : 3

      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * graphWidth
        const y = padding.top + graphHeight - (data[i].value / maxRps) * graphHeight

        // Determine if this point is being animated (newest point) or hovered
        const isAnimating = i === animatingIndex
        const isHovered = hoverPoint?.index === i
        const isSignificant = i % xStep === 0 || i === data.length - 1 || isHovered || isAnimating

        // Draw point - only draw all points if we have fewer than 30, otherwise just draw significant ones
        if (data.length <= 30 || isSignificant) {
          ctx.beginPath()
          ctx.fillStyle = isAnimating ? "#ffffff" : isHovered ? "#66ff66" : "#00ff00"
          const radius = isAnimating ? pointRadius + 2 : isHovered ? pointRadius + 1 : pointRadius
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()

          // Add glow effect for animated or hovered points
          if (isAnimating || isHovered) {
            ctx.beginPath()
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
            const pointGradient = ctx.createRadialGradient(x, y, radius, x, y, radius + 5)
            pointGradient.addColorStop(0, `rgba(0, 255, 0, ${isAnimating ? 0.8 * glowIntensityRef.current : 0.5})`)
            pointGradient.addColorStop(1, "rgba(0, 255, 0, 0)")
            ctx.fillStyle = pointGradient
            ctx.fill()
          }
        }

        // Show value for hovered or animated points
        if (isHovered || isAnimating) {
          ctx.fillStyle = "#00ff00"
          ctx.font = "bold 12px monospace"
          ctx.textAlign = "center"
          ctx.fillText(`${data[i].value}`, x, y - 10)
        }
      }
    }

    // Draw current value label
    if (data.length > 0) {
      const lastValue = data[data.length - 1].value
      const x = padding.left + graphWidth
      const y = padding.top + graphHeight - (lastValue / maxRps) * graphHeight

      ctx.fillStyle = "#00ff00"
      ctx.font = "bold 12px monospace"
      ctx.textAlign = "right"
      ctx.fillText(`${lastValue}`, x + 15, y + 4)
    }

    // Draw tooltip for hovered point
    if (hoverPoint && hoverPoint.index >= 0 && hoverPoint.index < data.length) {
      const value = data[hoverPoint.index].value
      const timestamp = data[hoverPoint.index].timestamp
      const timeString = formatTime(timestamp)

      // Draw tooltip background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 1

      const tooltipX = hoverPoint.x + 10
      const tooltipY = hoverPoint.y - 10
      const tooltipWidth = 120
      const tooltipHeight = 50

      ctx.beginPath()
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5)
      ctx.fill()
      ctx.stroke()

      // Draw tooltip content
      ctx.fillStyle = "#00ff00"
      ctx.font = "12px monospace"
      ctx.textAlign = "left"
      ctx.fillText(`RPS: ${value}`, tooltipX + 10, tooltipY + 20)
      ctx.fillText(`Time: ${timeString}`, tooltipX + 10, tooltipY + 40)
    }
  }, [data, dimensions, animatingIndex, hoverPoint])

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

export default EnhancedRpsGraph


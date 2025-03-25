"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import MatrixBackground from "@/components/matrix-background"
import EnhancedRpsGraph from "@/components/enhanced-rps-graph"
import StatsCounter from "@/components/stats-counter"

// Interface for timestamped RPS data
interface TimestampedRps {
  value: number
  timestamp: number
}

// Interface for graph data points with timestamp
interface RpsDataPoint {
  value: number
  timestamp: number
}

export default function Home() {
  // Change the data array size from 20 to 60
  const MAX_DATA_POINTS = 60

  const [rpsData, setRpsData] = useState<RpsDataPoint[]>([])
  const [currentRps, setCurrentRps] = useState<number>(0)
  const [status, setStatus] = useState<"online" | "offline">("online")
  const previousRef = useRef<number | null>(null) // Fixed: removed incorrect destructuring
  const [isNewData, setIsNewData] = useState<boolean>(false)
  const [glowIntensity, setGlowIntensity] = useState<number>(0.5)

  // Store timestamped RPS data for calculating time-windowed stats
  const [timeWindowedData, setTimeWindowedData] = useState<TimestampedRps[]>([])

  // Time window for stats in milliseconds (60 seconds)
  const TIME_WINDOW_MS = 60 * 1000

  // Calculate average and max RPS from the time-windowed data
  const { avgRps, maxRps } = useMemo(() => {
    if (timeWindowedData.length === 0) return { avgRps: 0, maxRps: 0 }

    // Filter data to only include values within the time window
    const now = Date.now()
    const windowedData = timeWindowedData.filter((item) => now - item.timestamp < TIME_WINDOW_MS)

    // Calculate average
    const sum = windowedData.reduce((acc, item) => acc + item.value, 0)
    const avg = windowedData.length > 0 ? Math.round((sum / windowedData.length) * 10) / 10 : 0

    // Find maximum
    const max = windowedData.length > 0 ? Math.max(...windowedData.map((item) => item.value)) : 0

    return { avgRps: avg, maxRps: max }
  }, [timeWindowedData, TIME_WINDOW_MS])

  // Fetch real RPS data from Nginx
  useEffect(() => {
    let isMounted = true

    const fetchNginxData = async () => {
      try {
        const response = await fetch("/api/nginx-status", {
          method: "GET",
          cache: "no-store",
        })

        let text
        let isError = false
        let connectionStatus = "online"

        // Check if we got JSON (error with fallback) or plain text (success)
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const jsonData = await response.json()
          if (jsonData.error) {
            // We have an error but also fallback data
            text = jsonData.fallbackData
            isError = true
            connectionStatus = jsonData.connectionStatus || "offline"

            // Log the error (limited to avoid spam)
            if (status === "online") {
              console.warn("Nginx status error:", jsonData.error)
            }
          }
        } else {
          // Normal text response
          text = await response.text()
          connectionStatus = "online"
        }

        // Update the system status based on the real connection status
        if (isMounted) {
          setStatus(connectionStatus as "online" | "offline")
        }

        if (!text) {
          throw new Error("Empty response")
        }

        // Parse the Nginx status response
        const parts = text.split(" ")
        if (parts.length < 10) {
          throw new Error("Invalid Nginx status format")
        }

        const current = Number.parseInt(parts[9], 10)
        const now = Date.now() // Current timestamp

        if (isMounted) {
          // Process the data (real or fallback)
          if (
            (current > 0 &&
              previousRef.current !== null &&
              current - previousRef.current > 0 &&
              current - previousRef.current < 990000000) ||
            (current > 0 && previousRef.current === null)
          ) {
            if (previousRef.current !== null) {
              const newRps = current - previousRef.current

              // Trigger animation for new data
              setIsNewData(true)
              setTimeout(() => setIsNewData(false), 1000)

              // Adjust glow intensity based on RPS value
              const maxExpectedRps = 100 // Adjust based on your expected range
              const normalizedIntensity = Math.min(newRps / maxExpectedRps, 1)
              setGlowIntensity(0.5 + normalizedIntensity * 0.5) // Range from 0.5 to 1.0

              setCurrentRps(newRps)

              // Update RPS data for the graph with timestamp
              setRpsData((prev) => {
                const newDataPoint = { value: newRps, timestamp: now }
                const newData = [...prev, newDataPoint].slice(-MAX_DATA_POINTS)
                return newData
              })

              // Add to time-windowed data with current timestamp
              setTimeWindowedData((prev) => {
                // Add new data point
                const newData = [...prev, { value: newRps, timestamp: now }]
                // Remove data points outside the time window
                return newData.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
              })
            }

            previousRef.current = current
          } else {
            // If we're getting zeros or invalid data, use 0 for RPS
            if (isError || current === 0) {
              // Add a zero RPS data point
              setCurrentRps(0)

              // Update RPS data for the graph with timestamp
              setRpsData((prev) => {
                const newDataPoint = { value: 0, timestamp: now }
                const newData = [...prev, newDataPoint].slice(-MAX_DATA_POINTS)
                return newData
              })

              // Add zero to time-windowed data
              setTimeWindowedData((prev) => {
                const newData = [...prev, { value: 0, timestamp: now }]
                return newData.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
              })
            }

            previousRef.current = null
            console.log("Bad response or first request")
          }
        }
      } catch (error) {
        // Handle error gracefully
        if (isMounted) {
          // Set connection status to offline
          setStatus("offline")

          // Log the error (limited to avoid spam)
          if (status === "online") {
            console.warn("Error fetching Nginx status:", error)
          }

          // Set RPS to 0 when we can't get data
          const now = Date.now()

          // Add a zero RPS data point with timestamp
          setCurrentRps(0)

          // Update RPS data for the graph
          setRpsData((prev) => {
            const newDataPoint = { value: 0, timestamp: now }
            const newData = [...prev, newDataPoint].slice(-MAX_DATA_POINTS)
            return newData
          })

          // Add zero to time-windowed data
          setTimeWindowedData((prev) => {
            const newData = [...prev, { value: 0, timestamp: now }]
            return newData.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
          })
        }
      }

      // Schedule the next fetch if component is still mounted
      if (isMounted) {
        setTimeout(fetchNginxData, 1000)
      }
    }

    fetchNginxData()

    // Clean up time-windowed data periodically to remove old entries
    const cleanupInterval = setInterval(() => {
      if (isMounted) {
        setTimeWindowedData((prev) => {
          const now = Date.now()
          return prev.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
        })
      }
    }, 5000) // Clean up every 5 seconds

    return () => {
      isMounted = false
      clearInterval(cleanupInterval)
    }
  }, [TIME_WINDOW_MS, status])

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black p-4">
      <MatrixBackground intensity={glowIntensity} />

      <div className="relative z-10 w-full max-w-3xl">
        <Card className="backdrop-blur-md bg-black/50 border-green-500 shadow-lg shadow-green-500/20 p-6 transition-all duration-300">
          <h1 className="text-green-500 text-3xl font-bold text-center mb-6 animate-text-glow">
            Layer7 DSTAT
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <StatsCounter
              label="Current RPS"
              value={currentRps}
              isAnimating={isNewData}
              glowIntensity={glowIntensity}
              className="md:col-span-1"
            />
            <StatsCounter
              label="Average RPS (60s)"
              value={avgRps}
              suffix={avgRps === Math.floor(avgRps) ? "" : ""} // Handle decimal display
              className="md:col-span-1"
            />
            <StatsCounter label="Max RPS (60s)" value={maxRps} className="md:col-span-1" highlight={true} />
          </div>

          <div
            className={`
              glow-box bg-black/80 border border-green-500 rounded-lg p-4 mb-4 
              transition-all duration-500 w-full
            `}
            style={{
              boxShadow: `0 0 ${15 + glowIntensity * 15}px rgba(0, 255, 0, ${glowIntensity})`,
            }}
          >
            <h2 className="text-green-400 text-xl mb-2">RPS Trend (Last 60 Seconds)</h2>
            <div className="w-full h-[250px]">
              <EnhancedRpsGraph data={rpsData} />
            </div>
          </div>

          <div className="text-green-300 text-sm">
            <p>
              System Status:
              <span
                className={`
                  ml-2 transition-colors duration-500
                  ${status === "online" ? "text-green-500" : "text-red-500"}
                  ${status === "online" ? "animate-status-pulse" : ""}
                `}
              >
                {status === "online" ? "Online" : "Offline"}
              </span>
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}


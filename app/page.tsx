"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import MatrixBackground from "@/components/matrix-background"
import EnhancedRpsGraph from "@/components/enhanced-rps-graph"
import StatsCounter from "@/components/stats-counter"

interface TimestampedRps {
  value: number
  timestamp: number
}

interface RpsDataPoint {
  value: number
  timestamp: number
}

export default function Home() {
  const MAX_DATA_POINTS = 60

  const [rpsData, setRpsData] = useState<RpsDataPoint[]>([])
  const [currentRps, setCurrentRps] = useState<number>(0)
  const [status, setStatus] = useState<"online" | "offline">("online")
  const previousRef = useRef<number | null>(null)
  const [glowIntensity, setGlowIntensity] = useState<number>(0.5)
  const [timeWindowedData, setTimeWindowedData] = useState<TimestampedRps[]>([])
  const TIME_WINDOW_MS = 60 * 1000
  const { avgRps, maxRps } = useMemo(() => {
    if (timeWindowedData.length === 0) return { avgRps: 0, maxRps: 0 }
    const now = Date.now()
    const windowedData = timeWindowedData.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
    const sum = windowedData.reduce((acc, item) => acc + item.value, 0)
    const avg = windowedData.length > 0 ? Math.round((sum / windowedData.length) * 10) / 10 : 0
    const max = windowedData.length > 0 ? Math.max(...windowedData.map((item) => item.value)) : 0

    return { avgRps: avg, maxRps: max }
  }, [timeWindowedData, TIME_WINDOW_MS])

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

        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const jsonData = await response.json()
          if (jsonData.error) {
            text = jsonData.fallbackData
            isError = true
            connectionStatus = jsonData.connectionStatus || "offline"

            if (status === "online") {
              console.warn("Nginx status error:", jsonData.error)
            }
          }
        } else {
          text = await response.text()
          connectionStatus = "online"
        }

        if (isMounted) {
          setStatus(connectionStatus as "online" | "offline")
        }

        if (!text) {
          throw new Error("Empty response")
        }

        const parts = text.split(" ")
        if (parts.length < 10) {
          throw new Error("Invalid Nginx status format")
        }

        const current = Number.parseInt(parts[9], 10)
        const now = Date.now()

        if (isMounted) {
          if (
            (current > 0 &&
              previousRef.current !== null &&
              current - previousRef.current > 0 &&
              current - previousRef.current < 990000000) ||
            (current > 0 && previousRef.current === null)
          ) {
            if (previousRef.current !== null) {
              const newRps = current - previousRef.current

              // Adjust glow intensity based on RPS value
              const maxExpectedRps = 100 // Adjust based on your expected range
              const normalizedIntensity = Math.min(newRps / maxExpectedRps, 1)
              setGlowIntensity(0.5 + normalizedIntensity * 0.5) // Range from 0.5 to 1.0

              setCurrentRps(newRps)

              setRpsData((prev) => {
                const newDataPoint = { value: newRps, timestamp: now }
                const newData = [...prev, newDataPoint].slice(-MAX_DATA_POINTS)
                return newData
              })

              setTimeWindowedData((prev) => {
                const newData = [...prev, { value: newRps, timestamp: now }]
                return newData.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
              })
            }

            previousRef.current = current
          } else {
            if (isError || current === 0) {
              setCurrentRps(0)
              setRpsData((prev) => {
                const newDataPoint = { value: 0, timestamp: now }
                const newData = [...prev, newDataPoint].slice(-MAX_DATA_POINTS)
                return newData
              })
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
        if (isMounted) {
          setStatus("offline")
          if (status === "online") {
            console.warn("Error fetching Nginx status:", error)
          }

          const now = Date.now()
          setCurrentRps(0)

          setRpsData((prev) => {
            const newDataPoint = { value: 0, timestamp: now }
            const newData = [...prev, newDataPoint].slice(-MAX_DATA_POINTS)
            return newData
          })

          setTimeWindowedData((prev) => {
            const newData = [...prev, { value: 0, timestamp: now }]
            return newData.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
          })
        }
      }

      if (isMounted) {
        setTimeout(fetchNginxData, 1000)
      }
    }

    fetchNginxData()

    const cleanupInterval = setInterval(() => {
      if (isMounted) {
        setTimeWindowedData((prev) => {
          const now = Date.now()
          return prev.filter((item) => now - item.timestamp < TIME_WINDOW_MS)
        })
      }
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(cleanupInterval)
    }
  }, [TIME_WINDOW_MS, status])

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black p-4">
      <MatrixBackground intensity={glowIntensity} />

      <div className="relative z-10 w-full max-w-3xl">
        <Card className="main-card backdrop-blur-md bg-black/50 border-green-500 rounded-2xl shadow-lg shadow-green-500/20 p-8 transition-all duration-300">
          <h1 className="text-green-500 text-3xl font-bold text-center mb-6 animate-text-glow">
            Layer7 DSTAT
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCounter
              label="Current RPS"
              value={currentRps}
              glowIntensity={glowIntensity}
              className="md:col-span-1"
            />
            <StatsCounter
              label="Average RPS (60s)"
              value={Math.round(avgRps)}
              suffix={avgRps === Math.floor(avgRps) ? "" : ""}
              className="md:col-span-1"
            />
            <StatsCounter label="Max RPS (60s)" value={maxRps} className="md:col-span-1" highlight={true} />
          </div>

          <div
            className="enhanced-panel glow-box bg-black/80 border border-green-500 rounded-xl p-5 mb-6 transition-all duration-500 w-full"
            style={{
              boxShadow: `0 0 ${15 + glowIntensity * 15}px rgba(0, 255, 0, ${glowIntensity})`,
            }}
          >
            <h2 className="text-green-400 text-xl mb-3 font-semibold">RPS Trend (Last 60 Seconds)</h2>
            <div className="w-full h-[250px]">
              <EnhancedRpsGraph data={rpsData} />
            </div>
          </div>

          <div className="status-indicator text-green-300 text-sm py-2 px-4 bg-black/40 rounded-full inline-block">
            <p className="flex items-center">
              System Status:
              <span
                className={`
                  ml-2 transition-colors duration-500 flex items-center
                  ${status === "online" ? "text-green-500" : "text-red-500"}
                `}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1.5 ${status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></span>
                {status === "online" ? "Online" : "Offline"}
              </span>
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}


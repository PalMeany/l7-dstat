"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface RpsLineChartProps {
  data: number[]
  maxRps?: number
}

interface ChartDataPoint {
  time: string
  rps: number
}

const RpsLineChart = ({ data, maxRps }: RpsLineChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  // Convert the raw RPS data array into a format suitable for the chart
  useEffect(() => {
    if (data.length === 0) return

    // Create formatted data for the chart - reverse to show oldest to newest (left to right)
    const formattedData: ChartDataPoint[] = [...data].map((rps, index) => {
      // Calculate relative time (seconds ago)
      const secondsAgo = data.length - 1 - index
      return {
        time: secondsAgo === 0 ? "now" : `-${secondsAgo}s`,
        rps,
      }
    })

    setChartData(formattedData)
  }, [data])

  // If no data, show placeholder
  if (data.length === 0) {
    return <div className="text-green-500 text-center py-12">Waiting for Nginx data...</div>
  }

  // Calculate a reasonable max for the Y axis
  const calculatedMax = maxRps || Math.max(...data, 10) * 1.2

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-green-500 p-2 text-green-400 text-sm rounded shadow-lg">
          <p className="font-bold">{label}</p>
          <p>RPS: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f3f0f" />
          <XAxis
            dataKey="time"
            stroke="#33ff33"
            tick={{ fill: "#33ff33" }}
            tickLine={{ stroke: "#33ff33" }}
            reversed={false}
          />
          <YAxis
            stroke="#33ff33"
            tick={{ fill: "#33ff33" }}
            tickLine={{ stroke: "#33ff33" }}
            domain={[0, calculatedMax]}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#0f3f0f" />
          <Line
            type="monotone"
            dataKey="rps"
            stroke="#00ff00"
            strokeWidth={2}
            dot={{
              fill: "#00ff00",
              r: 4,
              strokeWidth: 0,
            }}
            activeDot={{
              r: 6,
              fill: "#ffffff",
              stroke: "#00ff00",
              strokeWidth: 2,
            }}
            isAnimationActive={true}
            animationDuration={300}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RpsLineChart


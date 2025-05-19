"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Données simulées pour la comparaison des stocks
const comparisonData = [
  { month: "Jan", MCD: 240, YUM: 125, WEN: 21, PZZA: 80 },
  { month: "Feb", MCD: 245, YUM: 128, WEN: 20.5, PZZA: 82 },
  { month: "Mar", MCD: 250, YUM: 130, WEN: 19.8, PZZA: 79 },
  { month: "Apr", MCD: 248, YUM: 132, WEN: 19.2, PZZA: 78 },
  { month: "May", MCD: 252, YUM: 129, WEN: 18.9, PZZA: 76 },
  { month: "Jun", MCD: 260, YUM: 133, WEN: 19.1, PZZA: 75 },
  { month: "Jul", MCD: 265, YUM: 135, WEN: 19.0, PZZA: 77 },
  { month: "Aug", MCD: 268, YUM: 136, WEN: 18.7, PZZA: 78 },
  { month: "Sep", MCD: 270, YUM: 138, WEN: 18.5, PZZA: 79 },
  { month: "Oct", MCD: 265, YUM: 137, WEN: 18.8, PZZA: 80 },
  { month: "Nov", MCD: 267, YUM: 136, WEN: 18.9, PZZA: 81 },
  { month: "Dec", MCD: 267.89, YUM: 136.42, WEN: 18.76, PZZA: 82 },
]

export function StockComparisonChart() {
  return (
    <ChartContainer
      config={{
        MCD: {
          label: "McDonald's",
          color: "hsl(var(--chart-1))",
        },
        YUM: {
          label: "Yum! Brands",
          color: "hsl(var(--chart-2))",
        },
        WEN: {
          label: "Wendy's",
          color: "hsl(var(--chart-3))",
        },
        PZZA: {
          label: "Papa John's",
          color: "hsl(var(--chart-4))",
        },
      }}
      className="h-full w-full"
    >
      <LineChart accessibilityLayer data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="MCD"
          stroke="var(--color-MCD)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="YUM"
          stroke="var(--color-YUM)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="WEN"
          stroke="var(--color-WEN)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="PZZA"
          stroke="var(--color-PZZA)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

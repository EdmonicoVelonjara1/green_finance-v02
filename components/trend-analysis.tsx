"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Données simulées pour l'analyse des tendances
const trendData = [
  {
    category: "Croissance",
    MCD: 7.2,
    YUM: 5.8,
    WEN: -2.5,
    PZZA: 1.2,
  },
  {
    category: "Rentabilité",
    MCD: 8.5,
    YUM: 6.7,
    WEN: 4.2,
    PZZA: 3.8,
  },
  {
    category: "Stabilité",
    MCD: 9.1,
    YUM: 7.5,
    WEN: 5.8,
    PZZA: 6.2,
  },
  {
    category: "Innovation",
    MCD: 6.8,
    YUM: 7.9,
    WEN: 5.2,
    PZZA: 4.9,
  },
]

export function TrendAnalysis() {
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
      className="h-[300px] w-full"
    >
      <BarChart accessibilityLayer data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="category" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="MCD" fill="var(--color-MCD)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="YUM" fill="var(--color-YUM)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="WEN" fill="var(--color-WEN)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="PZZA" fill="var(--color-PZZA)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

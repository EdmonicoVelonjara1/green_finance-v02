"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type StockData, formatDataForCharts } from "@/lib/data-utils"

interface StockPriceChartProps {
  data: StockData[]
  title?: string
  description?: string
  height?: number
}

export function StockPriceChart({ data, title = "Prix de l'action", description, height = 400 }: StockPriceChartProps) {
  const chartData = useMemo(() => formatDataForCharts(data), [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line">
          <TabsList className="mb-4">
            <TabsTrigger value="line">Ligne</TabsTrigger>
            <TabsTrigger value="area">Surface</TabsTrigger>
            <TabsTrigger value="candle">Chandelier</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>
          <TabsContent value="line" className="h-full">
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
                    }}
                  />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Prix"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="area" className="h-full">
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
                    }}
                  />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Prix"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorClose)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="candle" className="h-full">
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
                    }}
                  />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Prix"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="high" stroke="hsl(var(--success))" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="low" stroke="hsl(var(--destructive))" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="volume" className="h-full">
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Volume"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

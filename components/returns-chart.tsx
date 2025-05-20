"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type StockData, calculateDailyReturns, calculateCumulativeReturns, calculateDrawdown } from "@/lib/data-utils"

interface ReturnsChartProps {
  data: StockData[]
  title?: string
  description?: string
  height?: number
}

export function ReturnsChart({ data, title = "Analyse des rendements", description, height = 400 }: ReturnsChartProps) {
  const dailyReturns = useMemo(() => {
    const returns = calculateDailyReturns(data)
    return returns.map((day) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      return: day.return,
    }))
  }, [data])

  const cumulativeReturns = useMemo(() => {
    const returns = calculateCumulativeReturns(data)
    return returns.map((day) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      return: day.return,
    }))
  }, [data])

  const drawdowns = useMemo(() => {
    const dd = calculateDrawdown(data)
    return dd.map((day) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      drawdown: day.drawdown,
      maxDrawdown: day.maxDrawdown,
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Rendements journaliers</TabsTrigger>
            <TabsTrigger value="cumulative">Rendements cumulés</TabsTrigger>
            <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="h-full">
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyReturns} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
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
                    formatter={(value: number) => [`${value.toFixed(2)}%`, "Rendement"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="return"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorPositive)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="cumulative" className="h-full">
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeReturns} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    formatter={(value: number) => [`${value.toFixed(2)}%`, "Rendement cumulé"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="return" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="drawdown" className="h-full">
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdowns} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
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
                  <YAxis domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(2)}%`,
                      value === drawdowns[0].drawdown ? "Drawdown" : "Drawdown maximum",
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="hsl(var(--destructive))"
                    fill="url(#colorDrawdown)"
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="maxDrawdown"
                    stroke="hsl(var(--warning))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

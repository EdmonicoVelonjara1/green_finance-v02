"use client"

import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  type StockData,
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
} from "@/lib/data-utils"

interface TechnicalIndicatorsProps {
  data: StockData[]
  title?: string
  description?: string
  height?: number
}

export function TechnicalIndicators({
  data,
  title = "Indicateurs techniques",
  description,
  height = 400,
}: TechnicalIndicatorsProps) {
  const [smaPeriod, setSmaPeriod] = useState("20")
  const [emaPeriod, setEmaPeriod] = useState("20")
  const [bollingerPeriod, setBollingerPeriod] = useState("20")
  const [rsiPeriod, setRsiPeriod] = useState("14")
  const [macdFast, setMacdFast] = useState("12")
  const [macdSlow, setMacdSlow] = useState("26")
  const [macdSignal, setMacdSignal] = useState("9")

  const smaData = useMemo(() => {
    const sma = calculateSMA(data, Number.parseInt(smaPeriod))
    return data.map((day, i) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      close: day.close,
      sma: sma[i].sma,
    }))
  }, [data, smaPeriod])

  const emaData = useMemo(() => {
    const ema = calculateEMA(data, Number.parseInt(emaPeriod))
    return data.map((day, i) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      close: day.close,
      ema: ema[i].ema,
    }))
  }, [data, emaPeriod])

  const bollingerData = useMemo(() => {
    const bollinger = calculateBollingerBands(data, Number.parseInt(bollingerPeriod))
    return data.map((day, i) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      close: day.close,
      middle: bollinger[i].middle,
      upper: bollinger[i].upper,
      lower: bollinger[i].lower,
    }))
  }, [data, bollingerPeriod])

  const rsiData = useMemo(() => {
    const rsi = calculateRSI(data, Number.parseInt(rsiPeriod))
    return data.map((day, i) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      rsi: rsi[i].rsi,
    }))
  }, [data, rsiPeriod])

  const macdData = useMemo(() => {
    const macd = calculateMACD(data, Number.parseInt(macdFast), Number.parseInt(macdSlow), Number.parseInt(macdSignal))
    return data.map((day, i) => ({
      date: new Date(day.date).toISOString().split("T")[0],
      macd: macd[i].macd,
      signal: macd[i].signal,
      histogram: macd[i].histogram,
    }))
  }, [data, macdFast, macdSlow, macdSignal])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sma">
          <TabsList className="mb-4">
            <TabsTrigger value="sma">SMA</TabsTrigger>
            <TabsTrigger value="ema">EMA</TabsTrigger>
            <TabsTrigger value="bollinger">Bollinger</TabsTrigger>
            <TabsTrigger value="rsi">RSI</TabsTrigger>
            <TabsTrigger value="macd">MACD</TabsTrigger>
          </TabsList>
          <TabsContent value="sma" className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Période:</span>
              <Select value={smaPeriod} onValueChange={setSmaPeriod}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={smaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      value === smaData[0].close ? "Prix" : `SMA(${smaPeriod})`,
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sma" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="ema" className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Période:</span>
              <Select value={emaPeriod} onValueChange={setEmaPeriod}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      value === emaData[0].close ? "Prix" : `EMA(${emaPeriod})`,
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ema" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="bollinger" className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Période:</span>
              <Select value={bollingerPeriod} onValueChange={setBollingerPeriod}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bollingerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      value === bollingerData[0].close
                        ? "Prix"
                        : value === bollingerData[0].upper
                          ? "Bande supérieure"
                          : value === bollingerData[0].lower
                            ? "Bande inférieure"
                            : "Bande moyenne",
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="middle" stroke="hsl(var(--success))" strokeWidth={1} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="upper"
                    stroke="hsl(var(--warning))"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="lower"
                    stroke="hsl(var(--warning))"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="rsi" className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Période:</span>
              <Select value={rsiPeriod} onValueChange={setRsiPeriod}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                  <SelectItem value="21">21</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rsiData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
                    }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(2), `RSI(${rsiPeriod})`]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="rsi" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="70"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="30"
                    stroke="hsl(var(--success))"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="macd" className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Rapide:</span>
              <Select value={macdFast} onValueChange={setMacdFast}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Rapide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">Lent:</span>
              <Select value={macdSlow} onValueChange={setMacdSlow}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Lent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="21">21</SelectItem>
                  <SelectItem value="26">26</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">Signal:</span>
              <Select value={macdSignal} onValueChange={setMacdSignal}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Signal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macdData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    formatter={(value: number) => [value.toFixed(2), value === macdData[0].macd ? "MACD" : "Signal"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="macd" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="signal" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

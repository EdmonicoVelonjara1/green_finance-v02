"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

// Données simulées pour les aperçus de stocks
const stockData = {
  MCD: [
    { date: "Jan", price: 240 },
    { date: "Feb", price: 245 },
    { date: "Mar", price: 250 },
    { date: "Apr", price: 248 },
    { date: "May", price: 252 },
    { date: "Jun", price: 260 },
    { date: "Jul", price: 265 },
    { date: "Aug", price: 268 },
  ],
  YUM: [
    { date: "Jan", price: 125 },
    { date: "Feb", price: 128 },
    { date: "Mar", price: 130 },
    { date: "Apr", price: 132 },
    { date: "May", price: 129 },
    { date: "Jun", price: 133 },
    { date: "Jul", price: 135 },
    { date: "Aug", price: 136 },
  ],
  WEN: [
    { date: "Jan", price: 21 },
    { date: "Feb", price: 20.5 },
    { date: "Mar", price: 19.8 },
    { date: "Apr", price: 19.2 },
    { date: "May", price: 18.9 },
    { date: "Jun", price: 19.1 },
    { date: "Jul", price: 19.0 },
    { date: "Aug", price: 18.7 },
  ],
  PZZA: [
    { date: "Jan", price: 80 },
    { date: "Feb", price: 82 },
    { date: "Mar", price: 79 },
    { date: "Apr", price: 78 },
    { date: "May", price: 76 },
    { date: "Jun", price: 75 },
    { date: "Jul", price: 77 },
    { date: "Aug", price: 78 },
  ],
}

interface StockOverviewProps {
  symbol: "MCD" | "YUM" | "WEN" | "PZZA"
}

export function StockOverview({ symbol }: StockOverviewProps) {
  const data = stockData[symbol] || []

  // Déterminer la couleur en fonction de la tendance
  const isPositive = data[0]?.price <= data[data.length - 1]?.price
  const strokeColor = isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#gradient-${symbol})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

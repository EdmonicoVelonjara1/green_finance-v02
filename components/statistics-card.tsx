"use client"

import { IStat } from "@/app/api/statistic/route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { type StockData, calculateStatistics } from "@/lib/data-utils"

interface StatisticsCardProps {
  data_annual: IStat
  // data: StockData[]
  title?: string
  description?: string
  value?: string
  change?: string
  isPositive?: boolean
}

export function StatisticsCard({
  data_annual,
  // data,
  title = "Statistiques",
  description,
  value,
  change,
  isPositive,
}: StatisticsCardProps) {
  // Si value et change sont fournis, utiliser ces valeurs directement
  if (value && change) {
    return (
      <Card className="border-green-200 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-800">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <p className="text-2xl font-bold">{value}</p>
            <p className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>{change}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Vérifier si les données sont disponibles et non vides
  // if (!data || data.length === 0) {
  if(!data_annual) {
    return (
      <Card className="border-green-200 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-800">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Données non disponibles</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculer les statistiques si les données sont disponibles
  const stats = data_annual;
  // calculateStatistics(data)

  return (
    <Card className="border-green-200 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-green-800">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">Prix moyen</p>
            <p className="text-2xl font-bold">${stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">Prix médian</p>
            <p className="text-2xl font-bold">
              ${stats.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">Écart-type</p>
            <p className="text-2xl font-bold">
              ${stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">Prix minimum</p>
            <p className="text-2xl font-bold">${stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">Prix maximum</p>
            <p className="text-2xl font-bold">${stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">Asymétrie</p>
            <p className="text-2xl font-bold">{stats.skewness.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

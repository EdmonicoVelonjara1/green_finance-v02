"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockPriceChart } from "@/components/stock-price-chart"
import { TechnicalIndicators } from "@/components/technical-indicators"
import { useCompany } from "@/components/company-context-client"
import { type StockData, getSimulatedDataForCompany } from "@/lib/data-utils"
import { CompanyFilter } from "@/components/company-filter"

export default function AnalyseTechniquePage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedCompany, companyMap } = useCompany()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const data = getSimulatedDataForCompany(selectedCompany)
        setStockData(data)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCompany])
  
  const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
  }))
  // const companyName = companyMap[selectedCompany] || selectedCompany
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Analyse Technique</h1>
        <div className="flex items-center gap-3">
          <CompanyFilter companies={companies} />
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-green-700 border-green-200">
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-xl font-semibold text-green-700">Chargement des données...</div>
            <div className="text-gray-500">Veuillez patienter pendant que nous récupérons les données boursières.</div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Prix et Volume</CardTitle>
              <CardDescription>Historique des prix et volumes de transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <StockPriceChart data={stockData} height={400} />
            </CardContent>
          </Card>

          <Tabs defaultValue="moving-averages">
            <TabsList className="mb-4 bg-green-50">
              <TabsTrigger
                value="moving-averages"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Moyennes Mobiles
              </TabsTrigger>
              <TabsTrigger
                value="oscillators"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Oscillateurs
              </TabsTrigger>
              <TabsTrigger
                value="volatility"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Volatilité
              </TabsTrigger>
              <TabsTrigger
                value="trend"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Tendance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="moving-averages">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Moyennes Mobiles</CardTitle>
                  <CardDescription>Analyse des moyennes mobiles simples et exponentielles</CardDescription>
                </CardHeader>
                <CardContent>
                  <TechnicalIndicators data={stockData} height={400} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="oscillators">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Oscillateurs</CardTitle>
                  <CardDescription>Analyse des oscillateurs (RSI, Stochastique)</CardDescription>
                </CardHeader>
                <CardContent>
                  <TechnicalIndicators data={stockData} height={400} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="volatility">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Indicateurs de Volatilité</CardTitle>
                  <CardDescription>Analyse de la volatilité (Bandes de Bollinger, ATR)</CardDescription>
                </CardHeader>
                <CardContent>
                  <TechnicalIndicators data={stockData} height={400} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trend">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Indicateurs de Tendance</CardTitle>
                  <CardDescription>Analyse des tendances (MACD, ADX)</CardDescription>
                </CardHeader>
                <CardContent>
                  <TechnicalIndicators data={stockData} height={400} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Interprétation des Indicateurs</CardTitle>
              <CardDescription>Guide d'interprétation des indicateurs techniques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Moyennes Mobiles</h3>
                  <p className="text-sm text-gray-600">
                    Les moyennes mobiles lissent les fluctuations de prix pour identifier les tendances. Un croisement
                    de la moyenne mobile courte au-dessus de la moyenne mobile longue (croisement doré) est généralement
                    considéré comme un signal d'achat, tandis qu'un croisement vers le bas (croisement de la mort) est
                    considéré comme un signal de vente.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">RSI (Relative Strength Index)</h3>
                  <p className="text-sm text-gray-600">
                    Le RSI mesure la vitesse et le changement des mouvements de prix. Traditionnellement, un RSI
                    au-dessus de 70 indique que l'actif est suracheté, tandis qu'un RSI en dessous de 30 indique qu'il
                    est survendu. Ces niveaux peuvent signaler des inversions potentielles de tendance.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">MACD (Moving Average Convergence Divergence)</h3>
                  <p className="text-sm text-gray-600">
                    Le MACD est calculé en soustrayant la moyenne mobile exponentielle à long terme de la moyenne mobile
                    exponentielle à court terme. Un croisement de la ligne MACD au-dessus de la ligne de signal est
                    généralement interprété comme haussier, tandis qu'un croisement en dessous est interprété comme
                    baissier.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Bandes de Bollinger</h3>
                  <p className="text-sm text-gray-600">
                    Les bandes de Bollinger consistent en une moyenne mobile et deux bandes d'écart-type. Elles aident à
                    identifier quand un actif est suracheté ou survendu par rapport à sa volatilité récente. Un prix
                    proche de la bande supérieure peut indiquer un surachat, tandis qu'un prix proche de la bande
                    inférieure peut indiquer un survente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

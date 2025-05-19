"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useCompany } from "@/components/company-context-client"
import { type StockData, getSimulatedDataForCompany, calculateMACD } from "@/lib/data-utils"
import { CompanyFilter } from "@/components/company-filter"

export default function IndicateursTendancePage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [macdFast, setMacdFast] = useState("12")
  const [macdSlow, setMacdSlow] = useState("26")
  const [macdSignal, setMacdSignal] = useState("9")

  const { selectedCompany , companyMap} = useCompany()

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

  // Calculer le MACD
  const macdData =
    stockData.length > 0
      ? calculateMACD(stockData, Number.parseInt(macdFast), Number.parseInt(macdSlow), Number.parseInt(macdSignal))
      : []

  // Préparer les données pour le graphique
  const priceChartData = stockData.map((day, index) => {
    return {
      date: day.date.toISOString().split("T")[0],
      price: day.close,
    }
  })

  const macdChartData = macdData.map((day, index) => {
    return {
      date: day.date.toISOString().split("T")[0],
      macd: day.macd,
      signal: day.signal,
      histogram: day.histogram,
    }
  })

  // Identifier les signaux MACD
  const macdSignals = []
  for (let i = 1; i < macdChartData.length; i++) {
    const prev = macdChartData[i - 1]
    const curr = macdChartData[i]

    // Signal d'achat: MACD croise au-dessus de la ligne de signal
    if (
      prev.macd !== null &&
      prev.signal !== null &&
      curr.macd !== null &&
      curr.signal !== null &&
      prev.macd < prev.signal &&
      curr.macd > curr.signal
    ) {
      macdSignals.push({
        date: new Date(curr.date).toLocaleDateString(),
        type: "Croisement haussier",
        description: `MACD a croisé au-dessus de la ligne de signal`,
        signal: "Achat",
      })
    }

    // Signal de vente: MACD croise en-dessous de la ligne de signal
    if (
      prev.macd !== null &&
      prev.signal !== null &&
      curr.macd !== null &&
      curr.signal !== null &&
      prev.macd > prev.signal &&
      curr.macd < curr.signal
    ) {
      macdSignals.push({
        date: new Date(curr.date).toLocaleDateString(),
        type: "Croisement baissier",
        description: `MACD a croisé en-dessous de la ligne de signal`,
        signal: "Vente",
      })
    }

    // Divergence haussière: prix fait un nouveau plus bas mais MACD fait un plus bas plus haut
    if (
      i > 10 &&
      curr.macd !== null &&
      macdChartData[i - 10] !== null &&
      typeof macdChartData[i - 10]?.macd === "number" &&
      stockData[i].close < stockData[i - 10].close &&
      curr.macd > (macdChartData[i - 10] as { macd: number }).macd
    ) {
      macdSignals.push({
        date: new Date(curr.date).toLocaleDateString(),
        type: "Divergence haussière",
        description: `Le prix fait un nouveau plus bas mais le MACD fait un plus bas plus haut`,
        signal: "Achat potentiel",
      })
    }

    // Divergence baissière: prix fait un nouveau plus haut mais MACD fait un plus haut plus bas
    if (
      i > 10 &&
      curr.macd !== null &&
      macdChartData[i - 10] !== null &&
      typeof macdChartData[i - 10]?.macd === "number" &&
      stockData[i].close > stockData[i - 10].close &&
      curr.macd < (macdChartData[i - 10] as { macd: number }).macd
    ) {
      macdSignals.push({
        date: new Date(curr.date).toLocaleDateString(),
        type: "Divergence baissière",
        description: `Le prix fait un nouveau plus haut mais le MACD fait un plus haut plus bas`,
        signal: "Vente potentielle",
      })
    }
  }

  // Limiter aux 5 signaux les plus récents
  const recentMacdSignals = macdSignals.slice(-5).reverse()
  const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
  }))
  // const companyName = companyMap[selectedCompany] || selectedCompany
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Indicateurs de Tendance</h1>
        <div className="flex items-center gap-3">
          <CompanyFilter companies={companies}/>
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
              <CardTitle className="text-green-800">MACD (Moving Average Convergence Divergence)</CardTitle>
              <CardDescription>Analyse de la convergence et divergence des moyennes mobiles</CardDescription>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Rapide:</span>
                  <Select value={macdFast} onValueChange={setMacdFast}>
                    <SelectTrigger className="w-20 border-green-200">
                      <SelectValue placeholder="Rapide" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Lent:</span>
                  <Select value={macdSlow} onValueChange={setMacdSlow}>
                    <SelectTrigger className="w-20 border-green-200">
                      <SelectValue placeholder="Lent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="21">21</SelectItem>
                      <SelectItem value="26">26</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Signal:</span>
                  <Select value={macdSignal} onValueChange={setMacdSignal}>
                    <SelectTrigger className="w-20 border-green-200">
                      <SelectValue placeholder="Signal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="price">
                <TabsList className="mb-4 bg-green-50">
                  <TabsTrigger
                    value="price"
                    className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                  >
                    Prix et MACD
                  </TabsTrigger>
                  <TabsTrigger
                    value="macd"
                    className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                  >
                    MACD Détaillé
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="price">
                  <div style={{ height: "500px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={priceChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
                          }}
                        />
                        <YAxis yAxisId="left" domain={["auto", "auto"]} />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="price"
                          name="Prix"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ height: "200px", marginTop: "20px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={macdChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                          formatter={(value: number) => [value.toFixed(2), ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="macd" name="MACD" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line
                          type="monotone"
                          dataKey="signal"
                          name="Signal"
                          stroke="#047857"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Bar dataKey="histogram" name="Histogramme" fill="#34d399" opacity={0.8} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="macd">
                  <div style={{ height: "500px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={macdChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                          formatter={(value: number) => [value?.toFixed(2), ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="macd" name="MACD" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line
                          type="monotone"
                          dataKey="signal"
                          name="Signal"
                          stroke="#047857"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Bar dataKey="histogram" name="Histogramme" fill="#34d399" opacity={0.8}>
                          {macdChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={(entry.histogram ?? 0) >= 0 ? "#34d399" : "#f87171"} />
                          ))}
                        </Bar>
                        <Line
                          type="monotone"
                          dataKey="zero"
                          name="Ligne zéro"
                          stroke="#9ca3af"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Signaux MACD</CardTitle>
              <CardDescription>Signaux de trading basés sur le MACD</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMacdSignals.length > 0 ? (
                <div className="rounded-md border border-green-100">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-green-50">
                        <th className="p-2 text-left font-medium text-green-800">Date</th>
                        <th className="p-2 text-left font-medium text-green-800">Type</th>
                        <th className="p-2 text-left font-medium text-green-800">Description</th>
                        <th className="p-2 text-left font-medium text-green-800">Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMacdSignals.map((signal, index) => (
                        <tr key={index} className="border-b border-green-50">
                          <td className="p-2 text-gray-700">{signal.date}</td>
                          <td className="p-2 text-gray-700">{signal.type}</td>
                          <td className="p-2 text-gray-700">{signal.description}</td>
                          <td
                            className={`p-2 font-medium ${signal.signal.includes("Achat") ? "text-green-600" : "text-red-600"}`}
                          >
                            {signal.signal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Aucun signal MACD significatif détecté récemment.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Interprétation du MACD</CardTitle>
              <CardDescription>Guide d'utilisation du MACD pour l'analyse technique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Qu'est-ce que le MACD?</h3>
                  <p className="text-sm text-gray-600">
                    Le MACD (Moving Average Convergence Divergence) est un indicateur de tendance qui montre la relation
                    entre deux moyennes mobiles exponentielles (EMA) du prix d'un titre. Il est calculé en soustrayant
                    l'EMA à long terme (généralement 26 périodes) de l'EMA à court terme (généralement 12 périodes).
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Composants du MACD</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Ligne MACD:</strong> La différence entre l'EMA rapide et l'EMA lente.
                    <br />
                    <strong>Ligne de signal:</strong> Une EMA de la ligne MACD (généralement sur 9 périodes).
                    <br />
                    <strong>Histogramme:</strong> La différence entre la ligne MACD et la ligne de signal.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Signaux de Trading</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Croisement de la ligne de signal:</strong> Un signal d'achat est généré lorsque la ligne
                    MACD croise au-dessus de la ligne de signal. Un signal de vente est généré lorsque la ligne MACD
                    croise en dessous de la ligne de signal.
                    <br />
                    <strong>Croisement de la ligne zéro:</strong> Un croisement au-dessus de la ligne zéro est considéré
                    comme haussier, tandis qu'un croisement en dessous est considéré comme baissier.
                    <br />
                    <strong>Divergences:</strong> Une divergence se produit lorsque le prix et le MACD se déplacent dans
                    des directions opposées, ce qui peut signaler un renversement potentiel de tendance.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Conseils d'Utilisation</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Confirmation:</strong> Utilisez le MACD en conjonction avec d'autres indicateurs techniques
                    pour confirmer les signaux.
                    <br />
                    <strong>Tendance:</strong> Le MACD est plus efficace dans les marchés tendanciels et peut donner de
                    faux signaux dans les marchés sans tendance claire.
                    <br />
                    <strong>Paramètres:</strong> Les paramètres standard (12, 26, 9) fonctionnent bien pour la plupart
                    des marchés, mais peuvent être ajustés en fonction de l'horizon de trading.
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

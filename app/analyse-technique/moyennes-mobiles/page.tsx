"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useCompany } from "@/components/company-context-client"
import { type StockData, calculateSMA, calculateEMA, getSimulatedDataForCompany } from "@/lib/data-utils"
import { CompanyFilter } from "@/components/company-filter"

export default function MoyennesMobilesPage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [smaPeriod1, setSmaPeriod1] = useState("20")
  const [smaPeriod2, setSmaPeriod2] = useState("50")
  const [smaPeriod3, setSmaPeriod3] = useState("200")
  const [emaPeriod1, setEmaPeriod1] = useState("12")
  const [emaPeriod2, setEmaPeriod2] = useState("26")

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

  // Calculer les moyennes mobiles simples
  const sma1Data = stockData.length > 0 ? calculateSMA(stockData, Number.parseInt(smaPeriod1)) : []
  const sma2Data = stockData.length > 0 ? calculateSMA(stockData, Number.parseInt(smaPeriod2)) : []
  const sma3Data = stockData.length > 0 ? calculateSMA(stockData, Number.parseInt(smaPeriod3)) : []

  // Calculer les moyennes mobiles exponentielles
  const ema1Data = stockData.length > 0 ? calculateEMA(stockData, Number.parseInt(emaPeriod1)) : []
  const ema2Data = stockData.length > 0 ? calculateEMA(stockData, Number.parseInt(emaPeriod2)) : []

  // Préparer les données pour le graphique
  const chartData = stockData.map((day, index) => {
    return {
      date: day.date.toISOString().split("T")[0],
      price: day.close,
      sma1: sma1Data[index]?.sma || null,
      sma2: sma2Data[index]?.sma || null,
      sma3: sma3Data[index]?.sma || null,
      ema1: ema1Data[index]?.ema || null,
      ema2: ema2Data[index]?.ema || null,
    }
  })

  // Analyser les croisements de moyennes mobiles
  const crossovers = []
  if (chartData.length > 0) {
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1]
      const curr = chartData[i]

      // Croisement SMA courte/moyenne (signal haussier)
      if (
        prev.sma1 !== null &&
        prev.sma2 !== null &&
        curr.sma1 !== null &&
        curr.sma2 !== null &&
        prev.sma1 < prev.sma2 &&
        curr.sma1 > curr.sma2
      ) {
        crossovers.push({
          date: new Date(curr.date).toLocaleDateString(),
          type: "Croisement haussier",
          description: `SMA${smaPeriod1} a croisé au-dessus de SMA${smaPeriod2}`,
          signal: "Achat",
        })
      }

      // Croisement SMA courte/moyenne (signal baissier)
      if (
        prev.sma1 !== null &&
        prev.sma2 !== null &&
        curr.sma1 !== null &&
        curr.sma2 !== null &&
        prev.sma1 > prev.sma2 &&
        curr.sma1 < curr.sma2
      ) {
        crossovers.push({
          date: new Date(curr.date).toLocaleDateString(),
          type: "Croisement baissier",
          description: `SMA${smaPeriod1} a croisé en-dessous de SMA${smaPeriod2}`,
          signal: "Vente",
        })
      }

      // Croisement EMA (signal haussier)
      if (
        prev.ema1 !== null &&
        prev.ema2 !== null &&
        curr.ema1 !== null &&
        curr.ema2 !== null &&
        prev.ema1 < prev.ema2 &&
        curr.ema1 > curr.ema2
      ) {
        crossovers.push({
          date: new Date(curr.date).toLocaleDateString(),
          type: "Croisement EMA haussier",
          description: `EMA${emaPeriod1} a croisé au-dessus de EMA${emaPeriod2}`,
          signal: "Achat",
        })
      }

      // Croisement EMA (signal baissier)
      if (
        prev.ema1 !== null &&
        prev.ema2 !== null &&
        curr.ema1 !== null &&
        curr.ema2 !== null &&
        prev.ema1 > prev.ema2 &&
        curr.ema1 < curr.ema2
      ) {
        crossovers.push({
          date: new Date(curr.date).toLocaleDateString(),
          type: "Croisement EMA baissier",
          description: `EMA${emaPeriod1} a croisé en-dessous de EMA${emaPeriod2}`,
          signal: "Vente",
        })
      }
    }
  }

  // Limiter aux 5 croisements les plus récents
  const recentCrossovers = crossovers.slice(-5).reverse()
    const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
  }))
  // const companyName = companyMap[selectedCompany] || selectedCompany
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Moyennes Mobiles</h1>
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
          <Tabs defaultValue="sma">
            <TabsList className="mb-4 bg-green-50">
              <TabsTrigger value="sma" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                Moyennes Mobiles Simples (SMA)
              </TabsTrigger>
              <TabsTrigger value="ema" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                Moyennes Mobiles Exponentielles (EMA)
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Comparaison SMA/EMA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sma">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Moyennes Mobiles Simples (SMA)</CardTitle>
                  <CardDescription>Analyse des tendances avec différentes périodes de SMA</CardDescription>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700">SMA 1:</span>
                      <Select value={smaPeriod1} onValueChange={setSmaPeriod1}>
                        <SelectTrigger className="w-20 border-green-200">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700">SMA 2:</span>
                      <Select value={smaPeriod2} onValueChange={setSmaPeriod2}>
                        <SelectTrigger className="w-20 border-green-200">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700">SMA 3:</span>
                      <Select value={smaPeriod3} onValueChange={setSmaPeriod3}>
                        <SelectTrigger className="w-20 border-green-200">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "500px" }}>
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
                          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="price"
                          name="Prix"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sma1"
                          name={`SMA(${smaPeriod1})`}
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sma2"
                          name={`SMA(${smaPeriod2})`}
                          stroke="#047857"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sma3"
                          name={`SMA(${smaPeriod3})`}
                          stroke="#065f46"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ema">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Moyennes Mobiles Exponentielles (EMA)</CardTitle>
                  <CardDescription>Analyse des tendances avec différentes périodes d'EMA</CardDescription>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700">EMA 1:</span>
                      <Select value={emaPeriod1} onValueChange={setEmaPeriod1}>
                        <SelectTrigger className="w-20 border-green-200">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700">EMA 2:</span>
                      <Select value={emaPeriod2} onValueChange={setEmaPeriod2}>
                        <SelectTrigger className="w-20 border-green-200">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="26">26</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "500px" }}>
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
                          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="price"
                          name="Prix"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="ema1"
                          name={`EMA(${emaPeriod1})`}
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="ema2"
                          name={`EMA(${emaPeriod2})`}
                          stroke="#047857"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Comparaison SMA vs EMA</CardTitle>
                  <CardDescription>Comparaison entre moyennes mobiles simples et exponentielles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "500px" }}>
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
                          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="price"
                          name="Prix"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sma1"
                          name={`SMA(${smaPeriod1})`}
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="ema1"
                          name={`EMA(${emaPeriod1})`}
                          stroke="#047857"
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Signaux de Trading</CardTitle>
              <CardDescription>Croisements de moyennes mobiles récents</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCrossovers.length > 0 ? (
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
                      {recentCrossovers.map((crossover, index) => (
                        <tr key={index} className="border-b border-green-50">
                          <td className="p-2 text-gray-700">{crossover.date}</td>
                          <td className="p-2 text-gray-700">{crossover.type}</td>
                          <td className="p-2 text-gray-700">{crossover.description}</td>
                          <td
                            className={`p-2 font-medium ${crossover.signal === "Achat" ? "text-green-600" : "text-red-600"}`}
                          >
                            {crossover.signal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Aucun croisement de moyennes mobiles significatif détecté récemment.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Interprétation des Moyennes Mobiles</CardTitle>
              <CardDescription>Guide d'utilisation des moyennes mobiles pour l'analyse technique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Moyenne Mobile Simple (SMA)</h3>
                  <p className="text-sm text-gray-600">
                    La moyenne mobile simple calcule la moyenne arithmétique des prix sur une période donnée. Elle est
                    utile pour identifier la direction de la tendance et les niveaux de support/résistance potentiels.
                    Les SMA courtes (20 jours) réagissent plus rapidement aux changements de prix, tandis que les SMA
                    longues (200 jours) montrent les tendances à long terme.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Moyenne Mobile Exponentielle (EMA)</h3>
                  <p className="text-sm text-gray-600">
                    La moyenne mobile exponentielle donne plus de poids aux prix récents, ce qui la rend plus réactive
                    aux changements de prix que la SMA. L'EMA est souvent préférée pour les marchés volatils ou pour les
                    traders qui cherchent à capturer les mouvements de prix à court terme.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Croisements de Moyennes Mobiles</h3>
                  <p className="text-sm text-gray-600">
                    Un croisement haussier se produit lorsqu'une moyenne mobile à court terme croise au-dessus d'une
                    moyenne mobile à plus long terme, signalant potentiellement le début d'une tendance haussière. À
                    l'inverse, un croisement baissier se produit lorsqu'une moyenne mobile à court terme croise en
                    dessous d'une moyenne mobile à plus long terme, signalant potentiellement le début d'une tendance
                    baissière.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Stratégies Courantes</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Croisement doré (Golden Cross):</strong> Lorsque la SMA 50 jours croise au-dessus de la SMA
                    200 jours, indiquant un potentiel marché haussier à long terme.
                    <br />
                    <strong>Croisement de la mort (Death Cross):</strong> Lorsque la SMA 50 jours croise en dessous de
                    la SMA 200 jours, indiquant un potentiel marché baissier à long terme.
                    <br />
                    <strong>Support/Résistance:</strong> Les moyennes mobiles à long terme (100, 200 jours) servent
                    souvent de niveaux de support ou de résistance dynamiques.
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

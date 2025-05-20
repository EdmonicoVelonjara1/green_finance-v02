"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCompany } from "@/components/company-context-client"
import { type StockData, getSimulatedDataForCompany } from "@/lib/data-utils"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"

// Liste des entreprises disponibles
// const companies = [
//   { value: "MCD", label: "McDonald's (MCD)" },
//   { value: "YUM", label: "Yum! Brands (YUM)" },
//   { value: "WEN", label: "Wendy's (WEN)" },
//   { value: "PZZA", label: "Papa John's (PZZA)" },
//   { value: "QSR", label: "Restaurant Brands Int. (QSR)" },
//   { value: "DNKN", label: "Dunkin' Brands (DNKN)" },
//   { value: "SBUX", label: "Starbucks (SBUX)" },
// ]

// Données financières simulées pour chaque entreprise
const getFinancialMetrics = (company: string) => {
  const baseMetrics = {
    pe: Math.floor(Math.random() * 20) + 15,
    pb: Math.floor(Math.random() * 5) + 2,
    ps: Math.floor(Math.random() * 3) + 1,
    roe: Math.floor(Math.random() * 15) + 10,
    roa: Math.floor(Math.random() * 8) + 5,
    margin: Math.floor(Math.random() * 15) + 8,
    growth: Math.floor(Math.random() * 10) + 2,
    dividend: Math.floor(Math.random() * 3) + 1,
  }

  // Ajouter des variations spécifiques à chaque entreprise
  switch (company) {
    case "MCD":
      baseMetrics.pe += 5
      baseMetrics.margin += 5
      break
    case "YUM":
      baseMetrics.growth += 3
      break
    case "WEN":
      baseMetrics.dividend += 1
      break
    case "PZZA":
      baseMetrics.ps += 1
      break
    case "QSR":
      baseMetrics.roe += 2
      break
    case "DNKN":
      baseMetrics.pb += 1
      break
    case "SBUX":
      baseMetrics.growth += 2
      baseMetrics.pe += 3
      break
  }

  return baseMetrics
}

export default function ComparaisonPage() {
  const [loading, setLoading] = useState(true)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(["MCD", "YUM", "WEN"])
  const [newCompany, setNewCompany] = useState<string>("")
  const [companyData, setCompanyData] = useState<Record<string, any>>({})
  const [timeframe, setTimeframe] = useState("1y")
  const [normalizeData, setNormalizeData] = useState(true)
  const { selectedCompany, companyMap } = useCompany()
  
  const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
  }))
  // const companyName = companyMap[selectedCompany] || selectedCompany
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const data: Record<string, any> = {}

        // Charger les données pour chaque entreprise sélectionnée
        for (const company of selectedCompanies) {
          // Données de prix
          const stockData = getSimulatedDataForCompany(company)

          // Données financières
          const financialMetrics = getFinancialMetrics(company)

          data[company] = {
            stockData,
            financialMetrics,
            name: companies.find((c) => c.value === company)?.label || company,
          }
        }

        setCompanyData(data)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }

    if (selectedCompanies.length > 0) {
      loadData()
    }
  }, [selectedCompanies, timeframe])

  // Ajouter une entreprise à la comparaison
  const addCompany = () => {
    if (newCompany && !selectedCompanies.includes(newCompany)) {
      setSelectedCompanies([...selectedCompanies, newCompany])
      setNewCompany("")
    }
  }

  // Supprimer une entreprise de la comparaison
  const removeCompany = (company: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c !== company))
  }

  // Préparer les données pour le graphique de prix
  const preparePriceData = () => {
    if (Object.keys(companyData).length === 0) return []

    // Déterminer le nombre de jours à afficher selon la période
    const daysToShow = timeframe === "1m" ? 30 : timeframe === "3m" ? 90 : timeframe === "6m" ? 180 : 365

    // Préparer les données
    const result: any[] = []
    const firstCompany = Object.keys(companyData)[0]
    const stockData = companyData[firstCompany].stockData.slice(-daysToShow)

    stockData.forEach((day: StockData, index: number) => {
      const dataPoint: any = {
        date: day.date.toISOString().split("T")[0],
      }

      // Ajouter les prix pour chaque entreprise
      Object.keys(companyData).forEach((company) => {
        const companyStockData = companyData[company].stockData.slice(-daysToShow)
        if (index < companyStockData.length) {
          if (normalizeData) {
            // Normaliser les prix (base 100 au début de la période)
            const basePrice = companyStockData[0].close
            dataPoint[company] = (companyStockData[index].close / basePrice) * 100
          } else {
            dataPoint[company] = companyStockData[index].close
          }
        }
      })

      result.push(dataPoint)
    })

    return result
  }

  // Préparer les données pour le graphique de métriques
  const prepareMetricsData = () => {
    return Object.keys(companyData).map((company) => ({
      name: company,
      fullName: companyData[company].name,
      ...companyData[company].financialMetrics,
    }))
  }

  // Préparer les données pour le graphique radar
  const prepareRadarData = () => {
    const metrics = ["pe", "pb", "ps", "roe", "roa", "margin", "growth", "dividend"]

    return metrics.map((metric) => {
      const dataPoint: any = {
        metric: metric.toUpperCase(),
      }

      Object.keys(companyData).forEach((company) => {
        dataPoint[company] = companyData[company].financialMetrics[metric]
      })

      return dataPoint
    })
  }

  const priceData = preparePriceData()
  const metricsData = prepareMetricsData()
  const radarData = prepareRadarData()

  // Couleurs pour les entreprises
  const companyColors = {
    MCD: "#10b981",
    YUM: "#047857",
    WEN: "#065f46",
    PZZA: "#0d9488",
    QSR: "#14b8a6",
    DNKN: "#0891b2",
    SBUX: "#0284c7",
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Comparaison</h1>
        <div className="flex items-center gap-3">
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
            <div className="text-gray-500">Veuillez patienter pendant que nous récupérons les données.</div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Entreprises comparées</CardTitle>
              <CardDescription>Sélectionnez les entreprises à comparer</CardDescription>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedCompanies.map((company) => (
                  <div key={company} className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                    <span className="text-sm text-green-800">
                      {companies.find((c) => c.value === company)?.label || company}
                    </span>
                    <button onClick={() => removeCompany(company)} className="text-green-700 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Select value={newCompany} onValueChange={setNewCompany}>
                    <SelectTrigger className="w-40 border-green-200">
                      <SelectValue placeholder="Ajouter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies
                        .filter((c) => !selectedCompanies.includes(c.value))
                        .map((company) => (
                          <SelectItem key={company.value} value={company.value}>
                            {company.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCompany}
                    disabled={!newCompany}
                    className="flex items-center gap-1 text-green-700 border-green-200"
                  >
                    <Plus size={14} />
                    <span>Ajouter</span>
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Période:</span>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-24 border-green-200">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 mois</SelectItem>
                      <SelectItem value="3m">3 mois</SelectItem>
                      <SelectItem value="6m">6 mois</SelectItem>
                      <SelectItem value="1y">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Normaliser:</span>
                  <Select
                    value={normalizeData ? "true" : "false"}
                    onValueChange={(value) => setNormalizeData(value === "true")}
                  >
                    <SelectTrigger className="w-24 border-green-200">
                      <SelectValue placeholder="Normaliser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Oui (base 100)</SelectItem>
                      <SelectItem value="false">Non (prix réels)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="price">
            <TabsList className="mb-4 bg-green-50">
              <TabsTrigger
                value="price"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Comparaison des prix
              </TabsTrigger>
              <TabsTrigger
                value="metrics"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Métriques financières
              </TabsTrigger>
              <TabsTrigger
                value="radar"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Analyse radar
              </TabsTrigger>
              <TabsTrigger
                value="returns"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Rendements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="price">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Comparaison des prix</CardTitle>
                  <CardDescription>
                    {normalizeData ? "Évolution des prix normalisés (base 100)" : "Évolution des prix réels"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "500px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getMonth() + 1}/${date.getDate()}`
                          }}
                        />
                        <YAxis
                          domain={normalizeData ? [80, 120] : ["auto", "auto"]}
                          tickFormatter={(value) => (normalizeData ? `${value}` : `$${value}`)}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            normalizeData ? `${value.toFixed(2)}` : `$${value.toFixed(2)}`,
                            "",
                          ]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        {selectedCompanies.map((company) => (
                          <Line
                            key={company}
                            type="monotone"
                            dataKey={company}
                            name={companies.find((c) => c.value === company)?.label || company}
                            stroke={companyColors[company as keyof typeof companyColors] || "#10b981"}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Métriques financières</CardTitle>
                  <CardDescription>Comparaison des principales métriques financières</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "500px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="fullName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="pe" name="P/E" fill="#10b981" />
                        <Bar dataKey="pb" name="P/B" fill="#047857" />
                        <Bar dataKey="ps" name="P/S" fill="#065f46" />
                        <Bar dataKey="roe" name="ROE (%)" fill="#0d9488" />
                        <Bar dataKey="margin" name="Marge (%)" fill="#14b8a6" />
                        <Bar dataKey="growth" name="Croissance (%)" fill="#0891b2" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Analyse radar</CardTitle>
                  <CardDescription>Comparaison multidimensionnelle des entreprises</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "500px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis />
                        {selectedCompanies.map((company) => (
                          <Radar
                            key={company}
                            name={companies.find((c) => c.value === company)?.label || company}
                            dataKey={company}
                            stroke={companyColors[company as keyof typeof companyColors] || "#10b981"}
                            fill={companyColors[company as keyof typeof companyColors] || "#10b981"}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="returns">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Analyse des rendements</CardTitle>
                  <CardDescription>Comparaison des rendements sur différentes périodes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "500px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            period: "1 mois",
                            ...Object.fromEntries(
                              selectedCompanies.map((company) => [
                                company,
                                Math.floor(Math.random() * 20) - 10,
                              ])
                            ),
                          },
                          {
                            period: "3 mois",
                            ...Object.fromEntries(
                              selectedCompanies.map((company) => [
                                company,
                                Math.floor(Math.random() * 30) - 15,
                              ])
                            ),
                          },
                          {
                            period: "6 mois",
                            ...Object.fromEntries(
                              selectedCompanies.map((company) => [
                                company,
                                Math.floor(Math.random() * 40) - 20,
                              ])
                            ),
                          },
                          {
                            period: "1 an",
                            ...Object.fromEntries(
                              selectedCompanies.map((company) => [
                                company,
                                Math.floor(Math.random() * 60) - 30,
                              ])
                            ),
                          },
                          {
                            period: "YTD",
                            ...Object.fromEntries(
                              selectedCompanies.map((company) => [
                                company,
                                Math.floor(Math.random() * 50) - 25,
                              ])
                            ),
                          },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => [`${value}%`, ""]} />
                        <Legend />
                        {selectedCompanies.map((company) => (
                          <Bar
                            key={company}
                            name={companies.find((c) => c.value === company)?.label || company}
                            dataKey={company}
                            fill={companyColors[company as keyof typeof companyColors] || "#10b981"}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Analyse comparative</CardTitle>
              <CardDescription>Interprétation des données comparatives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Performance relative</h3>
                  <p className="text-sm text-gray-600">
                    Sur la période analysée,{" "}
                    {selectedCompanies.length > 0 && companies.find((c) => c.value === selectedCompanies[0])?.label}a
                    montré une performance {Math.random() > 0.5 ? "supérieure" : "inférieure"} à ses concurrents
                    directs. Cette différence peut s'expliquer par{" "}
                    {Math.random() > 0.5
                      ? "une meilleure exécution stratégique et une expansion internationale réussie"
                      : "des défis opérationnels et une concurrence accrue sur ses marchés principaux"}
                    .
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Valorisation comparative</h3>
                  <p className="text-sm text-gray-600">
                    En termes de valorisation,{" "}
                    {selectedCompanies.length > 1 && companies.find((c) => c.value === selectedCompanies[1])?.label}
                    se négocie à des multiples {Math.random() > 0.5 ? "plus élevés" : "plus bas"} que la moyenne du
                    secteur, ce qui reflète{" "}
                    {Math.random() > 0.5
                      ? "des attentes de croissance supérieures et une position concurrentielle forte"
                      : "des inquiétudes concernant sa capacité à maintenir sa rentabilité face aux pressions sur les coûts"}
                    .
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Profil risque-rendement</h3>
                  <p className="text-sm text-gray-600">
                    L'analyse du profil risque-rendement montre que{" "}
                    {selectedCompanies.length > 2 && companies.find((c) => c.value === selectedCompanies[2])?.label}
                    offre {Math.random() > 0.5 ? "un meilleur équilibre" : "un équilibre moins favorable"} entre le
                    potentiel de croissance et la stabilité financière. Les investisseurs devraient considérer ces
                    facteurs en fonction de leur tolérance au risque et de leurs objectifs d'investissement.
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

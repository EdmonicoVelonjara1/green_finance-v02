"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCompany } from "@/components/company-context-client"
import { CompanyFilter } from "@/components/company-filter"
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
  Cell,
} from "recharts"

// Données simulées pour les dividendes
const getDividendData = (company: string) => {
  // Historique des dividendes
  const dividendHistory = []
  const currentYear = new Date().getFullYear()

  // Générer des données pour les 5 dernières années
  for (let year = currentYear - 4; year <= currentYear; year++) {
    // Dividende annuel de base selon l'entreprise
    let baseAnnualDividend = 0
    switch (company) {
      case "MCD":
        baseAnnualDividend = 5.0 + Math.random() * 0.5
        break
      case "YUM":
        baseAnnualDividend = 2.0 + Math.random() * 0.3
        break
      case "WEN":
        baseAnnualDividend = 0.5 + Math.random() * 0.1
        break
      case "PZZA":
        baseAnnualDividend = 1.0 + Math.random() * 0.2
        break
      case "QSR":
        baseAnnualDividend = 2.2 + Math.random() * 0.3
        break
      case "DNKN":
        baseAnnualDividend = 1.5 + Math.random() * 0.2
        break
      case "SBUX":
        baseAnnualDividend = 1.8 + Math.random() * 0.3
        break
      default:
        baseAnnualDividend = 1.0 + Math.random() * 0.2
    }

    // Augmentation progressive des dividendes au fil des ans
    const yearFactor = (year - (currentYear - 4)) / 4
    const annualDividend = baseAnnualDividend * (1 + yearFactor * 0.2)

    // Dividendes trimestriels
    for (let quarter = 1; quarter <= 4; quarter++) {
      // Ne pas inclure les dividendes futurs pour l'année en cours
      if (year === currentYear && quarter > Math.floor((new Date().getMonth() + 1) / 3)) {
        continue
      }

      const quarterlyDividend = annualDividend / 4

      dividendHistory.push({
        date: `${year}Q${quarter}`,
        year,
        quarter,
        dividend: Number.parseFloat(quarterlyDividend.toFixed(2)),
        exDate: `${year}-${quarter * 3 - 2}-15`,
        paymentDate: `${year}-${quarter * 3}-01`,
      })
    }
  }

  // Calendrier des dividendes à venir
  const upcomingDividends = []
  const currentQuarter = Math.floor((new Date().getMonth() + 1) / 3) + 1

  for (let quarter = currentQuarter; quarter <= currentQuarter + 3; quarter++) {
    const actualQuarter = ((quarter - 1) % 4) + 1
    const yearOffset = Math.floor((quarter - 1) / 4)
    const year = currentYear + yearOffset

    // Dividende trimestriel estimé
    const baseAnnualDividend =
      dividendHistory.length > 0 ? dividendHistory[dividendHistory.length - 1].dividend * 4 * 1.05 : 2.0

    const quarterlyDividend = baseAnnualDividend / 4

    upcomingDividends.push({
      date: `${year}Q${actualQuarter}`,
      year,
      quarter: actualQuarter,
      dividend: Number.parseFloat(quarterlyDividend.toFixed(2)),
      exDate: `${year}-${actualQuarter * 3 - 2}-15`,
      paymentDate: `${year}-${actualQuarter * 3}-01`,
      estimated: true,
    })
  }

  // Statistiques de rendement
  const currentPrice = 100 + Math.random() * 100
  const annualDividend =
    dividendHistory.length >= 4 ? dividendHistory.slice(-4).reduce((sum, d) => sum + d.dividend, 0) : 0

  const dividendYield = (annualDividend / currentPrice) * 100
  const fiveYearGrowth =
    dividendHistory.length > 0
      ? ((dividendHistory[dividendHistory.length - 1].dividend * 4) / (dividendHistory[0].dividend * 4) - 1) * 100
      : 0

  const payoutRatio = 30 + Math.random() * 30

  return {
    dividendHistory,
    upcomingDividends,
    stats: {
      currentPrice: Number.parseFloat(currentPrice.toFixed(2)),
      annualDividend: Number.parseFloat(annualDividend.toFixed(2)),
      dividendYield: Number.parseFloat(dividendYield.toFixed(2)),
      fiveYearGrowth: Number.parseFloat(fiveYearGrowth.toFixed(2)),
      payoutRatio: Number.parseFloat(payoutRatio.toFixed(2)),
    },
  }
}

export default function DividendesPage() {
  const [loading, setLoading] = useState(true)
  const [dividendData, setDividendData] = useState<any>(null)
  const [timeframe, setTimeframe] = useState("5y")
  const { selectedCompany,companyMap } = useCompany()
  const companyName = companyMap[selectedCompany] || selectedCompany

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Simuler un délai de chargement
        await new Promise((resolve) => setTimeout(resolve, 500))
        const data = getDividendData(selectedCompany)
        setDividendData(data)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCompany])

  // Préparer les données pour le graphique d'historique des dividendes
  const prepareDividendHistoryData = () => {
    if (!dividendData) return []

    // Filtrer selon la période sélectionnée
    const currentYear = new Date().getFullYear()
    let startYear = currentYear

    switch (timeframe) {
      case "1y":
        startYear = currentYear - 1
        break
      case "3y":
        startYear = currentYear - 3
        break
      case "5y":
        startYear = currentYear - 5
        break
      case "10y":
        startYear = currentYear - 10
        break
    }

    return dividendData.dividendHistory.filter((d: any) => d.year >= startYear)
  }

  // Préparer les données pour le graphique de rendement des dividendes
  const prepareDividendYieldData = () => {
    if (!dividendData) return []

    // Calculer le rendement des dividendes pour chaque année
    const yields: { year: number; dividend: number; yield: number }[] = []
    const history = dividendData.dividendHistory

    // Regrouper par année
    const yearlyDividends = history.reduce(
      (acc: Record<number, number>, item: { year: number; dividend: number }) => {
        if (!acc[item.year]) {
          acc[item.year] = 0
        }
        acc[item.year] += item.dividend
        return acc
      },
      {}
    )

    // Créer les données de rendement
    Object.keys(yearlyDividends).forEach((year) => {
      // Prix simulé pour l'année (croissance de 5% par an depuis le prix actuel)
      const yearDiff = new Date().getFullYear() - Number.parseInt(year)
      const historicalPrice = dividendData.stats.currentPrice / Math.pow(1.05, yearDiff)

      yields.push({
        year: Number.parseInt(year),
        dividend: yearlyDividends[year],
        yield: (yearlyDividends[year] / historicalPrice) * 100,
      })
    })

    return yields.filter((d) => d.year >= new Date().getFullYear() - 5)
  }

  const dividendHistoryData = prepareDividendHistoryData()
  const dividendYieldData = prepareDividendYieldData()

  const COLORS = ["#10b981", "#047857", "#065f46", "#0d9488"]
    const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
    }))
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Dividendes</h1>
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
            <div className="text-gray-500">
              Veuillez patienter pendant que nous récupérons les données de dividendes.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Dividende annuel</CardTitle>
                <CardDescription>Dividende total sur 12 mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${dividendData.stats.annualDividend}</div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Rendement</CardTitle>
                <CardDescription>Rendement du dividende</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dividendData.stats.dividendYield}%</div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Croissance sur 5 ans</CardTitle>
                <CardDescription>Croissance annualisée</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dividendData.stats.fiveYearGrowth}%</div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Ratio de distribution</CardTitle>
                <CardDescription>% des bénéfices distribués</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dividendData.stats.payoutRatio}%</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Historique des dividendes</CardTitle>
              <CardDescription>Évolution des dividendes au fil du temps</CardDescription>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Période:</span>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-24 border-green-200">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1y">1 an</SelectItem>
                      <SelectItem value="3y">3 ans</SelectItem>
                      <SelectItem value="5y">5 ans</SelectItem>
                      <SelectItem value="10y">10 ans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ height: "400px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dividendHistoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [`$${value}`, "Dividende"]} />
                    <Legend />
                    <Bar dataKey="dividend" name="Dividende" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4 bg-green-50">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Dividendes à venir
              </TabsTrigger>
              <TabsTrigger
                value="yield"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Rendement des dividendes
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Comparaison sectorielle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Calendrier des dividendes</CardTitle>
                  <CardDescription>Prochains dividendes prévus</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-green-100">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-green-50">
                          <th className="p-2 text-left font-medium text-green-800">Trimestre</th>
                          <th className="p-2 text-left font-medium text-green-800">Dividende</th>
                          <th className="p-2 text-left font-medium text-green-800">Date ex-dividende</th>
                          <th className="p-2 text-left font-medium text-green-800">Date de paiement</th>
                          <th className="p-2 text-left font-medium text-green-800">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dividendData.upcomingDividends.map(
                          (
                            dividend: {
                              date: string
                              year: number
                              quarter: number
                              dividend: number
                              exDate: string
                              paymentDate: string
                              estimated?: boolean
                            },
                            index: number
                          ) => (
                            <tr key={index} className="border-b border-green-50">
                              <td className="p-2 text-gray-700">{dividend.date}</td>
                              <td className="p-2 font-medium text-green-700">${dividend.dividend}</td>
                              <td className="p-2 text-gray-700">{new Date(dividend.exDate).toLocaleDateString()}</td>
                              <td className="p-2 text-gray-700">{new Date(dividend.paymentDate).toLocaleDateString()}</td>
                              <td className="p-2 text-gray-700">
                                {dividend.estimated ? (
                                  <span className="text-amber-600">Estimé</span>
                                ) : (
                                  <span className="text-green-600">Confirmé</span>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="yield">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Rendement des dividendes</CardTitle>
                  <CardDescription>Évolution du rendement des dividendes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dividendYieldData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => [`${value}%`, "Rendement"]} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="yield"
                          name="Rendement"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={true}
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
                  <CardTitle className="text-green-800">Comparaison sectorielle</CardTitle>
                  <CardDescription>Rendement des dividendes par rapport au secteur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-3">Rendement des dividendes</h3>
                      <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "MCD", value: 2.3 },
                              { name: "YUM", value: 1.8 },
                              { name: "WEN", value: 4.2 },
                              { name: "PZZA", value: 2.1 },
                              { name: "QSR", value: 3.5 },
                              { name: "Secteur", value: 2.8 },
                              { name: "S&P 500", value: 1.5 },
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value) => [`${value}%`, "Rendement"]} />
                            <Bar dataKey="value" name="Rendement" fill="#10b981">
                              {[
                                { name: "MCD", value: 2.3 },
                                { name: "YUM", value: 1.8 },
                                { name: "WEN", value: 4.2 },
                                { name: "PZZA", value: 2.1 },
                                { name: "QSR", value: 3.5 },
                                { name: "Secteur", value: 2.8 },
                                { name: "S&P 500", value: 1.5 },
                              ].map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.name === selectedCompany ? "#047857" : "#10b981"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-3">Croissance des dividendes (5 ans)</h3>
                      <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "MCD", value: 8.2 },
                              { name: "YUM", value: 6.5 },
                              { name: "WEN", value: 3.8 },
                              { name: "PZZA", value: 5.2 },
                              { name: "QSR", value: 7.1 },
                              { name: "Secteur", value: 6.0 },
                              { name: "S&P 500", value: 5.5 },
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value) => [`${value}%`, "Croissance"]} />
                            <Bar dataKey="value" name="Croissance" fill="#10b981">
                              {[
                                { name: "MCD", value: 8.2 },
                                { name: "YUM", value: 6.5 },
                                { name: "WEN", value: 3.8 },
                                { name: "PZZA", value: 5.2 },
                                { name: "QSR", value: 7.1 },
                                { name: "Secteur", value: 6.0 },
                                { name: "S&P 500", value: 5.5 },
                              ].map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.name === selectedCompany ? "#047857" : "#10b981"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Analyse des dividendes</CardTitle>
              <CardDescription>Interprétation des données de dividendes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Politique de dividendes</h3>
                  <p className="text-sm text-gray-600">
                    {companyName} maintient une politique de dividendes{" "}
                    {dividendData.stats.payoutRatio > 50 ? "généreuse" : "prudente"}
                    avec un ratio de distribution de {dividendData.stats.payoutRatio}% des bénéfices. Cette approche{" "}
                    {dividendData.stats.payoutRatio > 50
                      ? "privilégie la rémunération des actionnaires"
                      : "permet de conserver des ressources pour la croissance future"}
                    tout en offrant un rendement de {dividendData.stats.dividendYield}%,
                    {dividendData.stats.dividendYield > 2.5
                      ? " supérieur à la moyenne du secteur."
                      : " légèrement inférieur à la moyenne du secteur."}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Croissance des dividendes</h3>
                  <p className="text-sm text-gray-600">
                    Sur les 5 dernières années, {companyName} a augmenté ses dividendes à un taux annuel composé de{" "}
                    {dividendData.stats.fiveYearGrowth}%, ce qui est{" "}
                    {dividendData.stats.fiveYearGrowth > 6.0 ? "supérieur" : "inférieur"} à la moyenne du secteur de
                    6.0%. Cette tendance reflète{" "}
                    {dividendData.stats.fiveYearGrowth > 6.0
                      ? "la solidité financière de l'entreprise et son engagement envers la création de valeur pour les actionnaires."
                      : "une approche plus conservatrice dans la distribution des bénéfices, possiblement en faveur d'investissements dans la croissance."}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Perspectives futures</h3>
                  <p className="text-sm text-gray-600">
                    Compte tenu de la santé financière de l'entreprise et de son historique, les analystes s'attendent à
                    ce que {companyName}
                    {dividendData.stats.fiveYearGrowth > 5.0
                      ? " continue d'augmenter ses dividendes à un rythme similaire dans les années à venir."
                      : " maintienne une croissance modeste de ses dividendes, avec un potentiel d'accélération si les résultats s'améliorent."}
                    Le prochain dividende trimestriel est estimé à ${dividendData.upcomingDividends[0]?.dividend}, avec
                    une date ex-dividende prévue pour le{" "}
                    {new Date(dividendData.upcomingDividends[0]?.exDate).toLocaleDateString()}.
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

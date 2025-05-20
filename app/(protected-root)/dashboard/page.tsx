"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockPriceChart } from "@/components/stock-price-chart"
import { TechnicalIndicators } from "@/components/technical-indicators"
import { StatisticsCard } from "@/components/statistics-card"
import { ReturnsChart } from "@/components/returns-chart"
import { type StockData, getSimulatedDataForCompany } from "@/lib/data-utils"
import { useCompany } from "@/components/company-context-client"
import { CompanyFilter } from "@/components/company-filter"
import { IStat } from "@/app/api/statistic/route"

export default function DashboardPage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [statAnnual, setStatAnnual] = useState<IStat>()
  
  const { selectedCompany, companyMap, selectedYear } = useCompany()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Utiliser la fonction getSimulatedDataForCompany pour obtenir des données spécifiques à l'entreprise
        const data = getSimulatedDataForCompany(selectedCompany)
        setStockData(data)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        setStockData([]) // Assurer que stockData est au moins un tableau vide en cas d'erreur
      } finally {
        setLoading(false)
      }
    }
        async function getStatAnnual() {
      setLoading(true)
      try {
          const response = await fetch("/api/statistic",{
          method: 'POST',
          headers: { "Content-Type": "application/json"},
          body: JSON.stringify({
            company: selectedCompany,
            year: selectedYear
          })
        });

        const result = await response.json();
        if(result.error) {
          console.error("Erreur sur API:", result.error);
          return;
        }
        setStatAnnual(result.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }

    getStatAnnual()

    loadData()
  }, [selectedCompany])

  // Vérifier si les données sont disponibles avant de calculer les valeurs
  const latestPrice = stockData.length > 0 ? stockData[stockData.length - 1].close : 0
  const previousPrice = stockData.length > 1 ? stockData[stockData.length - 2].close : 0
  const priceChange = latestPrice - previousPrice
  const percentChange = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0
  
  const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
  }))
  const companyName = companyMap[selectedCompany] || selectedCompany

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Tableau de bord</h1>
        <div className="flex items-center gap-3">
          <CompanyFilter companies={companies}/>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-green-700 border-green-200"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-green-800 mb-2">Chargement des données...</p>
            <p className="text-sm text-gray-500">Veuillez patienter pendant que nous récupérons les informations.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatisticsCard
              data_annual={statAnnual!}
              title="Prix actuel"
              value={`$${latestPrice.toFixed(2)}`}
              change={`${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)} (${percentChange.toFixed(2)}%)`}
              isPositive={priceChange >= 0}
            />
            <StatisticsCard
              data_annual={statAnnual!}
              title="Volume"
              value={stockData.length > 0 ? `${(stockData[stockData.length - 1].volume / 1000000).toFixed(1)}M` : "N/A"}
              change="+5.2%"
              isPositive={true}
            />
            {statAnnual && (
              <StatisticsCard
                data_annual={statAnnual}
                title="Volatilité"
                value={`${((statAnnual.stdDev / latestPrice) * 100).toFixed(2)}%`}
                change="-0.5%"
                isPositive={false}
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="bg-white p-4 rounded-lg shadow border-green-200">
              <h2 className="text-lg font-semibold mb-4 text-green-800">Prix de l'action</h2>
              <CardContent className="p-0">
                <StockPriceChart data={stockData} />
              </CardContent>
            </Card>
            <Card className="bg-white p-4 rounded-lg shadow border-green-200">
              <h2 className="text-lg font-semibold mb-4 text-green-800">Rendements</h2>
              <CardContent className="p-0">
                <ReturnsChart data={stockData} />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="technical" className="mb-6">
            <TabsList className="mb-4 bg-green-50 border border-green-200">
              <TabsTrigger
                value="technical"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                Analyse technique
              </TabsTrigger>
              <TabsTrigger
                value="statistics"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                Statistiques
              </TabsTrigger>
            </TabsList>
            <TabsContent value="technical">
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <TechnicalIndicators data={stockData} height={400} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="statistics">
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <StatisticsCard
                    data_annual={statAnnual!}
                    title="Statistiques détaillées"
                    description="Analyse statistique complète"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white p-4 rounded-lg shadow border-green-200">
              <h2 className="text-lg font-semibold mb-4 text-green-800">Résumé de l'entreprise</h2>
              <CardContent className="p-0">
                <p className="text-sm text-gray-600 mb-4">
                  {companyName} est une société cotée en bourse qui opère dans le secteur de la restauration rapide.
                  {selectedCompany === "MCD" &&
                    " McDonald's est la plus grande chaîne de restauration rapide au monde, connue pour ses hamburgers, ses frites et son service rapide."}
                  {selectedCompany === "YUM" &&
                    " Yum! Brands est la société mère de KFC, Pizza Hut et Taco Bell, trois des plus grandes chaînes de restauration rapide au monde."}
                  {selectedCompany === "WEN" &&
                    " Wendy's est connue pour ses hamburgers carrés et son menu de qualité supérieure dans le segment de la restauration rapide."}
                  {selectedCompany === "PZZA" &&
                    " Papa John's est une chaîne de pizzerias qui met l'accent sur des ingrédients de qualité supérieure."}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">Secteur</p>
                    <p className="text-sm text-gray-600">Restauration rapide</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">PDG</p>
                    <p className="text-sm text-gray-600">
                      {selectedCompany === "MCD" && "Chris Kempczinski"}
                      {selectedCompany === "YUM" && "David Gibbs"}
                      {selectedCompany === "WEN" && "Todd Penegor"}
                      {selectedCompany === "PZZA" && "Rob Lynch"}
                      {!["MCD", "YUM", "WEN", "PZZA"].includes(selectedCompany) && "Non disponible"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white p-4 rounded-lg shadow border-green-200">
              <h2 className="text-lg font-semibold mb-4 text-green-800">Événements récents</h2>
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">Rapport trimestriel</p>
                    <p className="text-sm text-gray-600">
                      {companyName} a publié ses résultats du dernier trimestre, dépassant les attentes des analystes
                      avec une augmentation de 20% du bénéfice d'exploitation.
                    </p>
                    <p className="text-xs text-gray-500">Il y a 2 semaines</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Expansion internationale</p>
                    <p className="text-sm text-gray-600">
                      La société a annoncé l'ouverture de 50 nouveaux restaurants en Asie du Sud-Est au cours des 12
                      prochains mois.
                    </p>
                    <p className="text-xs text-gray-500">Il y a 1 mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function calculateStatistics(data: StockData[]) {
  if (!data || data.length === 0) {
    return { stdDev: 0 }
  }

  const prices = data.map((d) => d.close)
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const squaredDiffs = prices.map((price) => Math.pow(price - mean, 2))
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length

  return { stdDev: Math.sqrt(variance) }
}

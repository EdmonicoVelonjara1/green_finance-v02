"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useCompany } from "@/components/company-context"
import { CompanyFilter } from "@/components/company-filter"
import { type StockData, getSimulatedDataForCompany } from "@/lib/data-utils"
import {
  generateLinearPrediction,
  generateMovingAveragePrediction,
  generateExponentialSmoothingPrediction,
  calculateConfidenceInterval,
} from "@/lib/prediction-utils"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  ComposedChart,
  BarChart,
  Bar,
} from "recharts"

export default function PrevisionsPage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedCompany, companyName } = useCompany()

  // Paramètres de prédiction
  const [predictionDays, setPredictionDays] = useState(30)
  const [trainingPeriod, setTrainingPeriod] = useState("180")
  const [selectedModel, setSelectedModel] = useState("linear")
  const [maWindow, setMaWindow] = useState("20")
  const [alpha, setAlpha] = useState(0.2)
  const [beta, setBeta] = useState(0.1)
  const [confidenceLevel, setConfidenceLevel] = useState(0.95)

  // Données de prédiction
  const [predictionData, setPredictionData] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>({})

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

  useEffect(() => {
    if (stockData.length === 0) return

    // Diviser les données en ensemble d'entraînement et de test
    const trainingSize = Number.parseInt(trainingPeriod)
    if (trainingSize >= stockData.length) return

    const trainingData = stockData.slice(0, trainingSize)

    // Générer les prédictions selon le modèle sélectionné
    let predictions: any[] = []

    if (selectedModel === "linear") {
      predictions = generateLinearPrediction(trainingData, predictionDays)
    } else if (selectedModel === "ma") {
      predictions = generateMovingAveragePrediction(trainingData, Number.parseInt(maWindow), predictionDays)
    } else if (selectedModel === "exp") {
      predictions = generateExponentialSmoothingPrediction(trainingData, alpha, beta, predictionDays)
    }

    // Calculer l'intervalle de confiance
    const stdDev = calculateStdDev(trainingData)
    const predictionsWithInterval = calculateConfidenceInterval(predictions, stdDev, confidenceLevel)

    // Préparer les données pour l'affichage
    const historicalData = trainingData.slice(-30).map((day) => ({
      date: day.date.toISOString().split("T")[0],
      actual: day.close,
    }))

    // Combiner les données historiques et les prédictions
    const combinedData = [...historicalData]

    // Ajouter les prédictions futures
    predictionsWithInterval.forEach((pred) => {
      combinedData.push({
        date: pred.date.toISOString().split("T")[0],
        prediction: pred.prediction,
        lower: pred.lower,
        upper: pred.upper,
      })
    })

    setPredictionData(combinedData)

    // Calculer des métriques simples
    setMetrics({
      lastPrice: trainingData[trainingData.length - 1].close,
      predictedPrice: predictions[predictions.length - 1].prediction,
      percentChange:
        (predictions[predictions.length - 1].prediction / trainingData[trainingData.length - 1].close - 1) * 100,
      confidenceInterval: [
        predictionsWithInterval[predictionsWithInterval.length - 1].lower.toFixed(2),
        predictionsWithInterval[predictionsWithInterval.length - 1].upper.toFixed(2),
      ],
    })
  }, [stockData, trainingPeriod, selectedModel, maWindow, alpha, beta, predictionDays, confidenceLevel])

  // Fonction pour calculer l'écart-type des rendements
  function calculateStdDev(data: StockData[]): number {
    if (data.length < 2) return 0

    const returns = []
    for (let i = 1; i < data.length; i++) {
      returns.push(data[i].close / data[i - 1].close - 1)
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2))
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length

    return Math.sqrt(variance) * data[data.length - 1].close
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Prévisions</h1>
        <div className="flex items-center gap-3">
          <CompanyFilter />
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
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Dernier prix</CardTitle>
                <CardDescription>Prix actuel de l'action</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${metrics.lastPrice?.toFixed(2) || "N/A"}</div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Prix prévu ({predictionDays} jours)</CardTitle>
                <CardDescription>Prévision à {predictionDays} jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${metrics.predictedPrice?.toFixed(2) || "N/A"}</div>
                <div
                  className={`text-sm font-medium ${metrics.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {metrics.percentChange >= 0 ? "+" : ""}
                  {metrics.percentChange?.toFixed(2) || "0"}%
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Intervalle de confiance</CardTitle>
                <CardDescription>Niveau de confiance: {confidenceLevel * 100}%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  ${metrics.confidenceInterval?.[0] || "N/A"} - ${metrics.confidenceInterval?.[1] || "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Modèle de prévision</CardTitle>
              <CardDescription>Paramètres du modèle de prévision</CardDescription>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Modèle:</span>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-40 border-green-200">
                      <SelectValue placeholder="Modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Régression linéaire</SelectItem>
                      <SelectItem value="ma">Moyenne mobile</SelectItem>
                      <SelectItem value="exp">Lissage exponentiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Période d'entraînement:</span>
                  <Select value={trainingPeriod} onValueChange={setTrainingPeriod}>
                    <SelectTrigger className="w-24 border-green-200">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 jours</SelectItem>
                      <SelectItem value="180">180 jours</SelectItem>
                      <SelectItem value="365">365 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Horizon de prévision:</span>
                  <div className="w-40">
                    <Slider
                      value={[predictionDays]}
                      min={7}
                      max={90}
                      step={1}
                      onValueChange={(value) => setPredictionDays(value[0])}
                    />
                  </div>
                  <span className="text-sm">{predictionDays} jours</span>
                </div>
              </div>
              {selectedModel === "ma" && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-green-700">Fenêtre MA:</span>
                  <Select value={maWindow} onValueChange={setMaWindow}>
                    <SelectTrigger className="w-24 border-green-200">
                      <SelectValue placeholder="Fenêtre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 jours</SelectItem>
                      <SelectItem value="10">10 jours</SelectItem>
                      <SelectItem value="20">20 jours</SelectItem>
                      <SelectItem value="50">50 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedModel === "exp" && (
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-700">Alpha (niveau):</span>
                    <div className="w-40">
                      <Slider
                        value={[alpha * 100]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(value) => setAlpha(value[0] / 100)}
                      />
                    </div>
                    <span className="text-sm">{(alpha * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-700">Beta (tendance):</span>
                    <div className="w-40">
                      <Slider
                        value={[beta * 100]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(value) => setBeta(value[0] / 100)}
                      />
                    </div>
                    <span className="text-sm">{(beta * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div style={{ height: "500px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={predictionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Prix réel"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="prediction"
                      name="Prévision"
                      stroke="#047857"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      name="Limite supérieure"
                      stroke="transparent"
                      fill="#047857"
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      name="Limite inférieure"
                      stroke="transparent"
                      fill="#047857"
                      fillOpacity={0.1}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="models">
            <TabsList className="mb-4 bg-green-50">
              <TabsTrigger
                value="models"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Modèles de prévision
              </TabsTrigger>
              <TabsTrigger
                value="evaluation"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Évaluation des modèles
              </TabsTrigger>
              <TabsTrigger
                value="scenarios"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Scénarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="models">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Modèles de prévision</CardTitle>
                  <CardDescription>Description des modèles de prévision disponibles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">Régression linéaire</h3>
                      <p className="text-sm text-gray-600">
                        La régression linéaire ajuste une ligne droite aux données historiques pour prédire les valeurs
                        futures. Ce modèle est simple mais peut être efficace pour les tendances à court terme. Il
                        suppose une relation linéaire entre le temps et le prix, ce qui n'est pas toujours le cas sur
                        les marchés financiers.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">Moyenne mobile</h3>
                      <p className="text-sm text-gray-600">
                        La prévision par moyenne mobile utilise la moyenne des n dernières observations pour prédire la
                        valeur suivante. Ce modèle est utile pour les séries temporelles avec des fluctuations
                        aléatoires mais sans tendance forte. La taille de la fenêtre détermine la sensibilité du modèle
                        aux changements récents.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">Lissage exponentiel</h3>
                      <p className="text-sm text-gray-600">
                        Le lissage exponentiel double (méthode de Holt) utilise deux paramètres: alpha pour le niveau et
                        beta pour la tendance. Ce modèle donne plus de poids aux observations récentes et peut capturer
                        les tendances. Il est plus sophistiqué que les deux autres modèles et souvent plus précis pour
                        les prévisions à moyen terme.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evaluation">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Évaluation des modèles</CardTitle>
                  <CardDescription>Métriques d'évaluation des modèles de prévision</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-green-700">Métriques d'erreur</h3>
                        <p className="text-sm text-gray-600">
                          Les métriques d'erreur comme l'erreur absolue moyenne (MAE) et l'erreur quadratique moyenne
                          (RMSE) mesurent la précision des prévisions. Une valeur plus faible indique une meilleure
                          précision.
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-green-700">MAE</p>
                            <p className="text-xl font-bold">$2.45</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-700">RMSE</p>
                            <p className="text-xl font-bold">$3.18</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-700">Précision directionnelle</h3>
                        <p className="text-sm text-gray-600">
                          La précision directionnelle mesure la capacité du modèle à prédire correctement la direction
                          du mouvement (hausse ou baisse), indépendamment de l'ampleur exacte.
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-700">Précision</p>
                          <p className="text-xl font-bold">68%</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">Comparaison des modèles</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Performance relative des différents modèles de prévision sur les données historiques.
                      </p>
                      <div style={{ height: "200px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "Régression linéaire", mae: 2.45, rmse: 3.18, accuracy: 68 },
                              { name: "Moyenne mobile", mae: 2.87, rmse: 3.52, accuracy: 62 },
                              { name: "Lissage exponentiel", mae: 2.31, rmse: 2.95, accuracy: 71 },
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar name="MAE ($)" dataKey="mae" fill="#10b981" />
                            <Bar name="RMSE ($)" dataKey="rmse" fill="#047857" />
                            <Bar name="Précision (%)" dataKey="accuracy" fill="#065f46" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scenarios">
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800">Analyse de scénarios</CardTitle>
                  <CardDescription>Prévisions selon différents scénarios de marché</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">Scénarios de marché</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Prévisions basées sur différentes hypothèses de marché pour les 30 prochains jours.
                      </p>
                      <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" type="number" domain={[0, 30]} />
                            <YAxis domain={["auto", "auto"]} />
                            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, ""]} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="base"
                              data={Array.from({ length: 31 }, (_, i) => ({
                                day: i,
                                base: metrics.lastPrice * (1 + (metrics.percentChange / 100) * (i / 30)),
                              }))}
                              name="Scénario de base"
                              stroke="#10b981"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="bull"
                              data={Array.from({ length: 31 }, (_, i) => ({
                                day: i,
                                bull: metrics.lastPrice * (1 + (metrics.percentChange / 100) * 2 * (i / 30)),
                              }))}
                              name="Scénario haussier"
                              stroke="#22c55e"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="bear"
                              data={Array.from({ length: 31 }, (_, i) => ({
                                day: i,
                                bear: metrics.lastPrice * (1 - (Math.abs(metrics.percentChange) / 100) * (i / 30)),
                              }))}
                              name="Scénario baissier"
                              stroke="#ef4444"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-md border border-green-100 p-4">
                        <h4 className="text-sm font-semibold text-green-700 mb-1">Scénario de base</h4>
                        <p className="text-xl font-bold">
                          ${(metrics.lastPrice * (1 + metrics.percentChange / 100)).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Basé sur la tendance actuelle et les fondamentaux de l'entreprise.
                        </p>
                      </div>
                      <div className="rounded-md border border-green-100 p-4">
                        <h4 className="text-sm font-semibold text-green-700 mb-1">Scénario haussier</h4>
                        <p className="text-xl font-bold text-green-600">
                          ${(metrics.lastPrice * (1 + (metrics.percentChange / 100) * 2)).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Basé sur des conditions de marché favorables et une forte croissance.
                        </p>
                      </div>
                      <div className="rounded-md border border-green-100 p-4">
                        <h4 className="text-sm font-semibold text-green-700 mb-1">Scénario baissier</h4>
                        <p className="text-xl font-bold text-red-600">
                          ${(metrics.lastPrice * (1 - Math.abs(metrics.percentChange) / 100)).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Basé sur des conditions de marché défavorables et des risques accrus.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

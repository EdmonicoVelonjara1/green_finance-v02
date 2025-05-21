"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Area, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useCompany } from "@/components/company-context-client"
import { type StockData, getSimulatedDataForCompany, calculateRSI } from "@/lib/data-utils"
import { CompanyFilter } from "@/components/company-filter"
import { IDailyReturn, IDrawdown, IStat } from "@/app/api/statistic/route"
import { IRsiSignal } from "@/app/api/indicator-rsi/[tickerName]/[period]/route"


export default function OscillateursPage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [rsiPeriod, setRsiPeriod] = useState("14")
  const [rsiOverbought, setRsiOverbought] = useState("70")
  const [rsiOversold, setRsiOversold] = useState("30")
  const [rsiData, setRsiData] = useState<any[]>([])

  const [statAnnual, setStatAnnual] = useState<IStat>()
  const [yieldDaily, setYieldDaily] = useState<IDailyReturn[]>([])
  const [cumReturn, setCumReturn] = useState<IDailyReturn[]>([])
  const [dailyDrawdown, setDailyDrawdown] = useState<IDrawdown[]>([])
  
  const [isSignal, setIsSignal] = useState(false)
  const [rsiSignals, setRsiSignal] = useState<IRsiSignal[]>([])

  const { selectedCompany, companyMap, selectedYear } = useCompany() // Moved hook outside useEffect

  useEffect(() => {
    // async function loadData() {
    //   setLoading(true)
    //   try {
    //       const response = await fetch("/api/donnees-historiques",{
    //       method: 'POST',
    //       headers: { "Content-Type": "application/json"},
    //       body: JSON.stringify({
    //         company: selectedCompany,
    //         year: selectedYear
    //       })
    //     });

    //     const result = await response.json();
    //     if(result.error) {
    //       console.error("Erreur sur API:", result.error);
    //       return;
    //     }
    //     setStockData(result.data);
    //   } catch (error) {
    //     console.error("Erreur lors du chargement des données:", error)
    //   } finally {
    //     setLoading(false)
    //   }
    // }

    const loadRsiData = async () => {
      if (!selectedCompany || !rsiPeriod) return;

      setLoading(true);

      try {
        const response = await fetch(`/api/indicator-rsi/${selectedCompany}/${rsiPeriod}`);
        const result = await response.json();

        if(result.error || !result.length) {
          console.warn("Erreur", result.error)
          return ;
        }

        const formatted = result.map((row: any) => ({
          date: row.date,
          rsi: row.rsi,
        }));

        setRsiData(formatted); // Affiché dans Recharts
      } catch (error) {
        console.error("Erreur RSI:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRsiData()
    // loadData()
  }, [selectedCompany, selectedYear, rsiPeriod])


  // Calculer le RSI
  // const rsiData = stockData.length > 0 ? calculateRSI(stockData, Number.parseInt(rsiPeriod)) : []

  // Préparer les données pour le graphique
  const priceChartData = stockData.map((day, index) => {
    return {
      date: new Date(day.date).toISOString().split("T")[0],
      price: day.close,
    }
  })

  const rsiChartData = rsiData.map((day) => {
    return {
      date: new Date(day.date).toISOString().split("T")[0],
      rsi: day.rsi,
      overbought: Number.parseInt(rsiOverbought),
      oversold: Number.parseInt(rsiOversold),
      neutral: 50,
    }
  })

  // Identifier les signaux RSI
//   const rsiSignals = []
//   for (let i = 1; i < rsiChartData.length; i++) {
//     const prev = rsiChartData[i - 1]
//     const curr = rsiChartData[i]

//     // Signal de survente: RSI passe sous le niveau de survente
// // ...dans la boucle for (let i = 1; i < rsiChartData.length; i++) {
//     if (
//       i > 10 &&
//       curr.rsi !== null &&
//       rsiChartData[i - 10] !== undefined &&
//       rsiChartData[i - 10] !== null &&
//       rsiChartData[i - 10].rsi !== null &&
//       stockData[i] !== undefined &&
//       stockData[i - 10] !== undefined &&
//       typeof stockData[i]?.close === "number" &&
//       typeof stockData[i - 10]?.close === "number" &&
//       typeof curr.rsi === "number" &&
//       typeof rsiChartData[i - 10]?.rsi === "number" &&
//       rsiChartData[i - 10]?.rsi !== null &&
//       stockData[i].close < stockData[i - 10].close &&
//       curr.rsi > (rsiChartData[i - 10]?.rsi as number)
//     ) {
//       rsiSignals.push({
//         date: new Date(curr.date).toLocaleDateString(),
//         type: "Divergence haussière",
//         description: `Le prix fait un nouveau plus bas mais le RSI fait un plus bas plus haut`,
//         signal: "Achat potentiel",
//       })
//     }

//     // Signal de surachat: RSI passe au-dessus du niveau de surachat
//     if (
//       prev.rsi !== null &&
//       curr.rsi !== null &&
//       prev.rsi < Number.parseInt(rsiOverbought) &&
//       curr.rsi >= Number.parseInt(rsiOverbought)
//     ) {
//       rsiSignals.push({
//         date: new Date(curr.date).toLocaleDateString(),
//         type: "Surachat",
//         description: `RSI est passé au-dessus du niveau de surachat (${rsiOverbought})`,
//         signal: "Vente potentielle",
//       })
//     }

//     // Signal de sortie de survente: RSI remonte au-dessus du niveau de survente
//     if (
//       prev.rsi !== null &&
//       curr.rsi !== null &&
//       prev.rsi <= Number.parseInt(rsiOversold) &&
//       curr.rsi > Number.parseInt(rsiOversold)
//     ) {
//       rsiSignals.push({
//         date: new Date(curr.date).toLocaleDateString(),
//         type: "Sortie de survente",
//         description: `RSI est remonté au-dessus du niveau de survente (${rsiOversold})`,
//         signal: "Confirmation d'achat",
//       })
//     }

//     // Signal de sortie de surachat: RSI redescend sous le niveau de surachat
//     if (
//       prev.rsi !== null &&
//       curr.rsi !== null &&
//       prev.rsi >= Number.parseInt(rsiOverbought) &&
//       curr.rsi < Number.parseInt(rsiOverbought)
//     ) {
//       rsiSignals.push({
//         date: new Date(curr.date).toLocaleDateString(),
//         type: "Sortie de surachat",
//         description: `RSI est redescendu sous le niveau de surachat (${rsiOverbought})`,
//         signal: "Confirmation de vente",
//       })
//     }

//     // Divergence haussière: prix fait un nouveau plus bas mais RSI fait un plus bas plus haut
//     if (
//       i > 10 &&
//       curr.rsi !== null &&
//       rsiChartData[i - 10] !== undefined &&
//       rsiChartData[i - 10] !== null &&
//       rsiChartData[i - 10].rsi !== null &&
//       stockData[i] !== undefined &&
//       stockData[i - 10] !== undefined &&
//       typeof curr.rsi === "number" &&
//       typeof rsiChartData[i - 10]?.rsi === "number" &&
//       rsiChartData[i - 10]?.rsi !== null &&
//       stockData[i].close < stockData[i - 10].close &&
//       curr.rsi > (rsiChartData[i - 10]?.rsi as number)
//     ) {
//       rsiSignals.push({
//         date: new Date(curr.date).toLocaleDateString(),
//         type: "Divergence haussière",
//         description: `Le prix fait un nouveau plus bas mais le RSI fait un plus bas plus haut`,
//         signal: "Achat potentiel",
//       })
//     }
//   }

  // Limiter aux 5 signaux les plus récents
  const recentRsiSignals = rsiSignals.slice(-5).reverse()
  const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
  }))
  // const companyName = companyMap[selectedCompany] || selectedCompany
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Oscillateurs</h1>
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
              <CardTitle className="text-green-800">RSI (Relative Strength Index)</CardTitle>
              <CardDescription>Indice de force relative pour identifier les conditions de marché</CardDescription>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Période:</span>
                  <Select value={rsiPeriod} onValueChange={setRsiPeriod}>
                    <SelectTrigger className="w-20 border-green-200">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="21">21</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Surachat:</span>
                  <Select value={rsiOverbought} onValueChange={setRsiOverbought}>
                    <SelectTrigger className="w-20 border-green-200">
                      <SelectValue placeholder="Surachat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="70">70</SelectItem>
                      <SelectItem value="75">75</SelectItem>
                      <SelectItem value="80">80</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Survente:</span>
                  <Select value={rsiOversold} onValueChange={setRsiOversold}>
                    <SelectTrigger className="w-20 border-green-200">
                      <SelectValue placeholder="Survente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="combined">
                <TabsList className="mb-4 bg-green-50">
                  <TabsTrigger
                    value="combined"
                    className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                  >
                    Prix et RSI
                  </TabsTrigger>
                  <TabsTrigger
                    value="rsi"
                    className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                  >
                    RSI Détaillé
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="combined">
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                          formatter={(value: number) => [`$${value.toLocaleString()}`, "Prix"]}
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
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ height: "200px", marginTop: "20px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rsiChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                          formatter={(value: number) => [value?.toFixed(2), ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="rsi" name="RSI" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line
                          type="monotone"
                          dataKey="overbought"
                          name="Surachat"
                          stroke="#ef4444"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="oversold"
                          name="Survente"
                          stroke="#22c55e"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="rsi">
                  <div style={{ height: "500px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rsiChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                          formatter={(value: number) => [value?.toFixed(2), ""]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="rsi"
                          name="RSI"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="overbought"
                          name="Surachat"
                          stroke="#ef4444"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="oversold"
                          name="Survente"
                          stroke="#22c55e"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="neutral"
                          name="Niveau neutre"
                          stroke="#9ca3af"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Signaux RSI</CardTitle>
              <CardDescription>Signaux de trading basés sur le RSI</CardDescription>
            </CardHeader>
            <CardContent>
              {recentRsiSignals.length > 0 ? (
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
                      {recentRsiSignals.map((signal, index) => (
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
                <p className="text-gray-500">Aucun signal RSI significatif détecté récemment.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">Interprétation du RSI</CardTitle>
              <CardDescription>Guide d'utilisation du RSI pour l'analyse technique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Qu'est-ce que le RSI?</h3>
                  <p className="text-sm text-gray-600">
                    Le RSI (Relative Strength Index) est un oscillateur de momentum développé par J. Welles Wilder qui
                    mesure la vitesse et le changement des mouvements de prix. Le RSI oscille entre 0 et 100 et est
                    traditionnellement utilisé pour identifier les conditions de surachat ou de survente dans un marché.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Interprétation du RSI</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Surachat et survente:</strong> Traditionnellement, un RSI au-dessus de 70 indique des
                    conditions de surachat, tandis qu'un RSI en dessous de 30 indique des conditions de survente. Ces
                    niveaux peuvent être ajustés en fonction de la volatilité du marché.
                    <br />
                    <strong>Divergences:</strong> Une divergence se produit lorsque le prix et le RSI se déplacent dans
                    des directions opposées, ce qui peut signaler un renversement potentiel de tendance.
                    <br />
                    <strong>Niveau médian:</strong> Le niveau 50 du RSI est souvent considéré comme un niveau pivot.
                    Dans les marchés haussiers, le RSI tend à rester entre 40 et 90, avec le niveau 40-50 agissant comme
                    support. Dans les marchés baissiers, le RSI tend à rester entre 10 et 60, avec le niveau 50-60
                    agissant comme résistance.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Signaux de Trading</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Conditions de surachat/survente:</strong> Un RSI au-dessus de 70 peut indiquer qu'un titre
                    est suracheté et pourrait être prêt pour une correction. Un RSI en dessous de 30 peut indiquer qu'un
                    titre est survendu et pourrait être prêt pour un rebond.
                    <br />
                    <strong>Divergences:</strong> Une divergence haussière se produit lorsque le prix fait un nouveau
                    plus bas mais que le RSI fait un plus bas plus haut, suggérant une pression d'achat croissante. Une
                    divergence baissière se produit lorsque le prix fait un nouveau plus haut mais que le RSI fait un
                    plus haut plus bas, suggérant une pression de vente croissante.
                    <br />
                    <strong>Échecs de swing:</strong> Un échec de swing se produit lorsque le RSI dépasse 70, redescend
                    en dessous, puis remonte mais échoue à dépasser 70 à nouveau, ce qui peut indiquer une faiblesse du
                    marché.
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

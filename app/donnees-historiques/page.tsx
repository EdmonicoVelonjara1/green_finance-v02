"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCompany } from "@/components/company-context-client"
import { type StockData, getSimulatedDataForCompany } from "@/lib/data-utils"
import { CompanyFilter } from "@/components/company-filter"

export default function DonneesHistoriquesPage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [filteredData, setFilteredData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { selectedCompany, companyMap } = useCompany() // Call the hook unconditionally

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Utiliser la fonction getSimulatedDataForCompany pour obtenir des données spécifiques à l'entreprise
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
    if (searchTerm) {
      const filtered = stockData.filter(
        (day) =>
          day.date.toISOString().includes(searchTerm) ||
          day.close.toString().includes(searchTerm) ||
          day.volume.toString().includes(searchTerm),
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(stockData)
    }
  }, [searchTerm, stockData])

    const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
    }))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">Données historiques</h1>
        <div className="flex items-center gap-3">
          <CompanyFilter companies={companies} />
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-green-700 border-green-200">
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Contenu de la page */}
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Chargement des données...</div>
            <div className="text-muted-foreground">
              Veuillez patienter pendant que nous récupérons les données boursières.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-green-800">Données historiques</h2>
            <p className="text-gray-600">
              Cette page présente l'historique des prix et des volumes pour l'action sélectionnée.
            </p>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Données Historiques - BRK-A</h1>
            <p className="text-muted-foreground">
              Consultez l'historique complet des prix et volumes pour Berkshire Hathaway
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Historique des prix</CardTitle>
              <CardDescription>Données historiques de prix et volumes pour BRK-A</CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par date, prix ou volume..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Ouverture</TableHead>
                      <TableHead className="text-right">Plus haut</TableHead>
                      <TableHead className="text-right">Plus bas</TableHead>
                      <TableHead className="text-right">Clôture</TableHead>
                      <TableHead className="text-right">Clôture ajustée</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.slice(0, 100).map((day) => (
                      <TableRow key={day.date.toISOString()}>
                        <TableCell>{day.date.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">${day.open.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${day.high.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${day.low.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${day.close.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${day.adjClose.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{day.volume.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Affichage des 100 premiers résultats sur {filteredData.length} au total
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

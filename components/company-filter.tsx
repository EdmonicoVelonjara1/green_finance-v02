"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCompany } from "@/components/company-context-client"
import { useEffect, useState } from "react"

interface Company {
  value: string
  label: string
}

interface CompanyFilterProps {
  companies: Company[]
}

export function CompanyFilter({ companies }: CompanyFilterProps) {
  // const [years, setYears] = useState<number[]>([])
  // const [selectedYear, setSelectedYear] = useState<number>(2024)
  const { selectedCompany, setSelectedCompany, years, selectedYear, setSelectedYear } = useCompany()

  // useEffect(() => {
  //   async function fetchYear() {
  //     try {
  //       const response = await fetch("/api/get-year", {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           company: selectedCompany
  //         })
  //       })

  //       if (!response.ok) {
  //         console.error("Erreur lors de la récupération des années")
  //         return
  //       }

  //       const result = await response.json()
  //       console.log("ANNEE",JSON.stringify(result.data))
  //       setYears(result.data || [])
  //       if (result.data?.length > 0) {
  //         setSelectedYear(result.data[0]) // Sélection par défaut
  //       }

  //     } catch (err) {
  //       console.error("Erreur de requête :", err)
  //     }
  //   }

  //   if (selectedCompany) {
  //     fetchYear()
  //   }
  // }, [selectedCompany])

  return (
    <div className="flex gap-4 items-center">
      {/* Select Company */}
      <Select value={selectedCompany} onValueChange={setSelectedCompany}>
        <SelectTrigger className="w-40 text-xs h-8 border-green-200 bg-white">
          <SelectValue placeholder="Sélectionner une entreprise" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company: Company) => (
            <SelectItem key={company.value} value={company.value} className="text-xs">
              {company.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Select Year */}
      <Select value={selectedYear?.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
        <SelectTrigger className="w-32 text-xs h-8 border-blue-200 bg-white">
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()} className="text-xs">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

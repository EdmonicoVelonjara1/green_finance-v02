"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCompany } from "@/components/company-context-client"
import { useEffect, useState } from "react"
import { error } from "console"

interface Company {
  value: string
  label: string
}

interface CompanyFilterProps {
  companies: Company[]
}

export function CompanyFilter({ companies }: CompanyFilterProps) {
  const [years, setYears] = useState<Number[]>([])
  const [selectedYears, setSelectedYears] = useState<number>(2024)
  const { selectedCompany, setSelectedCompany } = useCompany()

  useEffect(  ()=>{
    async function fetchYear() {
      const response = await fetch("/api/get-year",{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: selectedCompany
        })
      })
      if(!response) {
        console.error("Erreur",error)
        return;
      }
    }
  });

  return (
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
  )
}

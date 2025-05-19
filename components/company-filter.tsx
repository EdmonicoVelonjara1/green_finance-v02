"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCompany } from "@/components/company-context-client"

interface Company {
  value: string
  label: string
}

interface CompanyFilterProps {
  companies: Company[]
}

export function CompanyFilter({ companies }: CompanyFilterProps) {
  const { selectedCompany, setSelectedCompany } = useCompany()

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

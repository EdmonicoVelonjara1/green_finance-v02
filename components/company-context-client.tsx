"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CompanyContextType = {
  companyMap: Record<string, string>;
  selectedCompany: string;
  years: number[];
  selectedYear: number;
  setSelectedYear: (c: number) => void,
  setSelectedCompany: (c: string) => void;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProviderClient({
  children,
  companyMap,
  selectedCompany = "MCD",
}: {
  children: ReactNode;
  companyMap: Record<string, string>;
  selectedCompany?: string;
}) {
  // Hydrate la valeur initiale pour éviter le mismatch
  const [selected, setSelected] = useState(selectedCompany);
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2024)

  // useEffect(() => {
  //   setSelected(selectedCompany);
  // }, [selectedCompany]);
  useEffect(() => {
    setSelected(selectedCompany);

    async function fetchYear() {
      try {
        const response = await fetch("/api/get-year", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company: selectedCompany
          })
        })

        if (!response.ok) {
          console.error("Erreur lors de la récupération des années")
          return
        }

        const result = await response.json()
        console.log("ANNEE",JSON.stringify(result.data))
        setYears(result.data || [])
        if (result.data?.length > 0) {
          setSelectedYear(result.data[0]) // Sélection par défaut
        }

      } catch (err) {
        console.error("Erreur de requête :", err)
      }
    }

    if (selectedCompany) {
      fetchYear()
    }
  }, [selectedCompany])

  return (
    <CompanyContext.Provider value={
      { companyMap, 
        selectedCompany: selected, 
        years,
        selectedYear: selectedYear,
        setSelectedYear: setSelectedYear,
        setSelectedCompany: setSelected 
      }
    }>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within a CompanyProviderClient");
  return ctx;
}
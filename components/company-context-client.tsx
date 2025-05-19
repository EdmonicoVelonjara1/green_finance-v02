"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CompanyContextType = {
  companyMap: Record<string, string>;
  selectedCompany: string;
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

  useEffect(() => {
    setSelected(selectedCompany);
  }, [selectedCompany]);

  return (
    <CompanyContext.Provider value={{ companyMap, selectedCompany: selected, setSelectedCompany: setSelected }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within a CompanyProviderClient");
  return ctx;
}
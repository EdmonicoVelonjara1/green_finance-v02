import { ReactNode } from "react";
import { CompanyProviderClient } from "./company-context-client";

type Props = {
  children: ReactNode;
  companyMap: Record<string, string>;
  selectedCompany?: string;
};

export function CompanyProvider({
  children,
  companyMap,
  selectedCompany = "MCD",
}: Props) {
  return (
    <CompanyProviderClient companyMap={companyMap} selectedCompany={selectedCompany}>
      {children}
    </CompanyProviderClient>
  );
}
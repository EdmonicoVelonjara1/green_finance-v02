import type React from "react";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { CompanyProvider } from "@/components/company-context";
import { SidebarProvider } from "@/components/sidebar-context";
import { getTickers } from '@/services/tickerService';

export const metadata = {
  title: "Green Finance - Analyse financière",
  description: "Plateforme d'analyse financière pour les investisseurs",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companyMap = await getTickers();
  const companies = Object.entries(companyMap).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
  }))
  return (
    <html 
      lang="fr" 
      className="light"
      style={{ colorScheme: "light" }}
    >
      <body className="bg-gray-50">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <CompanyProvider companyMap={companyMap}>
            <SidebarProvider>
              <div className="flex h-screen">
                <Sidebar companies={companies}/>
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
            </SidebarProvider>
          </CompanyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
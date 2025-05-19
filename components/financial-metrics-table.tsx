"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Données simulées pour les métriques financières
const financialMetrics = [
  {
    metric: "P/E Ratio",
    MCD: 25.4,
    YUM: 28.7,
    WEN: 19.2,
    PZZA: 22.8,
  },
  {
    metric: "Dividend Yield",
    MCD: "2.3%",
    YUM: "1.8%",
    WEN: "4.2%",
    PZZA: "2.1%",
  },
  {
    metric: "Revenue Growth (YoY)",
    MCD: "5.2%",
    YUM: "3.7%",
    WEN: "-1.2%",
    PZZA: "0.8%",
  },
  {
    metric: "Profit Margin",
    MCD: "32.8%",
    YUM: "24.5%",
    WEN: "18.3%",
    PZZA: "15.7%",
  },
  {
    metric: "Debt to Equity",
    MCD: 0.87,
    YUM: 1.23,
    WEN: 1.56,
    PZZA: 1.12,
  },
]

export function FinancialMetricsTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Métrique</TableHead>
            <TableHead>MCD</TableHead>
            <TableHead>YUM</TableHead>
            <TableHead>WEN</TableHead>
            <TableHead>PZZA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {financialMetrics.map((row) => (
            <TableRow key={row.metric}>
              <TableCell className="font-medium">{row.metric}</TableCell>
              <TableCell>{row.MCD}</TableCell>
              <TableCell>{row.YUM}</TableCell>
              <TableCell>{row.WEN}</TableCell>
              <TableCell>{row.PZZA}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// services/tickerService.ts
import {db} from "@/lib/db";

export async function getTickers(): Promise<Record<string, string>> {
  const [rows] = await db.execute("SELECT name, full_name FROM ticker");
  const companyMap: Record<string, string> = {};
  (rows as { name: string; full_name: string }[]).forEach(row => {
    companyMap[row.name] = row.full_name;
  });
  return companyMap;
}
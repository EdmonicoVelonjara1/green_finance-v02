import { db } from "@/lib/db";

export async function getStockDataByTicker(tickerName: string) {
  const rows = await db.query(
    `SELECT date, open, high, low, close, adj_close, volume
     FROM stock_market_data
     WHERE id_ticker IN (SELECT id FROM ticker WHERE name = ?)
     ORDER BY date ASC;`,
    [tickerName]
  );
  // Transforme chaque ligne en objet simple et convertit la date en string ISO
  const data = rows.map((row: any) => ({
    date: row.date,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    adj_close: row.adj_close,
    volume: row.volume,
  }));

  console.log("DATA", JSON.stringify(data));
  
  return data;
}

export async function getYears(tickerName: string) {
  const rows = await db.query(
    "SELECT YEAR(date) FROM stock_market_data WHERE id_ticker IN (SELECT id FROM ticker WHERE name = ?);",
    [tickerName]
  );

  const years: number[] = rows.map((row: any) => Object.values(row)[0] as number);
  console.log("years",years)
  return years;
}
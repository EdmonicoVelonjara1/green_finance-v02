import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export interface IStock {
    date: string,
    open: number,
    high: number,
    low: number,
    close: number,
    adj_close: number
}

export async function POST(tickerName: string) {
  try {
        const rows = await db.query(
    `SELECT date, open, high, low, close, adj_close, volume
     FROM stock_market_data
     WHERE id_ticker IN (SELECT id FROM ticker WHERE name = ?)
     ORDER BY date ASC;`,
    [tickerName]
  );

  const stock: IStock[] = rows.map((row: any) => ({
    date: new Date(row.date).toISOString(),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    adj_close: row.adj_close,
    volume: row.volume
  }));

  return NextResponse.json({
    message: "Envoie de données avec succès",
    data: stock
  })
  } catch (error) {
    return NextResponse.json({
        error: "Erreur lors de l'envoie des données"
    })
  }
}


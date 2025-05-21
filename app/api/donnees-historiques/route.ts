import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { type StockData } from "@/lib/data-utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tickerName = body.company;
    const year = body.year;

    const [rows]: any[] = await db.query(
        `SELECT * FROM story_data WHERE ticker_name = ? AND YEAR(date) = ?;`,
        [tickerName, year]
    );
    console.log("DONNEES HISTORIQUES:", rows)

    const stock : StockData[] = (rows as any[]).map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        adjClose: item.adj_close,
        volume: item.volume
    }))

    return NextResponse.json({ 
        data: stock 
    });
  } catch (error) {
    console.error("Erreur dans /api/get-year:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des données" },
      { status: 500 }
    );
  }
}


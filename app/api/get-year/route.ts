import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tickerName = body.company;

    const [rows]: any[] = await db.query(
        `SELECT DISTINCT YEAR(date) AS year 
         FROM stock_market_data 
         WHERE date IS NOT NULL 
         AND id_ticker IN (SELECT id FROM ticker WHERE name = ?) 
         ORDER BY year DESC;`,
        [tickerName]
    );
    console.log("RAW ROWS:", rows)


    const years: number[] = (rows as Array<{ year: number | null }>)
    .map((row) => row.year)
    .filter((year): year is number => year !== null);
    
    console.log("years", years);
    console.log(JSON.stringify("Ticker = " + tickerName))

    return NextResponse.json({ 
        data: years 
    });
  } catch (error) {
    console.error("Erreur dans /api/get-year:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des données" },
      { status: 500 }
    );
  }
}


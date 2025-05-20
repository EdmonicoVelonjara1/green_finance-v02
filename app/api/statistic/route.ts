import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export interface IStat {
    mean: number
    median: number
    min: number
    max: number
    stdDev: number
    skewness: number
    // kurtosis: number
}

export interface IDailyReturn {
    date: string
    return: number
}

export async function POST(req: Request) {
  if(!req) {
    return NextResponse.json({
        message:"Erreur"
    })
  }
  try {
    const body = await req.json();
    const {company, year } = body;

    const [rows]: any[] = await db.query(
        "SELECT DISTINCT * FROM stat_annual WHERE year = ? AND company = ? ;",
        [year, company]
    );
    const [rows_y]: any[] = await db.query(
        "SELECT DISTINCT date, value FROM yield WHERE YEAR(date) = ? AND id_ticker IN (SELECT id FROM ticker WHERE name = ? );",
        [year, company]
    );
    const [rows_c]: any[] = await db.query(
      "SELECT DISTINCT date, adj_close_return as value FROM cum_return WHERE YEAR(date) = ? AND id_ticker IN ( SELECT id FROM ticker WHERE name = ? );",
      [year, company]
    );
    console.log("RAW ROWS:", rows)

    if(!rows?.length || !rows_y?.length || !rows_c?.length) {
        console.warn("Aucune donnée trouvée pour la réquête.");
        return undefined;
    }

    const stats: IStat | undefined = (rows as any[] ).map(row => ({
        mean: row.mean_price,
        median: row.median_price,
        min: row.min_price,
        max: row.max_price,
        stdDev: row.std_price,
        skewness: row.skewness,
        // kurtosis: 0
    }))[0]

    const daily_return: IDailyReturn[] = (rows_y as any[] ).map(row => ({
        date: new Date(row.date).toDateString(),
        return: row.value,
    }))

    const cum_return: IDailyReturn[] = (rows_c as any[] ).map(row => ({
        date: new Date(row.date).toDateString(),
        return: row.value,
    }))        
    return NextResponse.json({ 
        data: stats,
        yield: daily_return,
        cumulative: cum_return 
    });
  } catch (error) {
    console.error("Erreur dans /api/get-year:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des données" },
      { status: 500 }
    );
  }
}

